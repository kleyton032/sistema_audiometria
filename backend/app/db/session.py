# app/db/session.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

ORACLE_URL = (
    f"oracle+oracledb://{settings.ORACLE_USER}:{settings.ORACLE_PASSWORD}"
    f"@{settings.ORACLE_DSN}"
)

engine = create_engine(
    ORACLE_URL,
    echo=settings.APP_ENV == "development",  
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass
