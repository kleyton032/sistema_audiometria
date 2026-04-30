# app/schemas/user.py
from pydantic import BaseModel, field_validator
from typing import Literal, Optional
from datetime import datetime


PerfilLiteral = Literal["ADMIN", "AUDIÓLOGO", "OPERADOR"]


class PrestadorMVInfo(BaseModel):
    """Dados do prestador retornados pelo MV no /check."""
    cd_prestador:       int
    nm_prestador:       str
    ds_conselho:        Optional[str] = None   # CREFONO, CREFITO, CRM...
    ds_codigo_conselho: Optional[str] = None   # número do registro
    nm_tip_presta:      Optional[str] = None   # Fonoaudiólogo, Fisioterapeuta...


class CheckMVResponse(BaseModel):
    """Resposta do endpoint GET /auth/check/{cd_usuario}."""
    existe_local: bool
    prestador:    Optional[PrestadorMVInfo] = None  # None se não encontrado no MV


class UserCreate(BaseModel):
    """Payload para criação de um novo usuário."""
    cd_usuario_mv: str
    ds_email:      Optional[str] = None
    ds_senha:      str
    ds_perfil:     PerfilLiteral = "OPERADOR"

    @field_validator("ds_senha")
    @classmethod
    def senha_minima(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("A senha deve ter no mínimo 8 caracteres")
        return v


class UserResponse(BaseModel):
    """Dados públicos do usuário retornados pela API (sem hash de senha)."""
    id_usuario:         int
    cd_usuario_mv:      Optional[str]
    nm_login:           str
    nm_usuario:         str
    ds_email:           str
    ds_perfil:          str
    dt_criacao:         Optional[datetime]
    fl_ativo:           int
    # dados profissionais do MV (pode ser None para usuários antigos sem tabela preenchida)
    cd_prestador:       Optional[int]   = None
    ds_conselho:        Optional[str]   = None
    ds_codigo_conselho: Optional[str]   = None
    nm_tip_presta:      Optional[str]   = None

    model_config = {"from_attributes": True}
