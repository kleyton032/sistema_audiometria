# app/api/v1/pts.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import text
from pydantic import BaseModel

from app.dependencies import get_db, get_current_user
from app.db.models import User, PTS
from app.schemas.pts import PTSCreate
from app.db.repositories.pts import create_pts, update_pts, get_pts_by_id, get_pts_status_batch, calcular_vigencia
from app.db.session import SessionTest

router = APIRouter(prefix="/pts", tags=["PTS"])


def get_db_session(user: User, db: Session) -> Session:
    """Retorna a sessão de teste se o usuário for 'testesoul', senão retorna a sessão padrão."""
    if user.nm_login == 'testesoul':
        return SessionTest()
    return db


def _pts_access_filter(user: User) -> tuple[str, dict]:
    """
    Retorna (extra_where, params) para filtrar PTS conforme o perfil do usuário.

    Regras:
      ADMIN / SUPERVISOR → vê tudo
      COORDENADOR        → vê apenas PTS de profissionais da sua especialidade
      OPERADOR (demais)  → vê apenas os próprios PTS
    """
    perfil = user.perfil_nome
    if perfil in ("ADMIN", "SUPERVISOR"):
        return "", {}
    if perfil == "COORDENADOR":
        extra_where = """
            AND EXISTS (
                SELECT 1
                FROM FAV_TB_COORD_ESP ce
                JOIN FAV_TB_USUARIO_PRESTADOR up ON UPPER(up.NM_TIP_PRESTA) = UPPER(ce.DS_TIPO_PRESTA)
                WHERE ce.ID_USUARIO = :coord_id
                  AND up.ID_USUARIO = p.ID_USUARIO
                  AND ce.FL_ATIVO   = 1
            )
        """
        return extra_where, {"coord_id": user.id_usuario}
    # OPERADOR (e qualquer outro perfil não listado acima)
    return "AND p.ID_USUARIO = :op_id", {"op_id": user.id_usuario}


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
                SELECT DISTINCT e.ds_diagnostico
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


class PTSCancel(BaseModel):
    ds_motivo: str
    ds_detalhe: str | None = None


class PTSDashboardStats(BaseModel):
    total_pts: int
    finalizados: int
    em_rascunho: int
    cancelados: int


class PTSReportItem(BaseModel):
    id_pts: int
    cd_paciente: str
    nm_paciente: str
    nr_atendimento: str
    nm_usuario: str
    ds_vigencia: str
    dt_criacao: str
    fl_finalizado: int
    fl_ativo: int = 1
    terapias: str | None = None
    objetivos: str | None = None
    ds_motivo_cancelamento: str | None = None
    ds_detalhe_cancelamento: str | None = None
    dt_cancelamento: str | None = None


