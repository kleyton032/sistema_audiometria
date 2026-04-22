# app/schemas/agenda.py
from pydantic import BaseModel
from typing import Optional
from datetime import date, time, datetime


class AgendaItem(BaseModel):
    """Representa um item de agendamento da view VDIC_RECEPCAO_AGENDA."""

    cd_agenda_central:        Optional[int]   = None
    hr_agenda:                Optional[str]   = None   # hora formatada HH:MM
    dt_agenda:                Optional[date]  = None
    cd_paciente:              Optional[int]   = None
    nm_paciente:              Optional[str]   = None
    cd_item_agendamento:      Optional[int]   = None
    sn_falta:                 Optional[str]   = None
    sn_atendido:              Optional[str]   = None
    nr_fone:                  Optional[str]   = None
    cd_atendimento:           Optional[int]   = None
    cd_convenio:              Optional[int]   = None
    cd_prestador:             Optional[int]   = None
    cd_setor:                 Optional[int]   = None
    tp_situacao:              Optional[str]   = None
    cd_unidade_atendimento:   Optional[int]   = None
    ds_observacao:            Optional[str]   = None
    ds_consultorio:           Optional[str]   = None
    sn_encaixe:               Optional[str]   = None

    model_config = {"from_attributes": True}


class AgendaListResponse(BaseModel):
    """Resposta paginada com lista de agendamentos do dia."""
    total: int
    items: list[AgendaItem]
    data_referencia: date
