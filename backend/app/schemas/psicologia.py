# app/schemas/psicologia.py
from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field, field_validator


# ── Protocolo / catálogo ─────────────────────────────────────────────────────

class PsiItemOut(BaseModel):
    id_item:       int
    ds_codigo:     str
    ds_dominio:    str
    nr_ordem:      int
    ds_componente: Optional[str] = None
    ds_criterio:   Optional[str] = None

    model_config = {"from_attributes": True}


class PsiProtocoloOut(BaseModel):
    id_protocolo:   int
    ds_codigo:      str
    nr_versao:      str
    ds_titulo:      str
    nr_idade_min:   Optional[int] = None
    nr_idade_max:   Optional[int] = None
    ds_faixa_etaria: Optional[str] = None
    ds_escala:      Optional[str] = None
    ds_situacao:    str
    itens:          List[PsiItemOut] = []

    model_config = {"from_attributes": True}


# ── Avaliação ────────────────────────────────────────────────────────────────

class PsiAvaliacaoCreate(BaseModel):
    cd_paciente:    str
    cd_atendimento: Optional[str] = None
    dt_clinica:     datetime
    id_protocolo:   int


class PsiRespostaIn(BaseModel):
    id_item:       int
    nr_valor:      int
    ds_observacao: Optional[str] = None

    @field_validator("nr_valor")
    @classmethod
    def valida_valor(cls, v: int) -> int:
        if v not in (0, 1, 2):
            raise ValueError("A resposta deve ser 0, 1 ou 2.")
        return v


class PsiAvaliacaoUpdate(BaseModel):
    respostas:      List[PsiRespostaIn] = []
    ds_observacoes: Optional[str] = None
    ds_evolucao:    Optional[str] = None
    ds_conduta:     Optional[str] = None
    # Controle otimista: o frontend envia a revisão que está editando.
    nr_revisao:     int = 0


class PsiRespostaOut(BaseModel):
    id_item:       int
    ds_codigo:     Optional[str] = None
    ds_dominio:    Optional[str] = None
    nr_valor:      int
    ds_observacao: Optional[str] = None


class PsiAvaliacaoOut(BaseModel):
    id_avaliacao:   int
    cd_paciente:    str
    cd_atendimento: Optional[str] = None
    id_usuario:     int
    cd_prestador:   Optional[int] = None
    dt_clinica:     datetime
    nr_idade_aplicacao: Optional[int] = None
    id_protocolo:   int
    ds_situacao:    str
    ds_observacoes: Optional[str] = None
    ds_evolucao:    Optional[str] = None
    ds_conduta:     Optional[str] = None
    nr_revisao:     int
    dt_criacao:     Optional[datetime] = None
    respostas:      List[PsiRespostaOut] = []


class PsiAvaliacaoListOut(BaseModel):
    total: int
    items: List[PsiAvaliacaoOut] = []
