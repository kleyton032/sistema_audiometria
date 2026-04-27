# app/schemas/exame.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# ── Payload de criação / atualização ────────────────────────────────────────

class ExameAudiometriaCreate(BaseModel):
    id_paciente:          int
    id_atendimento:       Optional[int]   = None
    ds_queixa_principal:  Optional[str]   = None
    fl_cae_od_obstruido:  int             = 0
    fl_cae_oe_obstruido:  int             = 0
    ds_observacoes:       Optional[str]   = None

    # Limiares OD — via aérea
    od_va_250:  Optional[float] = None
    od_va_500:  Optional[float] = None
    od_va_1000: Optional[float] = None
    od_va_2000: Optional[float] = None
    od_va_3000: Optional[float] = None
    od_va_4000: Optional[float] = None
    od_va_6000: Optional[float] = None
    od_va_8000: Optional[float] = None

    # Limiares OD — via óssea
    od_vo_500:  Optional[float] = None
    od_vo_1000: Optional[float] = None
    od_vo_2000: Optional[float] = None
    od_vo_4000: Optional[float] = None

    # Limiares OE — via aérea
    oe_va_250:  Optional[float] = None
    oe_va_500:  Optional[float] = None
    oe_va_1000: Optional[float] = None
    oe_va_2000: Optional[float] = None
    oe_va_3000: Optional[float] = None
    oe_va_4000: Optional[float] = None
    oe_va_6000: Optional[float] = None
    oe_va_8000: Optional[float] = None

    # Limiares OE — via óssea
    oe_vo_500:  Optional[float] = None
    oe_vo_1000: Optional[float] = None
    oe_vo_2000: Optional[float] = None
    oe_vo_4000: Optional[float] = None

    # Logoaudiometria
    od_lrf:      Optional[float] = None
    od_iprf_mon: Optional[float] = None
    od_iprf_int: Optional[float] = None
    oe_lrf:      Optional[float] = None
    oe_iprf_mon: Optional[float] = None
    oe_iprf_int: Optional[float] = None

    # Classificação
    nr_media_od: Optional[float] = None
    nr_media_oe: Optional[float] = None
    ds_class_od: Optional[str]   = None
    ds_class_oe: Optional[str]   = None
    ds_tipo_od:  Optional[str]   = None
    ds_tipo_oe:  Optional[str]   = None
    ds_conclusao: Optional[str]  = None


# ── Response ─────────────────────────────────────────────────────────────────

class ResultadoAudioResponse(BaseModel):
    id_resultado: int
    id_exame:     int

    od_va_250:  Optional[float] = None
    od_va_500:  Optional[float] = None
    od_va_1000: Optional[float] = None
    od_va_2000: Optional[float] = None
    od_va_3000: Optional[float] = None
    od_va_4000: Optional[float] = None
    od_va_6000: Optional[float] = None
    od_va_8000: Optional[float] = None

    od_vo_500:  Optional[float] = None
    od_vo_1000: Optional[float] = None
    od_vo_2000: Optional[float] = None
    od_vo_4000: Optional[float] = None

    oe_va_250:  Optional[float] = None
    oe_va_500:  Optional[float] = None
    oe_va_1000: Optional[float] = None
    oe_va_2000: Optional[float] = None
    oe_va_3000: Optional[float] = None
    oe_va_4000: Optional[float] = None
    oe_va_6000: Optional[float] = None
    oe_va_8000: Optional[float] = None

    oe_vo_500:  Optional[float] = None
    oe_vo_1000: Optional[float] = None
    oe_vo_2000: Optional[float] = None
    oe_vo_4000: Optional[float] = None

    od_lrf:      Optional[float] = None
    od_iprf_mon: Optional[float] = None
    od_iprf_int: Optional[float] = None
    oe_lrf:      Optional[float] = None
    oe_iprf_mon: Optional[float] = None
    oe_iprf_int: Optional[float] = None

    nr_media_od: Optional[float] = None
    nr_media_oe: Optional[float] = None
    ds_class_od: Optional[str]   = None
    ds_class_oe: Optional[str]   = None
    ds_tipo_od:  Optional[str]   = None
    ds_tipo_oe:  Optional[str]   = None
    ds_conclusao: Optional[str]  = None

    model_config = {"from_attributes": True}


class ExameResponse(BaseModel):
    id_exame:            int
    id_paciente:         int
    id_atendimento:      Optional[int] = None
    ds_tipo:             str
    ds_status:           str
    ds_queixa_principal: Optional[str] = None
    fl_cae_od_obstruido: int           = 0
    fl_cae_oe_obstruido: int           = 0
    ds_observacoes:      Optional[str] = None
    dt_exame:            datetime
    resultado_audio:     Optional[ResultadoAudioResponse] = None

    model_config = {"from_attributes": True}


class LaudoResponse(BaseModel):
    id_laudo:         int
    id_exame:         int
    nm_arquivo:       str
    nr_tamanho_bytes: Optional[int] = None
    dt_geracao:       datetime
    ds_status:        str

    model_config = {"from_attributes": True}
