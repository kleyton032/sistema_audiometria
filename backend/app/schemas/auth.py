# app/schemas/auth.py
from pydantic import BaseModel


class LoginInput(BaseModel):
    username: str    
    password: str   


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: str | None = None


class ChangePasswordRequest(BaseModel):
    username: str
    current_password: str
    new_password: str
