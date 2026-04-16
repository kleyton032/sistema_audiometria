# app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.schemas.auth import TokenResponse
from app.core.security import verify_password, create_access_token
from app.db.repositories.user import get_by_login
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
