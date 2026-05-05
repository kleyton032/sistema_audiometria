# app/api/v1/agenda.py
from datetime import date, datetime
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.db.models import User
from app.db.repositories.agenda import get_cd_prestador_by_mv_user, get_agenda_do_dia
from app.schemas.agenda import AgendaItem, AgendaListResponse

router = APIRouter(prefix="/agenda", tags=["Agenda / Pacientes"])

logger = logging.getLogger(__name__)


@router.get("/debug-user", summary="Diagnóstico: retorna cd_prestador resolvido para o usuário logado")
def debug_user(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cd_prestador = get_cd_prestador_by_mv_user(db, current_user.cd_usuario_mv or "") if current_user.cd_usuario_mv else None
    return {
        "nm_login": current_user.nm_login,
        "cd_usuario_mv": current_user.cd_usuario_mv,
        "cd_prestador_resolvido": cd_prestador,
        "id_usuario": current_user.id_usuario,
    }


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

    logger.warning(f"[AGENDA] login={current_user.nm_login} | cd_usuario_mv={current_user.cd_usuario_mv} | cd_prestador={cd_prestador} | data={data or date.today()}")

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
        s = str(v)
        # "HH:MM:SS" → "HH:MM"
        return s[:5] if len(s) >= 5 else s

    seen = set()
    items = []
    for row in rows:
        cd_atend = row.get("CD_ATENDIMENTO")
        cd_agenda = row.get("CD_AGENDA_CENTRAL")
        
        # Chave para deduplicar: priorizamos CD_ATENDIMENTO, depois CD_AGENDA_CENTRAL
        dup_key = f"atend_{cd_atend}" if cd_atend else f"agenda_{cd_agenda}" if cd_agenda else f"pac_{row.get('CD_PACIENTE')}_{fmt_hora(row.get('HR_AGENDA'))}"
        
        if dup_key in seen:
            continue
        seen.add(dup_key)
        
        items.append(
            AgendaItem(
                cd_agenda_central=cd_agenda,
                hr_agenda=fmt_hora(row.get("HR_AGENDA")),
                dt_agenda=row.get("DT_AGENDA"),
                cd_paciente=row.get("CD_PACIENTE"),
                nm_paciente=row.get("NM_PACIENTE"),
                cd_item_agendamento=row.get("CD_ITEM_AGENDAMENTO"),
                ds_item_agendamento=row.get("DS_ITEM_AGENDAMENTO"),
                sn_falta=row.get("SN_FALTA"),
                sn_atendido=row.get("SN_ATENDIDO"),
                nr_fone=row.get("NR_FONE"),
                cd_atendimento=cd_atend,
                cd_convenio=row.get("CD_CONVENIO"),
                cd_prestador=row.get("CD_PRESTADOR"),
                cd_setor=row.get("CD_SETOR"),
                tp_situacao=row.get("TP_SITUACAO"),
                cd_unidade_atendimento=row.get("CD_UNIDADE_ATENDIMENTO"),
                ds_observacao=row.get("DS_OBSERVACAO"),
                ds_consultorio=row.get("DS_CONSULTORIO"),
                sn_encaixe=row.get("SN_ENCAIXE"),
            )
        )

    return AgendaListResponse(
        total=len(items),
        items=items,
        data_referencia=data_ref,
    )
