# app/api/v1/agenda.py
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.db.models import User
from app.db.repositories.agenda import get_cd_prestador_by_mv_user, get_agenda_do_dia
from app.schemas.agenda import AgendaItem, AgendaListResponse

router = APIRouter(prefix="/agenda", tags=["Agenda / Pacientes"])


@router.get("/pacientes", response_model=AgendaListResponse)
def listar_pacientes(
    data: date = Query(default=None, description="Data de referência (YYYY-MM-DD). Padrão: hoje."),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Lista os pacientes agendados para o prestador do usuário logado.
    Requer que o usuário tenha um cd_usuario_mv associado e que esse
    usuário do MV possua um cd_prestador cadastrado.
    """
    if not current_user.cd_usuario_mv:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário não possui código MV associado.",
        )

    cd_prestador = get_cd_prestador_by_mv_user(db, current_user.cd_usuario_mv)

    if cd_prestador is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuário MV '{current_user.cd_usuario_mv}' não encontrado em dbasgu.usuarios.",
        )

    data_ref = data or date.today()

    rows = get_agenda_do_dia(db, cd_prestador, data_ref)

    def fmt_hora(v) -> str | None:
        if v is None:
            return None
        if hasattr(v, "strftime"):
            return v.strftime("%H:%M")
        return str(v)[:5]  # fallback para string "HH:MM:SS" → "HH:MM"

    items = [
        AgendaItem(
            cd_agenda_central=row.get("CD_AGENDA_CENTRAL"),
            hr_agenda=fmt_hora(row.get("HR_AGENDA")),
            dt_agenda=row.get("DT_AGENDA"),
            cd_paciente=row.get("CD_PACIENTE"),
            nm_paciente=row.get("NM_PACIENTE"),
            cd_item_agendamento=row.get("CD_ITEM_AGENDAMENTO"),
            sn_falta=row.get("SN_FALTA"),
            sn_atendido=row.get("SN_ATENDIDO"),
            nr_fone=row.get("NR_FONE"),
            cd_atendimento=row.get("CD_ATENDIMENTO"),
            cd_convenio=row.get("CD_CONVENIO"),
            cd_prestador=row.get("CD_PRESTADOR"),
            cd_setor=row.get("CD_SETOR"),
            tp_situacao=row.get("TP_SITUACAO"),
            cd_unidade_atendimento=row.get("CD_UNIDADE_ATENDIMENTO"),
            ds_observacao=row.get("DS_OBSERVACAO"),
            ds_consultorio=row.get("DS_CONSULTORIO"),
            sn_encaixe=row.get("SN_ENCAIXE"),
        )
        for row in rows
    ]

    return AgendaListResponse(
        total=len(items),
        items=items,
        data_referencia=data_ref,
    )
