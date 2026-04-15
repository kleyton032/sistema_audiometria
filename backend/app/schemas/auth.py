# app/schemas/auth.py
from pydantic import BaseModel


class LoginInput(BaseModel):
    username: str    # valor do campo de login
    password: str    # senha em texto plano (será verificada contra o hash)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: str | None = None
