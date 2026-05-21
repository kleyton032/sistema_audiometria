# app/dependencies.py
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, SessionTest
from app.core.security import decode_token
from app.db.repositories.user import get_by_login
from app.db.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_test() -> Generator:
    db = SessionTest()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    login = decode_token(token)
    if not login:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = get_by_login(db, login)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def require_perfis(*perfis: str):
    """
    Dependency factory: bloqueia a requisição se o perfil do usuário não estiver na lista.

    Uso:
        @router.get("/admin-only")
        def admin_route(user: User = Depends(require_perfis("ADMIN", "SUPERVISOR"))):
            ...
    """
    def _check(user: User = Depends(get_current_user)) -> User:
        if user.perfil_nome not in perfis:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso restrito. Perfil necessário: {', '.join(perfis)}. "
                       f"Seu perfil: {user.perfil_nome}",
            )
        return user
    return _check
