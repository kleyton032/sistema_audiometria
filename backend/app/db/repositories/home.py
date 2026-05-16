from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.db.models import PTS, Exame

def get_home_stats(db: Session, id_usuario: int) -> dict:
    """Retorna estatísticas consolidadas para a Home do usuário logado"""
    now = datetime.now()
    current_year = now.year
    current_month = now.month

    # 1. PTS do usuário logado
    pts_usuario = db.query(PTS).filter(
        PTS.id_usuario == id_usuario,
        PTS.fl_ativo == 1
    ).all()

    pts_finalizados = sum(1 for p in pts_usuario if p.fl_finalizado == 1 and p.dt_criacao.year == current_year and p.dt_criacao.month == current_month)
    pts_rascunho = sum(1 for p in pts_usuario if p.fl_finalizado == 0)

    # 2. Exames do usuário logado
    exames_usuario = db.query(Exame).filter(
        Exame.id_usuario == id_usuario
    ).all()

    exames_realizados = sum(1 for e in exames_usuario if e.dt_exame and e.dt_exame.year == current_year and e.dt_exame.month == current_month)
    exames_pendentes = sum(1 for e in exames_usuario if e.ds_status != "FINALIZADO")

    return {
        "resumo_mes": {
            "pts_finalizados": pts_finalizados,
            "exames_realizados": exames_realizados
        },
        "pendencias": {
            "pts_rascunho": pts_rascunho,
            "exames_pendentes": exames_pendentes
        }
    }
