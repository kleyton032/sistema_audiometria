# app/db/repositories/user.py
from sqlalchemy.orm import Session
from app.db.models import User


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
