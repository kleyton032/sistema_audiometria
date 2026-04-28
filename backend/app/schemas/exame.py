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
    od_lrf:         Optional[float] = None
    od_iprf_mon:    Optional[float] = None
    od_iprf_int:    Optional[float] = None
    od_iprf_dis:    Optional[float] = None
    od_iprf_dis_db: Optional[float] = None
    od_iprf_tri:    Optional[float] = None
    od_iprf_tri_db: Optional[float] = None
    od_sdt:         Optional[float] = None

    oe_lrf:         Optional[float] = None
    oe_iprf_mon:    Optional[float] = None
    oe_iprf_int:    Optional[float] = None
    oe_iprf_dis:    Optional[float] = None
    oe_iprf_dis_db: Optional[float] = None
    oe_iprf_tri:    Optional[float] = None
    oe_iprf_tri_db: Optional[float] = None
    oe_sdt:         Optional[float] = None

    # Mascaramento
    od_mask_va:   Optional[float] = None
    od_mask_vo:   Optional[float] = None
    od_mask_lrf:  Optional[float] = None
    od_mask_iprf: Optional[float] = None
    oe_mask_va:   Optional[float] = None
    oe_mask_vo:   Optional[float] = None
    oe_mask_lrf:  Optional[float] = None
    oe_mask_iprf: Optional[float] = None

    # Sem resposta (NR)
    od_va_nr: int = 0
    oe_va_nr: int = 0
    od_vo_nr: int = 0
    oe_vo_nr: int = 0

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

    od_lrf:         Optional[float] = None
    od_iprf_mon:    Optional[float] = None
    od_iprf_int:    Optional[float] = None
    od_iprf_dis:    Optional[float] = None
    od_iprf_dis_db: Optional[float] = None
    od_iprf_tri:    Optional[float] = None
    od_iprf_tri_db: Optional[float] = None
    od_sdt:         Optional[float] = None

    oe_lrf:         Optional[float] = None
    oe_iprf_mon:    Optional[float] = None
    oe_iprf_int:    Optional[float] = None
    oe_iprf_dis:    Optional[float] = None
    oe_iprf_dis_db: Optional[float] = None
    oe_iprf_tri:    Optional[float] = None
    oe_iprf_tri_db: Optional[float] = None
    oe_sdt:         Optional[float] = None

    # Mascaramento
    od_mask_va:   Optional[float] = None
    od_mask_vo:   Optional[float] = None
    od_mask_lrf:  Optional[float] = None
    od_mask_iprf: Optional[float] = None
    oe_mask_va:   Optional[float] = None
    oe_mask_vo:   Optional[float] = None
    oe_mask_lrf:  Optional[float] = None
    oe_mask_iprf: Optional[float] = None

    # Sem resposta (NR)
    od_va_nr: int = 0
    oe_va_nr: int = 0
    od_vo_nr: int = 0
    oe_vo_nr: int = 0

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
    resultado_audio:     Optional[ResultadoAudioResponse]  = None
    resultado_imitan:    Optional["ResultadoImitanResponse"] = None

    model_config = {"from_attributes": True}


class LaudoResponse(BaseModel):
    id_laudo:         int
    id_exame:         int
    nm_arquivo:       str
    nr_tamanho_bytes: Optional[int] = None
    dt_geracao:       datetime
    ds_status:        str

    model_config = {"from_attributes": True}


# ── Imitanciometria ───────────────────────────────────────────────────────────

class ExameImitanciometriaCreate(BaseModel):
    id_paciente:    int
    id_atendimento: Optional[int] = None
    ds_observacoes: Optional[str] = None

    # Timpanograma OD
    od_ecv:        Optional[float] = None
    od_pico:       Optional[float] = None
    od_pressao:    Optional[float] = None
    od_gradiante:  Optional[float] = None
    od_tipo_curva: Optional[str]   = None

    # Timpanograma OE
    oe_ecv:        Optional[float] = None
    oe_pico:       Optional[float] = None
    oe_pressao:    Optional[float] = None
    oe_gradiante:  Optional[float] = None
    oe_tipo_curva: Optional[str]   = None

    # Reflexos OD
    od_contra_500:  Optional[float] = None
    od_contra_1000: Optional[float] = None
    od_contra_2000: Optional[float] = None
    od_contra_4000: Optional[float] = None
    od_ipsi_500:    Optional[float] = None
    od_ipsi_1000:   Optional[float] = None
    od_ipsi_2000:   Optional[float] = None
    od_ipsi_4000:   Optional[float] = None

    # Reflexos OE
    oe_contra_500:  Optional[float] = None
    oe_contra_1000: Optional[float] = None
    oe_contra_2000: Optional[float] = None
    oe_contra_4000: Optional[float] = None
    oe_ipsi_500:    Optional[float] = None
    oe_ipsi_1000:   Optional[float] = None
    oe_ipsi_2000:   Optional[float] = None
    oe_ipsi_4000:   Optional[float] = None

    ds_conclusao: Optional[str] = None


class ResultadoImitanResponse(BaseModel):
    id_resultado: int
    id_exame:     int

    od_ecv:        Optional[float] = None
    od_pico:       Optional[float] = None
    od_pressao:    Optional[float] = None
    od_gradiante:  Optional[float] = None
    od_tipo_curva: Optional[str]   = None

    oe_ecv:        Optional[float] = None
    oe_pico:       Optional[float] = None
    oe_pressao:    Optional[float] = None
    oe_gradiante:  Optional[float] = None
    oe_tipo_curva: Optional[str]   = None

    od_contra_500:  Optional[float] = None
    od_contra_1000: Optional[float] = None
    od_contra_2000: Optional[float] = None
    od_contra_4000: Optional[float] = None
    od_ipsi_500:    Optional[float] = None
    od_ipsi_1000:   Optional[float] = None
    od_ipsi_2000:   Optional[float] = None
    od_ipsi_4000:   Optional[float] = None

    oe_contra_500:  Optional[float] = None
    oe_contra_1000: Optional[float] = None
    oe_contra_2000: Optional[float] = None
    oe_contra_4000: Optional[float] = None
    oe_ipsi_500:    Optional[float] = None
    oe_ipsi_1000:   Optional[float] = None
    oe_ipsi_2000:   Optional[float] = None
    oe_ipsi_4000:   Optional[float] = None

    ds_conclusao: Optional[str] = None

    model_config = {"from_attributes": True}


# ── Consulta Gerencial ────────────────────────────────────────────────────────

class ExameGerencialItem(BaseModel):
    id_exame:       int
    id_paciente:    int
    id_atendimento: Optional[int] = None
    nm_paciente:    Optional[str] = None
    ds_tipo:        str
    ds_status:      str
    dt_exame:       datetime
    nr_laudos:      int = 0


class ExameGerencialResponse(BaseModel):
    total: int
    items: list[ExameGerencialItem]
