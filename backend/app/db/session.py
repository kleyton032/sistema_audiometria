import os
import logging
import oracledb
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

logger = logging.getLogger(__name__)

try:
    if os.path.exists("/opt/oracle/instantclient_19_22"):
        logger.info("Inicializando oracledb com lib_dir do Docker")
        oracledb.init_oracle_client(lib_dir="/opt/oracle/instantclient_19_22")
    elif os.path.exists(r"C:\app\product\19.0.0\client_1\bin"):
        logger.info("Inicializando oracledb com lib_dir do Windows")
        oracledb.init_oracle_client(lib_dir=r"C:\app\product\19.0.0\client_1\bin")
    else:
        logger.info("Inicializando oracledb em modo thin (sem especificar lib_dir)")
        oracledb.init_oracle_client()
except Exception as e:
    logger.warning(f"Aviso ao inicializar oracledb: {e}")

ORACLE_URL = f"oracle+oracledb://{settings.ORACLE_USER}:{settings.ORACLE_PASSWORD}@{settings.ORACLE_DSN}"

logger.info(f"Oracle DSN configurado: {settings.ORACLE_DSN}")

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
