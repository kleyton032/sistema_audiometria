# app/config.py
import os
import logging
from pydantic_settings import BaseSettings
from functools import lru_cache

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    ORACLE_USER: str
    ORACLE_PASSWORD: str
    ORACLE_DSN: str

    ORACLE_TEST_USER: str = "system"
    ORACLE_TEST_PASSWORD: str = "oracle"
    ORACLE_TEST_DSN: str = "oracle-test:1521/?service_name=FREEPDB1" if os.getenv("RUNNING_IN_DOCKER") else "localhost:1521/?service_name=FREEPDB1"


    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8 horas — duração de um turno de trabalho

    APP_ENV: str = "development"
    CORS_ORIGINS: list[str] = ["*"]  # Em desenvolvimento, aceita qualquer origem

    class Config:
        env_file = ".env.test" if os.getenv("APP_ENV") == "test" else ".env"
        env_file_encoding = "utf-8"

    def __init__(self, **data):
        super().__init__(**data)
        # Validação ao inicializar
        logger.debug(f"Settings loaded - User: {self.ORACLE_USER}, DSN: {self.ORACLE_DSN}")
        if not all([self.ORACLE_USER, self.ORACLE_PASSWORD, self.ORACLE_DSN]):
            logger.error("Oracle credentials not properly configured!")


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
