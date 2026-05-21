# app/schemas/admin.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class UserAdminResponse(BaseModel):
    """Dados completos de um usuário para o painel administrativo."""
    id_usuario:         int
    cd_usuario_mv:      Optional[str]
    nm_login:           str
    nm_usuario:         str
    ds_email:           str
    ds_perfil:          str
    id_perfil:          Optional[int]
    fl_ativo:           int
    dt_criacao:         Optional[datetime]
    dt_ultimo_acesso:   Optional[datetime]
    cd_prestador:       Optional[int]   = None
    nm_tip_presta:      Optional[str]   = None
    ds_conselho:        Optional[str]   = None
    ds_codigo_conselho: Optional[str]   = None
    ds_especialidade:   Optional[str]   = None
    nr_conselho:        Optional[str]   = None

    model_config = {"from_attributes": True}


class UpdatePerfilRequest(BaseModel):
    ds_perfil: str  # "ADMIN" | "SUPERVISOR" | "COORDENADOR" | "OPERADOR"


class UpdateStatusRequest(BaseModel):
    fl_ativo: int  # 1 = ativo, 0 = inativo


class ResetPasswordRequest(BaseModel):
    nova_senha: str

    @classmethod
    def __get_validators__(cls):
        yield cls._validate

    @classmethod
    def _validate(cls, v):
        return v


class PerfilPermissaoResponse(BaseModel):
    id_perfil:    int
    ds_perfil:    str
    ds_descricao: Optional[str]
    permissoes:   List[str]

    model_config = {"from_attributes": True}


class AuditLogResponse(BaseModel):
    id_log:       int
    nm_tabela:    str
    tp_operacao:  str   # INSERT | UPDATE | DELETE
    nm_login:     Optional[str]
    nm_usuario:   Optional[str]
    dt_operacao:  datetime
    ds_descricao: Optional[str]
    ds_valores_anteriores: Optional[str]
    ds_valores_novos:      Optional[str]

    model_config = {"from_attributes": True}


class SystemLogResponse(BaseModel):
    id_log:       int
    tp_nivel:     str  # ERROR | WARNING | INFO
    nm_modulo:    Optional[str]
    ds_mensagem:  str
    ds_detalhe:   Optional[str]
    nm_login:     Optional[str]
    dt_criacao:   datetime

    model_config = {"from_attributes": True}


class AdminStatsResponse(BaseModel):
    total_usuarios:    int
    usuarios_ativos:   int
    usuarios_inativos: int
    sem_perfil:        int
    por_perfil:        dict
    logs_hoje:         int
    erros_hoje:        int
