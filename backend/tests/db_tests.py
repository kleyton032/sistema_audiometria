"""
Fixtures de banco de dados para testes.

Contém as configurações e fixtures do SQLite em memória.
"""
import pytest
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker, Session

from app.db.models import Base


@pytest.fixture(scope="function")
def db_tests():
    """
    Cria um banco de dados SQLite em memória para testes.
    Cada teste recebe um banco isolado.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Cria todas as tabelas
    Base.metadata.create_all(bind=engine)
    
    yield engine
    
    # Limpa após o teste
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(db_tests):
    connection = db_tests.connect()
    transaction = connection.begin()
    session = sessionmaker(autocommit=False, autoflush=False, bind=connection)()
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()
