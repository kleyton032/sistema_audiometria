# app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.schemas.auth import TokenResponse
from app.schemas.user import UserCreate, UserResponse, CheckMVResponse
from app.core.security import verify_password, create_access_token
from app.db.repositories.user import (
    get_by_login,
    buscar_prestador_mv,
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

    if usuario.cd_usuario_mv and usuario.prestador is None:
        usuario = sync_existing_user_from_mv(db, usuario)

    token = create_access_token({"sub": usuario.nm_login})
    return TokenResponse(access_token=token)


@router.get("/check/{cd_usuario}", response_model=CheckMVResponse)
def check_user_status(
    cd_usuario: str,
    db: Session = Depends(get_db),
):
    """
    Verifica o usuário MV e retorna seus dados profissionais.
    - existe_local=True  → já tem cadastro, pode ir direto para a tela de senha
    - prestador=None     → usuário não encontrado no MV, não pode se cadastrar
    """
    usuario_local = get_by_login(db, cd_usuario.lower())
    if usuario_local:
        return CheckMVResponse(existe_local=True, prestador=None)

    prestador = buscar_prestador_mv(db, cd_usuario)
    if prestador is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado no MV ou sem vínculo com prestador ativo.",
        )

    return CheckMVResponse(existe_local=False, prestador=prestador)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_mv_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
):
    """Cria conta para usuário válido do MV. Dados profissionais são buscados automaticamente."""
    from sqlalchemy.exc import IntegrityError

    # Busca dados do prestador no MV
    prestador = buscar_prestador_mv(db, payload.cd_usuario_mv)
    if prestador is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário MV não encontrado ou sem vínculo com prestador ativo.",
        )

    payload.ds_perfil = "OPERADOR"

    try:
        user = create_user(db, payload, prestador)
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

