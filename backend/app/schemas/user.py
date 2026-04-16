# app/schemas/user.py
from pydantic import BaseModel, EmailStr, field_validator
from typing import Literal, Optional
from datetime import datetime


PerfilLiteral = Literal["ADMIN", "AUDIÓLOGO", "OPERADOR"]


class UserCreate(BaseModel):
    """Payload para criação de um novo usuário."""
    nm_login:         str
    nm_usuario:       str
    ds_email:         EmailStr
    ds_senha:         str           
    nr_conselho:      Optional[str] = None
    ds_especialidade: Optional[str] = None
    ds_perfil:        PerfilLiteral = "OPERADOR"

    @field_validator("nm_login")
    @classmethod
    def login_minimo(cls, v: str) -> str:
        if len(v.strip()) < 3:
            raise ValueError("nm_login deve ter no mínimo 3 caracteres")
        return v.strip().lower()

    @field_validator("ds_senha")
    @classmethod
    def senha_minima(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("A senha deve ter no mínimo 8 caracteres")
        return v


class UserResponse(BaseModel):
    """Dados públicos do usuário retornados pela API (sem hash de senha)."""
    id_usuario:       int
    nm_login:         str
    nm_usuario:       str
    ds_email:         str
    nr_conselho:      Optional[str]
    ds_especialidade: Optional[str]
    ds_perfil:        str
    dt_criacao:       Optional[datetime]
    fl_ativo:         int

    model_config = {"from_attributes": True}
