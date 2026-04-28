# app/db/repositories/exame.py
import hashlib
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.sql import text

from app.db.models import Exame, ResultadoAudio, ResultadoImitan, Laudo
from app.schemas.exame import ExameAudiometriaCreate, ExameImitanciometriaCreate


def get_dashboard_stats(db: Session) -> dict:
    audiometrias = db.query(Exame).filter(Exame.ds_tipo == "AUDIOMETRIA").count()
    imitanciometrias = db.query(Exame).filter(Exame.ds_tipo == "IMITANCIOMETRIA").count()
    laudos = db.query(Laudo).filter(Laudo.ds_status == "ATIVO").count()
    return {
        "audiometrias": audiometrias,
        "imitanciometrias": imitanciometrias,
        "laudos_gerados": laudos,
    }


def buscar_exames_gerencial(
    db: Session,
    id_paciente: Optional[int] = None,
    id_atendimento: Optional[int] = None,
    nm_paciente: Optional[str] = None,
    ds_tipo: Optional[str] = None,
    dt_inicio: Optional[str] = None,
    dt_fim: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> dict:
    where_parts = ["1=1"]
    params: dict = {}

    if id_paciente is not None:
        where_parts.append("e.ID_PACIENTE = :id_paciente")
        params["id_paciente"] = id_paciente
    if id_atendimento is not None:
        where_parts.append("e.ID_ATENDIMENTO = :id_atendimento")
        params["id_atendimento"] = id_atendimento
    if nm_paciente:
        where_parts.append("UPPER(p.NM_PACIENTE) LIKE UPPER(:nm_paciente)")
        params["nm_paciente"] = f"%{nm_paciente}%"
    if ds_tipo:
        where_parts.append("e.DS_TIPO = :ds_tipo")
        params["ds_tipo"] = ds_tipo
    if dt_inicio:
        where_parts.append("TRUNC(e.DT_EXAME) >= TO_DATE(:dt_inicio, 'YYYY-MM-DD')")
        params["dt_inicio"] = dt_inicio
    if dt_fim:
        where_parts.append("TRUNC(e.DT_EXAME) <= TO_DATE(:dt_fim, 'YYYY-MM-DD')")
        params["dt_fim"] = dt_fim

    where = "WHERE " + " AND ".join(where_parts)
    join = "LEFT JOIN dbamv.PACIENTE p ON p.CD_PACIENTE = e.ID_PACIENTE"

    count_sql = f"SELECT COUNT(*) FROM FAV_TB_SILA_EXAMES e {join} {where}"
    total = db.execute(text(count_sql), params).scalar() or 0

    end_row = skip + limit
    data_sql = text(f"""
        SELECT ID_EXAME, ID_PACIENTE, ID_ATENDIMENTO, NM_PACIENTE, DS_TIPO, DS_STATUS, DT_EXAME, NR_LAUDOS FROM (
            SELECT a.*, ROWNUM AS rn FROM (
                SELECT
                    e.ID_EXAME,
                    e.ID_PACIENTE,
                    e.ID_ATENDIMENTO,
                    p.NM_PACIENTE,
                    e.DS_TIPO,
                    e.DS_STATUS,
                    e.DT_EXAME,
                    (SELECT COUNT(*) FROM FAV_TB_SILA_LAUDOS l
                     WHERE l.ID_EXAME = e.ID_EXAME AND l.DS_STATUS = 'ATIVO') AS NR_LAUDOS
                FROM FAV_TB_SILA_EXAMES e
                {join}
                {where}
                ORDER BY e.DT_EXAME DESC
            ) a WHERE ROWNUM <= :end_row
        ) WHERE rn > :skip
    """)
    rows = db.execute(data_sql, {**params, "skip": skip, "end_row": end_row}).mappings().all()

    return {
        "total": total,
        "items": [
            {
                "id_exame":       row["id_exame"],
                "id_paciente":    row["id_paciente"],
                "id_atendimento": row["id_atendimento"],
                "nm_paciente":    row["nm_paciente"],
                "ds_tipo":        row["ds_tipo"],
                "ds_status":      row["ds_status"],
                "dt_exame":       row["dt_exame"],
                "nr_laudos":      int(row["nr_laudos"] or 0),
            }
            for row in rows
        ],
    }


def listar_laudos_por_exame(db: Session, id_exame: int) -> list:
    return (
        db.query(Laudo)
        .filter(Laudo.id_exame == id_exame, Laudo.ds_status == "ATIVO")
        .order_by(Laudo.dt_geracao.desc())
        .all()
    )


def get_laudo_por_id(db: Session, id_laudo: int) -> Optional[Laudo]:
    return db.query(Laudo).filter(Laudo.id_laudo == id_laudo).first()

_RESULTADO_FIELDS = [
    "od_va_250", "od_va_500", "od_va_1000", "od_va_2000",
    "od_va_3000", "od_va_4000", "od_va_6000", "od_va_8000",
    "od_vo_500", "od_vo_1000", "od_vo_2000", "od_vo_4000",
    "oe_va_250", "oe_va_500", "oe_va_1000", "oe_va_2000",
    "oe_va_3000", "oe_va_4000", "oe_va_6000", "oe_va_8000",
    "oe_vo_500", "oe_vo_1000", "oe_vo_2000", "oe_vo_4000",
    # Logoaudiometria
    "od_lrf", "od_iprf_mon", "od_iprf_int",
    "od_iprf_dis", "od_iprf_dis_db",
    "od_iprf_tri", "od_iprf_tri_db",
    "od_sdt",
    "oe_lrf", "oe_iprf_mon", "oe_iprf_int",
    "oe_iprf_dis", "oe_iprf_dis_db",
    "oe_iprf_tri", "oe_iprf_tri_db",
    "oe_sdt",
    # Mascaramento
    "od_mask_va", "od_mask_vo", "od_mask_lrf", "od_mask_iprf",
    "oe_mask_va", "oe_mask_vo", "oe_mask_lrf", "oe_mask_iprf",
    # Sem resposta (NR)
    "od_va_nr", "oe_va_nr", "od_vo_nr", "oe_vo_nr",
    # Classificação
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


def get_status_por_atendimentos(
    db: Session, cd_atendimentos: list[int]
) -> dict[int, dict]:
    """Retorna {cd_atendimento: {tipo, status, id_exame}} para uma lista de atendimentos."""
    if not cd_atendimentos:
        return {}
    rows = (
        db.query(Exame.id_atendimento, Exame.ds_tipo, Exame.ds_status, Exame.id_exame)
        .filter(Exame.id_atendimento.in_(cd_atendimentos))
        .all()
    )
    result: dict[int, dict] = {}
    for row in rows:
        cd = row.id_atendimento
        # Prioriza FINALIZADO sobre RASCUNHO se houver dois exames do mesmo atendimento
        existing = result.get(cd)
        if not existing or row.ds_status == "FINALIZADO":
            result[cd] = {
                "id_exame": row.id_exame,
                "ds_tipo": row.ds_tipo,
                "ds_status": row.ds_status,
            }
    return result


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


# ── Imitanciometria ───────────────────────────────────────────────────────────

_IMITAN_FIELDS = [
    "od_ecv", "od_pico", "od_pressao", "od_gradiante", "od_tipo_curva",
    "oe_ecv", "oe_pico", "oe_pressao", "oe_gradiante", "oe_tipo_curva",
    "od_contra_500", "od_contra_1000", "od_contra_2000", "od_contra_4000",
    "od_ipsi_500",   "od_ipsi_1000",   "od_ipsi_2000",   "od_ipsi_4000",
    "oe_contra_500", "oe_contra_1000", "oe_contra_2000", "oe_contra_4000",
    "oe_ipsi_500",   "oe_ipsi_1000",   "oe_ipsi_2000",   "oe_ipsi_4000",
    "ds_conclusao",
]


def get_exame_imitan_por_atendimento(db: Session, cd_atendimento: int) -> Optional[Exame]:
    return (
        db.query(Exame)
        .filter(
            Exame.id_atendimento == cd_atendimento,
            Exame.ds_tipo == "IMITANCIOMETRIA",
        )
        .order_by(Exame.dt_exame.desc())
        .first()
    )


def criar_exame_imitanciometria(
    db: Session,
    payload: ExameImitanciometriaCreate,
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
        ds_tipo="IMITANCIOMETRIA",
        ds_observacoes=payload.ds_observacoes,
        ds_status="RASCUNHO",
    )
    db.add(exame)
    db.flush()

    _criar_resultado_imitan(db, id_exame, payload)

    db.commit()
    db.refresh(exame)
    return exame


def atualizar_exame_imitanciometria(
    db: Session,
    exame: Exame,
    payload: ExameImitanciometriaCreate,
) -> Exame:
    exame.ds_observacoes = payload.ds_observacoes

    if exame.resultado_imitan:
        for field in _IMITAN_FIELDS:
            setattr(exame.resultado_imitan, field, getattr(payload, field, None))
    else:
        _criar_resultado_imitan(db, exame.id_exame, payload)

    db.commit()
    db.refresh(exame)
    return exame


def _criar_resultado_imitan(
    db: Session,
    id_exame: int,
    payload: ExameImitanciometriaCreate,
) -> None:
    id_resultado = db.execute(
        text("SELECT SEQ_FAV_SILA_RES_IMITAN.NEXTVAL FROM DUAL")
    ).scalar()

    resultado = ResultadoImitan(id_resultado=id_resultado, id_exame=id_exame)
    for field in _IMITAN_FIELDS:
        setattr(resultado, field, getattr(payload, field, None))

    db.add(resultado)
