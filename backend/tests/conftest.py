"""
Fixtures compartilhadas e configurações para todos os testes.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.dependencies import get_db
from tests.db_tests import db_tests, db_session  # noqa: F401


# ============================
# Cliente de Teste
# ============================

@pytest.fixture(scope="function")
def client(db_session: Session):
    """
    Retorna um cliente HTTP para testar os endpoints.
    Sobrescreve a dependência get_db para usar o banco de testes.
    """
    def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    yield TestClient(app)
    
    # Limpa os overrides
    app.dependency_overrides.clear()


# ============================
# Utilitários
# ============================

@pytest.fixture
def test_user_data():
    """Retorna dados de usuário para testes."""
    return {
        "nm_login": "testuser",
        "nm_usuario": "Test User",
        "ds_email": "test@example.com",
        "ds_senha": "SecurePassword123!",
        "nr_conselho": "12345",
        "ds_especialidade": "Audiologia",
        "ds_perfil": "OPERADOR",
    }


@pytest.fixture
def test_admin_data():
    """Retorna dados de usuário admin para testes."""
    return {
        "nm_login": "admin",
        "nm_usuario": "Administrator",
        "ds_email": "admin@example.com",
        "ds_senha": "AdminPassword123!",
        "nr_conselho": "99999",
        "ds_especialidade": "Administração",
        "ds_perfil": "ADMIN",
    }

