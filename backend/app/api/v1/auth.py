# app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.schemas.auth import TokenResponse, ChangePasswordRequest
from app.schemas.user import UserCreate, UserResponse, CheckMVResponse
from app.core.security import verify_password, create_access_token, hash_password
from app.db.repositories.user import (
    get_by_login,
    buscar_prestador_mv,
    buscar_usuario_mv,
    create_user,
    sync_existing_user_from_mv,
)
from app.dependencies import get_db

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/token", response_model=TokenResponse)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    usuario = get_by_login(db, form.username)

    if not usuario or not verify_password(form.password, usuario.ds_senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if getattr(usuario, "fl_troca_senha", 0) == 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="REQUIRE_PASSWORD_CHANGE"
        )

    if usuario.cd_usuario_mv:
        usuario = sync_existing_user_from_mv(db, usuario)

    token = create_access_token({"sub": usuario.nm_login})
    return TokenResponse(access_token=token)


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
):
    usuario = get_by_login(db, payload.username)

    if not usuario or not verify_password(payload.current_password, usuario.ds_senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="A senha atual está incorreta."
        )

    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova senha deve ter no mínimo 8 caracteres."
        )

    usuario.ds_senha_hash = hash_password(payload.new_password)
    usuario.fl_troca_senha = 0
    db.commit()

    return {"detail": "Senha alterada com sucesso"}



@router.get("/check/{cd_usuario}", response_model=CheckMVResponse)
def check_user_status(
    cd_usuario: str,
    db: Session = Depends(get_db),
):
    """
    Verifica o usuário MV e retorna seus dados profissionais.

    Cenários possíveis:
    - existe_local=True  → já tem cadastro, pode ir direto para a tela de senha
    - sem_prestador=True → usuário existe no MV mas sem prestador (será CONSULTA)
    - prestador preenchido → usuário com prestador, pode se cadastrar normalmente
    """
    usuario_local = get_by_login(db, cd_usuario.lower())
    if usuario_local:
        return CheckMVResponse(existe_local=True, prestador=None)

    # Verifica se o usuário existe no MV (mesmo sem prestador)
    nm_usuario_mv = buscar_usuario_mv(db, cd_usuario)
    if nm_usuario_mv is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado no MV.",
        )

    # Busca dados do prestador (pode ser None)
    prestador = buscar_prestador_mv(db, cd_usuario)

    if prestador is None:
        # Usuário existe no MV mas não tem prestador → perfil CONSULTA
        return CheckMVResponse(
            existe_local=False,
            prestador=None,
            sem_prestador=True,
        )

    return CheckMVResponse(
        existe_local=False,
        prestador=prestador,
        sem_prestador=False,
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_mv_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Cria conta para usuário válido do MV.

    Se o usuário tiver prestador vinculado, será criado como OPERADOR.
    Se NÃO tiver prestador (sem_prestador), será criado como CONSULTA (somente leitura).
    """
    from sqlalchemy.exc import IntegrityError

    # Verifica se o usuário existe no MV
    nm_usuario_mv = buscar_usuario_mv(db, payload.cd_usuario_mv)
    if nm_usuario_mv is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário MV não encontrado.",
        )

    # Busca dados do prestador (pode ser None para CONSULTA)
    prestador = buscar_prestador_mv(db, payload.cd_usuario_mv)

    try:
        user = create_user(
            db,
            payload,
            prestador=prestador,
            nm_usuario_mv=nm_usuario_mv,
        )
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Login ou e-mail já estão em uso.",
        ) from exc

    # Monta resposta incluindo dados profissionais
    p = user.prestador
    return UserResponse(
        id_usuario         = user.id_usuario,
        cd_usuario_mv      = user.cd_usuario_mv,
        nm_login           = user.nm_login,
        nm_usuario         = user.nm_usuario,
        ds_email           = user.ds_email,
        ds_perfil          = user.ds_perfil,
        dt_criacao         = user.dt_criacao,
        fl_ativo           = user.fl_ativo,
        cd_prestador       = p.cd_prestador       if p else None,
        ds_conselho        = p.ds_conselho        if p else None,
        ds_codigo_conselho = p.ds_codigo_conselho if p else None,
        nm_tip_presta      = p.nm_tip_presta      if p else None,
    )

