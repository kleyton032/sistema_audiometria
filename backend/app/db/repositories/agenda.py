# app/db/repositories/agenda.py
from datetime import date
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.sql import text


def get_cd_prestador_by_mv_user(db: Session, cd_usuario_mv: str) -> Optional[int]:
    query = text("""
        SELECT u.cd_prestador
        FROM dbasgu.usuarios u
        WHERE UPPER(u.cd_usuario) = UPPER(:cd_usuario)
          AND u.sn_ativo = 'S'
          AND u.cd_prestador IS NOT NULL
          AND ROWNUM = 1
    """)
    result = db.execute(query, {"cd_usuario": cd_usuario_mv.strip()}).first()
    if result:
        return result[0]


    try:
        return int(cd_usuario_mv.strip())
    except (ValueError, AttributeError):
        return None


def get_agenda_do_dia(
    db: Session,
    cd_prestador: int,
    data_ref: date,
) -> list[dict]:
    query = text("""
        SELECT
            V.CD_AGENDA_CENTRAL,
            V.HR_AGENDA,
            V.DT_AGENDA,
            V.CD_PACIENTE,
            V.NM_PACIENTE,
            V.CD_ITEM_AGENDAMENTO,
            IT.DS_ITEM_AGENDAMENTO,
            V.SN_FALTA,
            V.SN_ATENDIDO,
            V.NR_FONE,
            V.CD_ATENDIMENTO,
            V.CD_CONVENIO,
            V.CD_PRESTADOR,
            V.CD_SETOR,
            V.TP_SITUACAO,
            V.CD_UNIDADE_ATENDIMENTO,
            V.DS_OBSERVACAO,
            V.DS_CONSULTORIO,
            V.SN_ENCAIXE
        FROM dbamv.VDIC_RECEPCAO_AGENDA V
        LEFT JOIN dbamv.ITEM_AGENDAMENTO IT ON V.CD_ITEM_AGENDAMENTO = IT.CD_ITEM_AGENDAMENTO
        WHERE TRUNC(V.dt_agenda) = TO_DATE(:data_ref, 'YYYY-MM-DD')
          AND V.cd_prestador = :cd_prestador
        ORDER BY
            V.HR_AGENDA ASC,
            V.CD_AGENDA_CENTRAL DESC
    """)

    rows = db.execute(query, {
        "data_ref":     data_ref.strftime("%Y-%m-%d"),
        "cd_prestador": cd_prestador,
    }).mappings().all()

    return [{k.upper(): v for k, v in row.items()} for row in rows]
