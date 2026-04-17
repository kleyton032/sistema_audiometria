"""
Testes unitários para funções de segurança (hash de senha, JWT).

Valida:
- Hash e verificação de senha
- Criação e decodificação de token JWT
- Expiração de token
- Casos de erro
"""
import pytest
from datetime import datetime, timedelta, timezone
from jose import JWTError

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
)
from app.config import settings


class TestPasswordHashing:
    """Testes para hash de senha."""

    def test_hash_password_creates_hash(self):
        """
        Testa que a senha é hashida corretamente.
        """
        password = "MySecurePassword123!"
        hashed = hash_password(password)
        
        assert hashed != password
        assert len(hashed) > len(password)
        assert hashed.startswith("$2")  # bcrypt hash começa com $2

    def test_verify_password_correct(self):
        """
        Testa verificação de senha correta.
        """
        password = "MySecurePassword123!"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """
        Testa verificação de senha incorreta.
        """
        password = "MySecurePassword123!"
        wrong_password = "DifferentPassword456!"
        hashed = hash_password(password)
        
        assert verify_password(wrong_password, hashed) is False

    def test_verify_password_different_hashes(self):
        """
        Testa que a mesma senha resulta em hashes diferentes (salt aleatório).
        """
        password = "MySecurePassword123!"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        
        assert hash1 != hash2
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True

    def test_hash_empty_password(self):
        """
        Testa hash de senha vazia (edge case).
        """
        password = ""
        hashed = hash_password(password)
        
        assert hashed != password
        assert verify_password(password, hashed) is True


class TestJWT:
    """Testes para criação e decodificação de JWT."""

    def test_create_token_success(self):
        """
        Testa criação bem-sucedida de token JWT.
        """
        data = {"sub": "testuser"}
        token = create_access_token(data)
        
        assert isinstance(token, str)
        assert len(token) > 0
        parts = token.split(".")
        assert len(parts) == 3  # JWT tem 3 partes

    def test_decode_token_success(self):
        """
        Testa decodificação bem-sucedida de token JWT.
        """
        username = "testuser"
        data = {"sub": username}
        token = create_access_token(data)
        
        decoded = decode_token(token)
        assert decoded == username

    def test_decode_invalid_token(self):
        """
        Testa decodificação de token inválido.
        """
        invalid_token = "invalid.token.here"
        
        decoded = decode_token(invalid_token)
        assert decoded is None

    def test_decode_expired_token(self):
        """
        Testa decodificação de token expirado.
        """
        data = {"sub": "testuser"}
        
        # Criar um token com expiração no passado
        import json
        from jose import jwt as jose_jwt
        import base64
        
        # Calcula expiração no passado
        expires_at = datetime.now(timezone.utc) - timedelta(hours=1)
        payload = {
            **data,
            "exp": int(expires_at.timestamp()),
        }
        
        expired_token = jose_jwt.encode(
            payload,
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )
        
        # Tentar decodificar
        decoded = decode_token(expired_token)
        assert decoded is None

    def test_token_contains_username(self):
        """
        Testa que o token contém o username correto.
        """
        username = "audiologa_maria"
        data = {"sub": username}
        token = create_access_token(data)
        
        decoded = decode_token(token)
        assert decoded == username

    def test_token_expiration_time(self):
        """
        Testa que o token tem o tempo de expiração correto.
        """
        from jose import jwt as jose_jwt
        
        data = {"sub": "testuser"}
        token = create_access_token(data)
        
        # Decodificar sem validar expiração
        payload = jose_jwt.get_unverified_claims(token)
        
        # Verificar que exp foi adicionado
        assert "exp" in payload
        
        # Verificar que exp está próximo do tempo esperado
        exp_time = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        now = datetime.now(timezone.utc)
        diff = (exp_time - now).total_seconds()
        
        # Deve ser próximo ao ACCESS_TOKEN_EXPIRE_MINUTES
        expected_diff = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        assert abs(diff - expected_diff) < 60  # 60 segundos de margem

    def test_token_modified_raises_error(self):
        """
        Testa que token modificado é rejeitado.
        """
        data = {"sub": "testuser"}
        token = create_access_token(data)
        
        # Modificar o token (trocar um caractere)
        modified_token = token[:-5] + "xxxxx"
        
        decoded = decode_token(modified_token)
        assert decoded is None

    def test_token_with_wrong_secret_key(self):
        """
        Testa que token criado com chave diferente não é validado.
        """
        from jose import jwt as jose_jwt
        
        data = {"sub": "testuser"}
        
        # Criar token com uma secret key diferente
        wrong_token = jose_jwt.encode(
            {
                **data,
                "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
            },
            "wrong_secret_key",
            algorithm=settings.ALGORITHM,
        )
        
        # Tentar decodificar com a secret key correta
        decoded = decode_token(wrong_token)
        assert decoded is None