@router.get(
    "/status-batch",
    summary="Retorna status do PTS (vigência atual) para uma lista de pacientes",
)
def status_batch(
    cd_pacientes: str,  # cd_pacientes separados por vírgula
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    ids = [p.strip() for p in cd_pacientes.split(",") if p.strip()]
    vigencia = calcular_vigencia()
    session = get_db_session(user, db)
    try:
        return get_pts_status_batch(session, ids, vigencia, user.id_usuario)
    finally:
        if user.nm_login == 'testesoul':
            session.close()


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
    try:
        session = get_db_session(user, db)
        db_pts = create_pts(db=session, pts_data=pts_data, id_usuario=user.id_usuario)
        session.commit()
        return {"status": "success", "mensagem": "PTS salvo com sucesso.", "id_pts": db_pts.id_pts}
    except Exception as e:
        import traceback
        erro_real = str(e)
        print("ERRO REAL AO SALVAR PTS:", erro_real)
        print(traceback.format_exc())
        try:
            if 'session' in locals():
                session.rollback()
        except Exception as rollback_err:
            print("Erro durante o rollback:", str(rollback_err))
            
        raise HTTPException(status_code=500, detail=f"Erro seguro ao salvar: {erro_real}")
    finally:
        if 'session' in locals() and user.nm_login == 'testesoul':
            try:
                session.close()
            except:
                pass


@router.put(
    "/{id_pts}",
    summary="Atualizar um PTS existente (mesmo registro)",
    response_model=dict,
)
def atualizar_pts(
    id_pts: int,
    pts_data: PTSCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = get_db_session(user, db)
    try:
        db_pts = update_pts(db=session, id_pts=id_pts, pts_data=pts_data)
        return {"status": "success", "mensagem": "PTS atualizado com sucesso.", "id_pts": db_pts.id_pts}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Erro ao atualizar PTS: {e}")
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Erro interno ao atualizar PTS: {str(e)}")
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
        # Resolve o cd_prestador a partir do vínculo já salvo na FAV_TB_USUARIO_PRESTADOR
        cd_prestador = current_user.prestador.cd_prestador if current_user.prestador else None

        if cd_prestador is None:
            raise HTTPException(
                status_code=422,
                detail="Usuário sem cd_prestador vinculado. Faça login novamente para sincronizar."
            )

        session.execute(
            text('BEGIN PRC_FAV_PTS_INSERE_FILA(:id_pts, :cd_prestador); END;'),
            {'id_pts': id_pts, 'cd_prestador': cd_prestador},
        )
        from app.db.models import PTS as PTSModel
        session.query(PTSModel).filter(PTSModel.id_pts == id_pts).update({"fl_finalizado": 1})
        session.commit()
        return {
            'status': 'ok',
            'mensagem': f'PTS {id_pts} finalizado. Terapias inseridas na fila de espera.',
        }
    except HTTPException:
        raise
    except Exception as e:
        if current_user.nm_login == 'testesoul':
            session.rollback()
        import traceback
        print(traceback.format_exc()) # Log no console do servidor
        raise HTTPException(status_code=500, detail=f"Erro detalhado: {str(e)}")
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
    cancel_data: PTSCancel,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = get_db_session(user, db)
    
    # Busca o PTS para verificar a autoria
    pts_db = db.query(PTS).filter(PTS.id_pts == id_pts).first()
    if not pts_db:
        raise HTTPException(status_code=404, detail="PTS não encontrado.")
    
    if pts_db.id_usuario != user.id_usuario:
        raise HTTPException(
            status_code=403, 
            detail="Apenas o profissional que criou este PTS pode cancelá-lo."
        )

    try:
        motivo_completo = cancel_data.ds_motivo
        if cancel_data.ds_detalhe:
            motivo_completo = f"{cancel_data.ds_motivo} | {cancel_data.ds_detalhe}"

        session.execute(
            text("BEGIN PRC_FAV_PTS_CANCELA_FILA(:id_pts, :motivo); END;"),
            {
                'id_pts': id_pts,
                'motivo': motivo_completo,
            },
        )
        
        from datetime import datetime
        from app.db.models import PTS as PTSModel
        session.query(PTSModel).filter(PTSModel.id_pts == id_pts).update({
            "ds_motivo_cancelamento": cancel_data.ds_motivo,
            "ds_detalhe_cancelamento": cancel_data.ds_detalhe,
            "fl_ativo": 0,
            "dt_atualizacao": datetime.now()
        })

        session.commit()
        return {
            'status': 'ok',
            'mensagem': f'PTS {id_pts} cancelado com sucesso.',
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
                SELECT DISTINCT e.ds_diagnostico
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

    # Especialidades extras a incluir na busca de objetivos
    especialidades_extras: dict[str, list[str]] = {
        "FISIOTERAPIA": ["PSICOPEDAGOGIA"],
        "FISIOTERAPIA AQUÁTICA": ["PSICOPEDAGOGIA"],
        "TERAPIA OCUPACIONAL": ["PSICOPEDAGOGIA"],
    }
    extras = especialidades_extras.get(esp_busca, [])
    todas_especialidades = [esp_busca] + extras

    try:
        # Busca objetivos de todas as especialidades
        resultados = {}
        for esp in todas_especialidades:
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
                {"esp": esp},
            ).fetchall()
            
            # Adiciona sem duplicar (chave = ds_objetivo)
            for r in rows:
                desc = str(r[1]) if r[1] is not None else ""
                if desc not in resultados:
                    resultados[desc] = r
        
        rows = list(resultados.values())
        
        # Converte para lista de dicionários garantindo tipos primitivos (evita erro de serialização se vier LOB/None)
        return [
            {
                "id_objetivo": int(r[0]) if r[0] is not None else 0, 
                "ds_objetivo": str(r[1]) if r[1] is not None else ""
            } 
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar objetivos: {str(e)}")


@router.get(
    "/dashboard/stats",
    response_model=PTSDashboardStats,
    summary="Estatísticas gerais para o Dashboard de PTS",
)
def stats_dashboard_pts(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        extra_where, params = _pts_access_filter(user)

        def _count(base_where: str) -> int:
            sql = f"SELECT COUNT(*) FROM FAV_TB_PTS p WHERE {base_where} {extra_where}"
            return db.execute(text(sql), params).scalar() or 0

        total      = _count("1=1")
        finalizados = _count("p.FL_FINALIZADO = 1 AND p.FL_ATIVO = 1")
        rascunhos   = _count("p.FL_FINALIZADO = 0 AND p.FL_ATIVO = 1")
        cancelados  = _count("p.FL_ATIVO = 0")

        return {
            "total_pts":  total,
            "finalizados": finalizados,
            "em_rascunho": rascunhos,
            "cancelados":  cancelados,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar estatísticas: {str(e)}")


@router.get(
    "/dashboard/report",
    response_model=list[PTSReportItem],
    summary="Relatório detalhado de PTS para o Dashboard",
)
def report_dashboard_pts(
    status: str | None = Query(default=None, description="Filtro de status: 'finalizados', 'rascunho' ou 'cancelados'"),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        if status == "cancelados":
            base_where = "p.FL_ATIVO = 0"
        elif status == "finalizados":
            base_where = "p.FL_ATIVO = 1 AND p.FL_FINALIZADO = 1"
        elif status == "rascunho":
            base_where = "p.FL_ATIVO = 1 AND p.FL_FINALIZADO = 0"
        else:
            base_where = "p.FL_ATIVO = 1"

        extra_where, params = _pts_access_filter(user)

        sql = f"""
            SELECT 
                p.ID_PTS,
                p.CD_PACIENTE,
                (SELECT NM_PACIENTE FROM dbamv.PACIENTE WHERE CD_PACIENTE = TO_NUMBER(p.CD_PACIENTE)) as NM_PACIENTE,
                p.NR_ATENDIMENTO,
                u.NM_USUARIO,
                p.DS_VIGENCIA,
                TO_CHAR(p.DT_CRIACAO, 'DD/MM/YYYY') as DT_CRIACAO,
                p.FL_FINALIZADO,
                p.FL_ATIVO,
                (SELECT LISTAGG(
                    t.DS_TERAPIA || ' - ' || 
                    DECODE(t.DS_TIPO_ATENDIMENTO, '01', 'Individual', '02', 'Dupla', '03', 'Grupo 3', '04', 'Grupo 4', '05', 'Grupo 5', t.DS_TIPO_ATENDIMENTO) || ' - ' ||
                    DECODE(t.DS_PERIODICIDADE, '1', 'Semanal', '2', 'Quinzenal', '3', 'Mensal', '4', 'Bimestral', '5', 'Trimestral', t.DS_PERIODICIDADE) || 
                    ' (' || t.NR_QTDE_SESSOES || ')', ', ') WITHIN GROUP (ORDER BY t.NR_ORDEM) 
                 FROM FAV_TB_PTS_TERAPIA t WHERE t.ID_PTS = p.ID_PTS) as TERAPIAS,
                (SELECT LISTAGG(o.DS_OBJETIVO, '; ') WITHIN GROUP (ORDER BY o.DS_ESPECIALIDADE, o.NR_ITEM) 
                 FROM FAV_TB_PTS_OBJETIVO o WHERE o.ID_PTS = p.ID_PTS AND o.DS_MOMENTO = 'atual') as OBJETIVOS,
                p.DS_MOTIVO_CANCELAMENTO,
                p.DS_DETALHE_CANCELAMENTO,
                TO_CHAR(p.DT_ATUALIZACAO, 'DD/MM/YYYY HH24:MI') as DT_CANCELAMENTO
            FROM FAV_TB_PTS p
            JOIN FAV_TB_SILA_USUARIOS u ON p.ID_USUARIO = u.ID_USUARIO
            WHERE {base_where}
            {extra_where}
            ORDER BY p.DT_CRIACAO DESC
        """
        rows = db.execute(text(sql), params).fetchall()

        return [
            {
                "id_pts": r[0],
                "cd_paciente": str(r[1]),
                "nm_paciente": r[2] or "N/A",
                "nr_atendimento": str(r[3]),
                "nm_usuario": r[4],
                "ds_vigencia": r[5],
                "dt_criacao": r[6],
                "fl_finalizado": r[7],
                "fl_ativo": r[8],
                "terapias": r[9],
                "objetivos": r[10],
                "ds_motivo_cancelamento": r[11],
                "ds_detalhe_cancelamento": r[12],
                "dt_cancelamento": r[13]
            } for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao gerar relatório: {str(e)}")



@router.get(
    "/outros-pts-vigencia",
    summary="Lista PTS de outros profissionais do mesmo paciente na mesma vigência",
)
def listar_outros_pts_vigencia(
    nr_atendimento: str = Query(...),
    cd_paciente: str = Query(default=''),
    vigencia: str = Query(...),
    id_pts_excluir: int = Query(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = get_db_session(user, db)
    try:
        sql = """
            SELECT
                p.id_pts,
                u.nm_usuario                    AS nm_prestador,
                COALESCE(up.nm_tip_presta, u.ds_especialidade) AS ds_especialidade_profissional,
                o.ds_especialidade,
                o.ds_momento,
                o.nr_item,
                o.ds_objetivo,
                o.ds_status,
                o.ds_motivo,
                p.fl_finalizado,
                p.fl_ativo
            FROM FAV_TB_PTS p
            JOIN FAV_TB_SILA_USUARIOS u ON u.id_usuario = p.id_usuario
            LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON up.id_usuario = p.id_usuario
            LEFT JOIN FAV_TB_PTS_OBJETIVO o ON o.id_pts = p.id_pts
            WHERE (p.nr_atendimento = :nr_atendimento OR p.cd_paciente = :cd_paciente)
              AND p.ds_vigencia    = :vigencia
              AND p.id_pts        != :id_pts_excluir
              AND p.fl_finalizado  = 1
              AND p.fl_ativo       = 1
            ORDER BY p.id_pts, o.ds_especialidade, o.ds_momento, o.nr_item
        """
        rows = session.execute(
            text(sql),
            {"nr_atendimento": nr_atendimento, "cd_paciente": cd_paciente, "vigencia": vigencia, "id_pts_excluir": id_pts_excluir}
        ).fetchall()

        # Agrupar por id_pts
        pts_map: dict = {}
        for r in rows:
            id_pts = r[0]
            if id_pts not in pts_map:
                pts_map[id_pts] = {
                    "id_pts": id_pts,
                    "nm_prestador": r[1],
                    "ds_especialidade_profissional": r[2],
                    "fl_finalizado": r[9],
                    "fl_ativo": r[10],
                    "objetivos": {},
                }
            # Se tem objetivo (LEFT JOIN pode trazer nulos)
            if r[3]:
                esp = r[3]
                momento = r[4] or "atual"
                nr_item = (r[5] or 1) - 1
                if esp not in pts_map[id_pts]["objetivos"]:
                    vazio = {"objetivo": None, "status": None, "motivo": None}
                    pts_map[id_pts]["objetivos"][esp] = {
                        "anterior": [dict(vazio) for _ in range(3)],
                        "atual":    [dict(vazio) for _ in range(3)],
                    }
                if 0 <= nr_item <= 2:
                    pts_map[id_pts]["objetivos"][esp][momento][nr_item] = {
                        "objetivo": r[6],
                        "status":   r[7],
                        "motivo":   r[8],
                    }

        return list(pts_map.values())
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao buscar outros PTS: {str(e)}")
    finally:
        if user.nm_login == 'testesoul':
            session.close()


@router.get(
    "/{cd_paciente}/conduta-interdisciplinar",
    summary="Verifica se há preenchimento do documento de conduta interdisciplinar (cd_documento=770) nos últimos 3 meses",
)
def verificar_conduta_interdisciplinar(
    cd_paciente: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = get_db_session(user, db)
    try:
        row = session.execute(
            text("""
                SELECT COUNT(erc.cd_registro) AS total_registros
                FROM pw_documento_clinico pdc
                JOIN pw_editor_clinico pec
                    ON pec.cd_documento_clinico = pdc.cd_documento_clinico
                JOIN editor_registro er
                    ON er.cd_registro = pec.cd_editor_registro
                JOIN editor_registro_campo erc
                    ON erc.cd_registro = er.cd_registro
                WHERE pec.cd_documento = 770
                  AND pdc.cd_paciente  = :cd_paciente
                  AND pdc.tp_status   <> 'CANCELADO'
                  AND er.sn_fechado    = 'S'
                  AND TRUNC(pdc.dh_documento) >= TRUNC(ADD_MONTHS(SYSDATE, -3))
            """),
            {"cd_paciente": cd_paciente},
        ).fetchone()

        total = int(row[0]) if row and row[0] is not None else 0
        possui = total > 0

        return {
            "possui_preenchimento": possui,
            "total_registros": total,
            "status_documento": (
                "Houve preenchimento do documento de conduta interdisciplinar para o paciente"
                if possui
                else "Paciente não possui preenchimento do documento de conduta interdisciplinar"
            ),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if user.nm_login == 'testesoul':
            session.close()


@router.get(
    "/load/{id_pts}",
    summary="Carrega dados completos de um PTS existente",
)
def carregar_pts(
    id_pts: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    session = get_db_session(user, db)
    try:
        from app.db.repositories.pts import pts_to_dict
        pts = get_pts_by_id(session, id_pts)
        if pts is None:
            raise HTTPException(status_code=404, detail="PTS não encontrado")
        return pts_to_dict(pts)
    finally:
        if user.nm_login == 'testesoul':
            session.close()
