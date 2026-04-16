# app/db/repositories/user.py
from sqlalchemy.orm import Session
from app.db.models import User
from app.schemas.user import UserCreate
from app.core.security import hash_password


def get_by_login(db: Session, login: str) -> User | None:
    return (
        db.query(User)
        .filter(User.nm_login == login, User.fl_ativo == 1)
        .first()
    )


def get_by_id(db: Session, id_user: int) -> User | None:
    return db.query(User).filter(
        User.id_usuario == id_user,
        User.fl_ativo == 1
    ).first()


def create_user(db: Session, payload: UserCreate) -> User:
    new_user = User(
        nm_login         = payload.nm_login,
        nm_usuario       = payload.nm_usuario,
        ds_email         = payload.ds_email,
        ds_senha_hash    = hash_password(payload.ds_senha),
        nr_conselho      = payload.nr_conselho,
        ds_especialidade = payload.ds_especialidade,
        ds_perfil        = payload.ds_perfil,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
