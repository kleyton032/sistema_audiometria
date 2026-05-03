# app/api/v1/pts.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from pydantic import BaseModel

from app.dependencies import get_db, get_current_user
from app.db.models import User
from app.schemas.pts import PTSCreate
from app.db.repositories.pts import create_pts
from app.db.session import SessionTest

router = APIRouter(prefix="/pts", tags=["PTS"])


def get_db_session(user: User, db: Session) -> Session:
    """Retorna a sessão de teste se o usuário for 'testesoul', senão retorna a sessão padrão."""
    if user.nm_login == 'testesoul':
        return SessionTest()
    return db


class DiagnosticoPrincipalOut(BaseModel):
    ds_diagnostico: str


class ObjetivoOut(BaseModel):
    id_objetivo: int
    ds_objetivo: str


@router.get(
    "/diagnosticos-principais",
    response_model=list[DiagnosticoPrincipalOut],
    summary="Lista de diagnósticos principais do CER IV",
)
def listar_diagnosticos_principais(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
    user: User = Depends(get_current_user),
):
    try:
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
    user: User = Depends(get_current_user),
):
    try:
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
    user: User = Depends(get_current_user),
):
    try:
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class PTSFinalizarResponse(BaseModel):
    status: str
    mensagem: str


@router.post(
    "",
    summary="Salvar um novo PTS",
    response_model=dict,
)
def salvar_pts(
    pts_data: PTSCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = get_db_session(user, db)
    try:
        db_pts = create_pts(db=session, pts_data=pts_data, id_usuario=user.id_usuario)
        session.commit()
        return {"status": "success", "mensagem": "PTS salvo com sucesso.", "id_pts": db_pts.id_pts}
    except Exception as e:
        print(f"Erro ao salvar PTS: {e}")
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Erro interno ao salvar PTS: {str(e)}")
    finally:
        if user.nm_login == 'testesoul':
            session.close()


@router.post(
    '/{id_pts}/finalizar',
    response_model=PTSFinalizarResponse,
    summary='Finaliza o PTS e insere as terapias indicadas na fila de espera (FAV_LISTA_ESPERA)',
)
def finalizar_pts(
    id_pts: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session = get_db_session(current_user, db)
    try:
        nm_usuario = current_user.cd_usuario_mv or current_user.nm_login
        session.execute(
            text('BEGIN PRC_FAV_PTS_INSERE_FILA(:id_pts, :nm_usuario); END;'),
            {'id_pts': id_pts, 'nm_usuario': nm_usuario},
        )
        session.commit()
        return {
            'status': 'ok',
            'mensagem': f'PTS {id_pts} finalizado. Terapias inseridas na fila de espera.',
        }
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao finalizar PTS: {str(e)}")
    finally:
        if current_user.nm_login == 'testesoul':
            session.close()


@router.post(
    '/{id_pts}/cancelar',
    response_model=PTSFinalizarResponse,
    summary='Cancela o PTS e remove as terapias da fila de espera (FAV_LISTA_ESPERA)',
)
def cancelar_pts(
    id_pts: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = get_db_session(user, db)
    try:
        session.execute(
            text("BEGIN PRC_FAV_PTS_CANCELA_FILA(:id_pts, 'Cancelado via PTS'); END;"),
            {'id_pts': id_pts},
        )
        session.commit()
        return {
            'status': 'ok',
            'mensagem': f'PTS {id_pts} cancelado. Itens removidos da fila de espera.',
        }
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Erro ao cancelar PTS: {str(e)}")
    finally:
        if user.nm_login == 'testesoul':
            session.close()


@router.get(
    "/diagnosticos-area",
    response_model=list[DiagnosticoPrincipalOut],
    summary="Lista de diagnósticos específicos por área (id_especialidade)",
)
def listar_diagnosticos_area(
    id_especialidade: int = Query(..., description="ID da especialidade da área"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/diagnosticos-terapeuticos",
    response_model=list[DiagnosticoPrincipalOut],
    summary="Lista de diagnósticos terapêuticos (exclui especialidades 1, 64, 66, 68)",
)
def listar_diagnosticos_terapeuticos(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class InstrumentoAvaliacaoOut(BaseModel):
    codigo: str
    descricao: str


@router.get(
    '/instrumentos-avaliacao',
    response_model=list[InstrumentoAvaliacaoOut],
    summary='Lista de instrumentos de avaliação (tabela fav_instr_aval_cer4)',
)
def listar_instrumentos_avaliacao(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        rows = db.execute(
            text(
                """
                SELECT ''||i.seq CODIGO, UPPER(i.instrumento) DESCRICAO
                FROM fav_instr_aval_cer4 i
                ORDER BY UPPER(i.instrumento)
                """
            )
        ).fetchall()
        return [{'codigo': str(r[0]), 'descricao': r[1]} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/objetivos-por-especialidade",
    response_model=list[ObjetivoOut],
    summary="Lista de objetivos cadastrados por especialidade",
)
def listar_objetivos_por_especialidade(
    ds_especialidade: str = Query(..., description="Nome da especialidade (ex: FISIOTERAPIA)"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Converte o nome que vem do Frontend para caixa alta e remove espaços extras
    esp_frontend = ds_especialidade.upper().strip()

    # Mapeamento: DE (Nome no Frontend) -> PARA (Nome Exato no Banco de Dados)
    mapa_especialidades = {
        "FISIOTERAPIA AQUÁTICA": "FISIOTERAPIA",
        "PROF. EDUCAÇÃO FÍSICA": "PROFISSIONAL DE ED. FÍSICA",
        "PSICOLOGIA SONORO MUSICAL": "PSICOLOGIA COM ENFOQUE SONORO MUSICAL",
        "PROFESSOR DE BRAILLE": "PROFESSOR DE BRAILLE"
    }

    # Se o nome enviado pelo Frontend estiver no mapa, usamos o nome do Banco.
    # Caso contrário, usamos o nome original convertido para UPPER.
    esp_busca = mapa_especialidades.get(esp_frontend, esp_frontend)

    try:
        rows = db.execute(
            text(
                """
                SELECT o.id_objetivo, o.ds_objetivo
                FROM FAV_TB_OBJETIVO_CERIV o
                JOIN FAV_TB_ESP_OBJETIVO_CERIV e ON o.id_especialidade = e.id_especialidade
                WHERE UPPER(e.ds_especialidade) = :esp
                AND o.ic_ativo = 'S'
                ORDER BY o.ds_objetivo
                """
            ),
            {"esp": esp_busca},
        ).fetchall()
        return [{"id_objetivo": int(r[0]), "ds_objetivo": r[1]} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar objetivos: {str(e)}")
