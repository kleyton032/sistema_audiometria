# app/db/models.py
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.session import Base


class User(Base):
    """Maps the Oracle FAV_TB_SILA_USUARIOS table."""
    __tablename__ = "FAV_TB_SILA_USUARIOS"

    id_usuario       = Column("ID_USUARIO",       Integer,              primary_key=True, index=True)
    nm_login         = Column("NM_LOGIN",         String(50),           unique=True,  nullable=False)
    nm_usuario       = Column("NM_USUARIO",       String(200),          nullable=False)
    ds_email         = Column("DS_EMAIL",         String(200),          unique=True,  nullable=False)
    ds_senha_hash    = Column("DS_SENHA_HASH",    String(255),          nullable=False)
    nr_conselho      = Column("NR_CONSELHO",      String(20))
    ds_especialidade = Column("DS_ESPECIALIDADE", String(100))
    ds_perfil        = Column("DS_PERFIL",        String(20),           default="OPERADOR", nullable=False)
    dt_criacao       = Column("DT_CRIACAO",       DateTime(timezone=True), server_default=func.now(), nullable=False)
    dt_ultimo_acesso = Column("DT_ULTIMO_ACESSO", DateTime(timezone=True))
    fl_ativo         = Column("FL_ATIVO",         Integer,              default=1, nullable=False)

    def __repr__(self):
        return f"<User login={self.nm_login} profile={self.ds_perfil}>"
