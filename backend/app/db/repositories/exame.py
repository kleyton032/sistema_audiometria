# app/db/repositories/exame.py
import hashlib
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.sql import text

from app.db.models import Exame, ResultadoAudio, Laudo
from app.schemas.exame import ExameAudiometriaCreate

_RESULTADO_FIELDS = [
    "od_va_250", "od_va_500", "od_va_1000", "od_va_2000",
    "od_va_3000", "od_va_4000", "od_va_6000", "od_va_8000",
    "od_vo_500", "od_vo_1000", "od_vo_2000", "od_vo_4000",
    "oe_va_250", "oe_va_500", "oe_va_1000", "oe_va_2000",
    "oe_va_3000", "oe_va_4000", "oe_va_6000", "oe_va_8000",
    "oe_vo_500", "oe_vo_1000", "oe_vo_2000", "oe_vo_4000",
    "od_lrf", "od_iprf_mon", "od_iprf_int",
    "oe_lrf", "oe_iprf_mon", "oe_iprf_int",
    "nr_media_od", "nr_media_oe",
    "ds_class_od", "ds_class_oe",
    "ds_tipo_od", "ds_tipo_oe",
    "ds_conclusao",
]


def get_exame_por_id(db: Session, id_exame: int) -> Optional[Exame]:
    return db.query(Exame).filter(Exame.id_exame == id_exame).first()


def get_exame_por_atendimento(db: Session, cd_atendimento: int) -> Optional[Exame]:
    return (
        db.query(Exame)
        .filter(
            Exame.id_atendimento == cd_atendimento,
            Exame.ds_tipo == "AUDIOMETRIA",
        )
        .order_by(Exame.dt_exame.desc())
        .first()
    )


def criar_exame_audiometria(
    db: Session,
    payload: ExameAudiometriaCreate,
    id_usuario: int,
) -> Exame:
    id_exame = db.execute(
        text("SELECT SEQ_FAV_SILA_EXAMES.NEXTVAL FROM DUAL")
    ).scalar()

    exame = Exame(
        id_exame=id_exame,
        id_paciente=payload.id_paciente,
        id_usuario=id_usuario,
        id_atendimento=payload.id_atendimento,
        ds_tipo="AUDIOMETRIA",
        ds_queixa_principal=payload.ds_queixa_principal,
        fl_cae_od_obstruido=payload.fl_cae_od_obstruido,
        fl_cae_oe_obstruido=payload.fl_cae_oe_obstruido,
        ds_observacoes=payload.ds_observacoes,
        ds_status="RASCUNHO",
    )
    db.add(exame)
    db.flush()

    _criar_resultado(db, id_exame, payload)

    db.commit()
    db.refresh(exame)
    return exame


def atualizar_exame_audiometria(
    db: Session,
    exame: Exame,
    payload: ExameAudiometriaCreate,
) -> Exame:
    exame.ds_queixa_principal = payload.ds_queixa_principal
    exame.fl_cae_od_obstruido = payload.fl_cae_od_obstruido
    exame.fl_cae_oe_obstruido = payload.fl_cae_oe_obstruido
    exame.ds_observacoes = payload.ds_observacoes

    if exame.resultado_audio:
        for field in _RESULTADO_FIELDS:
            setattr(exame.resultado_audio, field, getattr(payload, field, None))
    else:
        _criar_resultado(db, exame.id_exame, payload)

    db.commit()
    db.refresh(exame)
    return exame


def finalizar_exame(db: Session, exame: Exame) -> Exame:
    exame.ds_status = "FINALIZADO"
    db.commit()
    db.refresh(exame)
    return exame


def salvar_laudo(
    db: Session,
    id_exame: int,
    id_usuario: int,
    pdf_bytes: bytes,
    nm_arquivo: str,
) -> Laudo:
    id_laudo = db.execute(
        text("SELECT SEQ_FAV_SILA_LAUDOS.NEXTVAL FROM DUAL")
    ).scalar()

    laudo = Laudo(
        id_laudo=id_laudo,
        id_exame=id_exame,
        id_usuario_gerou=id_usuario,
        nm_arquivo=nm_arquivo,
        bl_pdf=pdf_bytes,
        nr_tamanho_bytes=len(pdf_bytes),
        ds_hash_sha256=hashlib.sha256(pdf_bytes).hexdigest(),
        ds_status="ATIVO",
    )
    db.add(laudo)
    db.commit()
    db.refresh(laudo)
    return laudo


# ── helpers ──────────────────────────────────────────────────────────────────

def _criar_resultado(db: Session, id_exame: int, payload: ExameAudiometriaCreate) -> None:
    id_resultado = db.execute(
        text("SELECT SEQ_FAV_SILA_RES_AUDIO.NEXTVAL FROM DUAL")
    ).scalar()

    resultado = ResultadoAudio(id_resultado=id_resultado, id_exame=id_exame)
    for field in _RESULTADO_FIELDS:
        setattr(resultado, field, getattr(payload, field, None))

    db.add(resultado)
