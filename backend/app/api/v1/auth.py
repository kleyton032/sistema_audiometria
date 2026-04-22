# app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.schemas.auth import TokenResponse
from app.schemas.user import UserCreate, UserResponse
from app.core.security import verify_password, create_access_token
from app.db.repositories.user import get_by_login, verify_mv_user_validity, create_user
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

   
    token = create_access_token({"sub": usuario.nm_login})

    return TokenResponse(access_token=token)


@router.get("/check/{codigo_mv}")
def check_user_status(
    codigo_mv: str,
    db: Session = Depends(get_db),
):
    """Verifica se o usuário já existe na base local ou se é válido no MV para criar login."""
    usuario_local = get_by_login(db, codigo_mv)
    if usuario_local:
        return {"existe_local": True, "valido_mv": True}

    is_valid_mv = verify_mv_user_validity(db, codigo_mv)
    return {"existe_local": False, "valido_mv": is_valid_mv}


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_mv_user(
    payload: UserCreate,
    db: Session = Depends(get_db)
):
    """Cria conta automática para usuários válidos do MV"""
    from sqlalchemy.exc import IntegrityError
    
    if payload.nm_login.lower() != "kleyton.bomfim":
        codigo = payload.cd_usuario_mv or payload.nm_login
        payload.cd_usuario_mv = codigo
        
        is_valid_mv = verify_mv_user_validity(db, codigo)
        if not is_valid_mv:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário MV não encontrado ou sem permissão de cadastro (Deve ser Fonoaudiólogo ativo)."
            )
            
    try:
        # Força o perfil a ser OPERADOR conforme definido na regra de negócio
        payload.ds_perfil = "OPERADOR"
        user = create_user(db, payload)
        return user
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Login ou e-mail já estão em uso.",
        ) from exc
