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
            CD_AGENDA_CENTRAL,
            HR_AGENDA,
            DT_AGENDA,
            CD_PACIENTE,
            NM_PACIENTE,
            CD_ITEM_AGENDAMENTO,
            SN_FALTA,
            SN_ATENDIDO,
            NR_FONE,
            CD_ATENDIMENTO,
            CD_CONVENIO,
            CD_PRESTADOR,
            CD_SETOR,
            TP_SITUACAO,
            CD_UNIDADE_ATENDIMENTO,
            DS_OBSERVACAO,
            DS_CONSULTORIO,
            SN_ENCAIXE
        FROM dbamv.VDIC_RECEPCAO_AGENDA
        WHERE TRUNC(dt_agenda) = TO_DATE(:data_ref, 'YYYY-MM-DD')
          AND cd_prestador = :cd_prestador
        ORDER BY
            HR_AGENDA ASC,
            CD_AGENDA_CENTRAL DESC
    """)

    rows = db.execute(query, {
        "data_ref":     data_ref.strftime("%Y-%m-%d"),
        "cd_prestador": cd_prestador,
    }).mappings().all()

    return [{k.upper(): v for k, v in row.items()} for row in rows]
