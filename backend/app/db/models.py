# app/db/models.py
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.session import Base


class User(Base):
    """Maps the Oracle TB_USUARIOS table."""
    __tablename__ = "TB_USUARIOS"

    id_usuario    = Column("ID_USUARIO",    Integer, primary_key=True, index=True)
    nm_login      = Column("NM_LOGIN",      String(50),  unique=True, nullable=False)
    nm_usuario    = Column("NM_USUARIO",    String(200), nullable=False)
    ds_email      = Column("DS_EMAIL",      String(200), unique=True, nullable=False)
    ds_senha_hash = Column("DS_SENHA_HASH", String(255), nullable=False)
    ds_perfil     = Column("DS_PERFIL",     String(20),  default="OPERADOR")
    nr_conselho   = Column("NR_CONSELHO",   String(20))
    fl_ativo      = Column("FL_ATIVO",      Integer,     default=1)
    dt_criacao    = Column("DT_CRIACAO",    DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<User login={self.nm_login} profile={self.ds_perfil}>"
