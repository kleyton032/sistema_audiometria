# app/api/v1/pts.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from pydantic import BaseModel

from app.dependencies import get_db, get_current_user
from app.db.models import User

router = APIRouter(prefix="/pts", tags=["PTS"])


class DiagnosticoPrincipalOut(BaseModel):
    ds_diagnostico: str


@router.get(
    "/diagnosticos-principais",
    response_model=list[DiagnosticoPrincipalOut],
    summary="Lista de diagnósticos principais do CER IV",
)
def listar_diagnosticos_principais(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = db.execute(
        text(
            """
            SELECT e.ds_diagnostico
            FROM TB_FAV_DIAGNOSTICO_CERIV e
            WHERE e.id_especialidade = 1
            ORDER BY
                CASE WHEN UPPER(e.ds_diagnostico) = 'NÃO SE APLICA' THEN 0 ELSE 1 END,
                e.ds_diagnostico
            """
        )
    ).fetchall()
    return [{"ds_diagnostico": r[0]} for r in rows]

class EspecialidadeOut(BaseModel):
    cd_especialidade: str
    ds_especialidade: str


@router.get(
    '/especialidades',
    response_model=list[EspecialidadeOut],
    summary='Lista de especialidades (tabela especialid)',
)
def listar_especialidades(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = db.execute(
        text(
            """
            SELECT e.cd_especialid, e.ds_especialid
            FROM especialid e
            ORDER BY e.ds_especialid
            """
        )
    ).fetchall()
    return [{'cd_especialidade': str(r[0]), 'ds_especialidade': r[1]} for r in rows]


class ItemMultidisciplinarOut(BaseModel):
    cd_item: str
    ds_item: str


@router.get(
    '/itens-multidisciplinar',
    response_model=list[ItemMultidisciplinarOut],
    summary='Lista de itens para atendimento multidisciplinar (avaliação/rastreio)',
)
def listar_itens_multidisciplinar(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = db.execute(
        text(
            """
            SELECT '' || i.cd_item_agendamento, i.ds_item_agendamento
            FROM fav_item_cer4 c,
                 item_agendamento i
            WHERE c.cd_item_agendamento = i.cd_item_agendamento
            AND   (i.ds_item_agendamento LIKE '%AVALIA%'
            OR    i.ds_item_agendamento LIKE '%RASTREIO%')
            ORDER BY i.ds_item_agendamento
            """
        )
    ).fetchall()
    return [{'cd_item': str(r[0]), 'ds_item': r[1]} for r in rows]


class TerapiaIndicadaOut(BaseModel):
    cd_item: str
    ds_item: str


@router.get(
    '/terapias-indicadas',
    response_model=list[TerapiaIndicadaOut],
    summary='Lista de terapias indicadas (fav_item_cer4 onde item_terapia = S)',
)
def listar_terapias_indicadas(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = db.execute(
        text(
            """
            SELECT DISTINCT it.cd_item_agendamento || '',
                            it.ds_item_agendamento
            FROM fav_item_cer4 it
            WHERE it.item_terapia = 'S'
            ORDER BY it.ds_item_agendamento
            """
        )
    ).fetchall()
    return [{'cd_item': str(r[0]), 'ds_item': r[1]} for r in rows]

@router.get(
    "/diagnosticos-area",
    response_model=list[DiagnosticoPrincipalOut],
    summary="Lista de diagnósticos específicos por área (id_especialidade)",
)
def listar_diagnosticos_area(
    id_especialidade: int = Query(..., description="ID da especialidade da área"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = db.execute(
        text(
            """
            SELECT e.ds_diagnostico
            FROM TB_FAV_DIAGNOSTICO_CERIV e
            WHERE e.id_especialidade = :id_esp
            ORDER BY
                CASE WHEN UPPER(e.ds_diagnostico) = 'NÃO SE APLICA' THEN 0 ELSE 1 END,
                e.ds_diagnostico
            """
        ),
        {"id_esp": id_especialidade},
    ).fetchall()
    return [{"ds_diagnostico": r[0]} for r in rows]


@router.get(
    "/diagnosticos-terapeuticos",
    response_model=list[DiagnosticoPrincipalOut],
    summary="Lista de diagnósticos terapêuticos (exclui especialidades 1, 64, 66, 68)",
)
def listar_diagnosticos_terapeuticos(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    rows = db.execute(
        text(
            """
            SELECT DISTINCT e.ds_diagnostico
            FROM TB_FAV_DIAGNOSTICO_CERIV e
            WHERE e.id_especialidade NOT IN (1, 64, 66, 68)
            ORDER BY
                CASE WHEN UPPER(e.ds_diagnostico) = 'NÃO SE APLICA' THEN 0 ELSE 1 END,
                e.ds_diagnostico
            """
        )
    ).fetchall()
    return [{"ds_diagnostico": r[0]} for r in rows]
