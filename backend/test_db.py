from app.db.session import SessionLocal
from app.db.models import PTS

def test_db():
    db = SessionLocal()
    pts = db.query(PTS).filter(PTS.id_pts == 436).first()
    print("PTS 436:")
    print("ativo:", pts.fl_ativo)
    print("motivo:", pts.ds_motivo_cancelamento)
    print("detalhe:", pts.ds_detalhe_cancelamento)
    print("data:", pts.dt_atualizacao)
    db.close()

if __name__ == "__main__":
    test_db()
