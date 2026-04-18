import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from app.main import app
from app.dependencies import get_current_user
from app.db.models import User


# Helper para mockar um usuário admin autenticado
def override_get_current_user_admin():
    return User(
        nm_login="admin",
        nm_usuario="Admin",
        ds_email="admin@test.com",
        ds_perfil="ADMIN",
        fl_ativo=1
    )


# Helper para mockar um usuário comum
def override_get_current_user_operador():
    return User(
        nm_login="operador",
        nm_usuario="Operador",
        ds_email="operador@test.com",
        ds_perfil="OPERADOR",
        fl_ativo=1
    )


def setup_auth_override(is_admin=True):
    if is_admin:
        app.dependency_overrides[get_current_user] = override_get_current_user_admin
    else:
        app.dependency_overrides[get_current_user] = override_get_current_user_operador


def teardown_auth_override():
    app.dependency_overrides.pop(get_current_user, None)


class TestCreateUser:

    @pytest.fixture(autouse=True)
    def setup_teardown(self):
        setup_auth_override(is_admin=True)
        yield
        teardown_auth_override()

    @patch("app.api.v1.users.verify_mv_user_validity")
    def test_create_user_success_with_valid_mv(self, mock_verify, client: TestClient, test_user_data):
        # Configura o mock do MV para retornar True (usuário existe, ativo e é prestador 6)
        mock_verify.return_value = True

        payload = test_user_data.copy()
        payload["cd_usuario_mv"] = "VALID_USER"

        response = client.post("/api/v1/users/", json=payload)
        
        assert response.status_code == 201
        data = response.json()
        assert data["nm_login"] == test_user_data["nm_login"]
        assert data["cd_usuario_mv"] == "VALID_USER"
        mock_verify.assert_called_once()

    def test_create_user_fails_missing_mv_code(self, client: TestClient, test_user_data):
        payload = test_user_data.copy()
        # Sem 'cd_usuario_mv' no payload e sem ser o bypass logado

        response = client.post("/api/v1/users/", json=payload)
        
        assert response.status_code == 400
        assert "cd_usuario_mv" in response.json()["detail"]

    @patch("app.api.v1.users.verify_mv_user_validity")
    def test_create_user_fails_invalid_mv(self, mock_verify, client: TestClient, test_user_data):
        # Configura o mock mv_user_validity para retornar falso
        mock_verify.return_value = False

        payload = test_user_data.copy()
        payload["cd_usuario_mv"] = "INVALID_USER"

        response = client.post("/api/v1/users/", json=payload)
        
        assert response.status_code == 400
        assert "Usuário MV inválido" in response.json()["detail"]
        mock_verify.assert_called_once()

    @patch("app.api.v1.users.verify_mv_user_validity")
    def test_create_user_bypass_kleyton(self, mock_verify, client: TestClient):
        # Usuário especial não valida no MV
        payload = {
            "nm_login": "kleyton.bomfim",
            "nm_usuario": "Kleyton Bomfim",
            "ds_email": "kleyton@example.com",
            "ds_senha": "StrongPassword123!",
            "ds_perfil": "ADMIN"
        }

        response = client.post("/api/v1/users/", json=payload)
        
        assert response.status_code == 201
        data = response.json()
        assert data["nm_login"] == "kleyton.bomfim"
        # O banco MV não deve ser consultado
        mock_verify.assert_not_called()

    def test_create_user_forbidden_for_non_admin(self, client: TestClient, test_user_data):
        # Override temporário
        setup_auth_override(is_admin=False)
        
        payload = test_user_data.copy()

        response = client.post("/api/v1/users/", json=payload)
        
        assert response.status_code == 403
        
        # Limpa override alterado
        teardown_auth_override()
