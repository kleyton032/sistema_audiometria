# app/db/models.py
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base


class User(Base):
    __tablename__ = "FAV_TB_SILA_USUARIOS"

    id_usuario       = Column("ID_USUARIO",       Integer,              primary_key=True, index=True)
    cd_usuario_mv    = Column("CD_USUARIO_MV",    String(50),           nullable=True)
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


class Exame(Base):
    __tablename__ = "FAV_TB_SILA_EXAMES"

    id_exame             = Column("ID_EXAME",             Integer, primary_key=True)
    id_paciente          = Column("ID_PACIENTE",          Integer, nullable=False)
    id_usuario           = Column("ID_USUARIO",           Integer, ForeignKey("FAV_TB_SILA_USUARIOS.ID_USUARIO"), nullable=False)
    id_atendimento       = Column("ID_ATENDIMENTO",       Integer, nullable=True)
    id_equipamento       = Column("ID_EQUIPAMENTO",       Integer, nullable=True)
    ds_tipo              = Column("DS_TIPO",              String(30), nullable=False)
    ds_queixa_principal  = Column("DS_QUEIXA_PRINCIPAL",  String(1000), nullable=True)
    fl_cae_od_obstruido  = Column("FL_CAE_OD_OBSTRUIDO",  Integer, default=0)
    fl_cae_oe_obstruido  = Column("FL_CAE_OE_OBSTRUIDO",  Integer, default=0)
    dt_exame             = Column("DT_EXAME",             DateTime(timezone=True), server_default=func.now(), nullable=False)
    ds_status            = Column("DS_STATUS",            String(20), default="RASCUNHO", nullable=False)
    ds_observacoes       = Column("DS_OBSERVACOES",       String(2000), nullable=True)

    resultado_audio  = relationship("ResultadoAudio",  back_populates="exame", uselist=False)
    resultado_imitan = relationship("ResultadoImitan", back_populates="exame", uselist=False)
    laudos           = relationship("Laudo", back_populates="exame")


class ResultadoAudio(Base):
    __tablename__ = "FAV_TB_SILA_RESULTADOS_AUDIO"

    id_resultado = Column("ID_RESULTADO", Integer, primary_key=True)
    id_exame     = Column("ID_EXAME", Integer, ForeignKey("FAV_TB_SILA_EXAMES.ID_EXAME"), nullable=False, unique=True)

    # Via aérea OD
    od_va_250  = Column("OD_VA_250",  Numeric(5, 1))
    od_va_500  = Column("OD_VA_500",  Numeric(5, 1))
    od_va_1000 = Column("OD_VA_1000", Numeric(5, 1))
    od_va_2000 = Column("OD_VA_2000", Numeric(5, 1))
    od_va_3000 = Column("OD_VA_3000", Numeric(5, 1))
    od_va_4000 = Column("OD_VA_4000", Numeric(5, 1))
    od_va_6000 = Column("OD_VA_6000", Numeric(5, 1))
    od_va_8000 = Column("OD_VA_8000", Numeric(5, 1))

    # Via óssea OD
    od_vo_500  = Column("OD_VO_500",  Numeric(5, 1))
    od_vo_1000 = Column("OD_VO_1000", Numeric(5, 1))
    od_vo_2000 = Column("OD_VO_2000", Numeric(5, 1))
    od_vo_4000 = Column("OD_VO_4000", Numeric(5, 1))

    # Via aérea OE
    oe_va_250  = Column("OE_VA_250",  Numeric(5, 1))
    oe_va_500  = Column("OE_VA_500",  Numeric(5, 1))
    oe_va_1000 = Column("OE_VA_1000", Numeric(5, 1))
    oe_va_2000 = Column("OE_VA_2000", Numeric(5, 1))
    oe_va_3000 = Column("OE_VA_3000", Numeric(5, 1))
    oe_va_4000 = Column("OE_VA_4000", Numeric(5, 1))
    oe_va_6000 = Column("OE_VA_6000", Numeric(5, 1))
    oe_va_8000 = Column("OE_VA_8000", Numeric(5, 1))

    # Via óssea OE
    oe_vo_500  = Column("OE_VO_500",  Numeric(5, 1))
    oe_vo_1000 = Column("OE_VO_1000", Numeric(5, 1))
    oe_vo_2000 = Column("OE_VO_2000", Numeric(5, 1))
    oe_vo_4000 = Column("OE_VO_4000", Numeric(5, 1))

    # Logoaudiometria
    od_lrf      = Column("OD_LRF",      Numeric(5, 1))
    od_iprf_mon = Column("OD_IPRF_MON", Numeric(5, 1))   # IPRF MON %
    od_iprf_int = Column("OD_IPRF_INT", Numeric(5, 1))   # IPRF MON dB
    od_iprf_dis = Column("OD_IPRF_DIS", Numeric(5, 1))   # IPRF DIS %
    od_iprf_dis_db = Column("OD_IPRF_DIS_DB", Numeric(5, 1))  # IPRF DIS dB
    od_iprf_tri = Column("OD_IPRF_TRI", Numeric(5, 1))   # IPRF TRI %
    od_iprf_tri_db = Column("OD_IPRF_TRI_DB", Numeric(5, 1))  # IPRF TRI dB
    od_sdt      = Column("OD_SDT",      Numeric(5, 1))   # SDT dB

    oe_lrf      = Column("OE_LRF",      Numeric(5, 1))
    oe_iprf_mon = Column("OE_IPRF_MON", Numeric(5, 1))
    oe_iprf_int = Column("OE_IPRF_INT", Numeric(5, 1))
    oe_iprf_dis = Column("OE_IPRF_DIS", Numeric(5, 1))
    oe_iprf_dis_db = Column("OE_IPRF_DIS_DB", Numeric(5, 1))
    oe_iprf_tri = Column("OE_IPRF_TRI", Numeric(5, 1))
    oe_iprf_tri_db = Column("OE_IPRF_TRI_DB", Numeric(5, 1))
    oe_sdt      = Column("OE_SDT",      Numeric(5, 1))

    # Mascaramento
    od_mask_va   = Column("OD_MASK_VA",   Numeric(5, 1))
    od_mask_vo   = Column("OD_MASK_VO",   Numeric(5, 1))
    od_mask_lrf  = Column("OD_MASK_LRF",  Numeric(5, 1))
    od_mask_iprf = Column("OD_MASK_IPRF", Numeric(5, 1))
    oe_mask_va   = Column("OE_MASK_VA",   Numeric(5, 1))
    oe_mask_vo   = Column("OE_MASK_VO",   Numeric(5, 1))
    oe_mask_lrf  = Column("OE_MASK_LRF",  Numeric(5, 1))
    oe_mask_iprf = Column("OE_MASK_IPRF", Numeric(5, 1))

    # Sem resposta (NR)
    od_va_nr = Column("OD_VA_NR", Integer, default=0)   # 1 = sem resposta VA OD
    oe_va_nr = Column("OE_VA_NR", Integer, default=0)   # 1 = sem resposta VA OE
    od_vo_nr = Column("OD_VO_NR", Integer, default=0)   # 1 = sem resposta VO OD
    oe_vo_nr = Column("OE_VO_NR", Integer, default=0)   # 1 = sem resposta VO OE

    # Classificação
    nr_media_od = Column("NR_MEDIA_OD", Numeric(5, 1))
    nr_media_oe = Column("NR_MEDIA_OE", Numeric(5, 1))
    ds_class_od = Column("DS_CLASS_OD", String(50))
    ds_class_oe = Column("DS_CLASS_OE", String(50))
    ds_tipo_od  = Column("DS_TIPO_OD",  String(30))
    ds_tipo_oe  = Column("DS_TIPO_OE",  String(30))
    ds_conclusao = Column("DS_CONCLUSAO", String(2000))

    exame = relationship("Exame", back_populates="resultado_audio")


class ResultadoImitan(Base):
    __tablename__ = "FAV_TB_SILA_RESULTADOS_IMITAN"

    id_resultado = Column("ID_RESULTADO", Integer, primary_key=True)
    id_exame     = Column("ID_EXAME", Integer, ForeignKey("FAV_TB_SILA_EXAMES.ID_EXAME"), nullable=False, unique=True)

    # Timpanograma OD
    od_ecv        = Column("OD_ECV",        Numeric(4, 2))
    od_pico       = Column("OD_PICO",       Numeric(4, 2))
    od_pressao    = Column("OD_PRESSAO",    Numeric(5, 1))
    od_gradiante  = Column("OD_GRADIANTE",  Numeric(4, 2))
    od_tipo_curva = Column("OD_TIPO_CURVA", String(5))

    # Timpanograma OE
    oe_ecv        = Column("OE_ECV",        Numeric(4, 2))
    oe_pico       = Column("OE_PICO",       Numeric(4, 2))
    oe_pressao    = Column("OE_PRESSAO",    Numeric(5, 1))
    oe_gradiante  = Column("OE_GRADIANTE",  Numeric(4, 2))
    oe_tipo_curva = Column("OE_TIPO_CURVA", String(5))

    # Reflexos Estapedianos OD (sonda OD)
    od_contra_500  = Column("OD_CONTRA_500",  Numeric(5, 1))
    od_contra_1000 = Column("OD_CONTRA_1000", Numeric(5, 1))
    od_contra_2000 = Column("OD_CONTRA_2000", Numeric(5, 1))
    od_contra_4000 = Column("OD_CONTRA_4000", Numeric(5, 1))
    od_ipsi_500    = Column("OD_IPSI_500",    Numeric(5, 1))
    od_ipsi_1000   = Column("OD_IPSI_1000",   Numeric(5, 1))
    od_ipsi_2000   = Column("OD_IPSI_2000",   Numeric(5, 1))
    od_ipsi_4000   = Column("OD_IPSI_4000",   Numeric(5, 1))

    # Reflexos Estapedianos OE (sonda OE)
    oe_contra_500  = Column("OE_CONTRA_500",  Numeric(5, 1))
    oe_contra_1000 = Column("OE_CONTRA_1000", Numeric(5, 1))
    oe_contra_2000 = Column("OE_CONTRA_2000", Numeric(5, 1))
    oe_contra_4000 = Column("OE_CONTRA_4000", Numeric(5, 1))
    oe_ipsi_500    = Column("OE_IPSI_500",    Numeric(5, 1))
    oe_ipsi_1000   = Column("OE_IPSI_1000",   Numeric(5, 1))
    oe_ipsi_2000   = Column("OE_IPSI_2000",   Numeric(5, 1))
    oe_ipsi_4000   = Column("OE_IPSI_4000",   Numeric(5, 1))

    ds_conclusao = Column("DS_CONCLUSAO", String(2000))

    exame = relationship("Exame", back_populates="resultado_imitan")


class Laudo(Base):
    __tablename__ = "FAV_TB_SILA_LAUDOS"

    id_laudo         = Column("ID_LAUDO",         Integer, primary_key=True)
    id_exame         = Column("ID_EXAME",         Integer, ForeignKey("FAV_TB_SILA_EXAMES.ID_EXAME"), nullable=False)
    id_usuario_gerou = Column("ID_USUARIO_GEROU", Integer, ForeignKey("FAV_TB_SILA_USUARIOS.ID_USUARIO"), nullable=False)
    nm_arquivo       = Column("NM_ARQUIVO",       String(255), nullable=False)
    ds_caminho       = Column("DS_CAMINHO",       String(500))
    bl_pdf           = Column("BL_PDF",           LargeBinary)
    nr_tamanho_bytes = Column("NR_TAMANHO_BYTES", Integer)
    ds_hash_sha256   = Column("DS_HASH_SHA256",   String(64))
    dt_geracao       = Column("DT_GERACAO",       DateTime(timezone=True), server_default=func.now(), nullable=False)
    ds_status        = Column("DS_STATUS",        String(20), default="ATIVO", nullable=False)

    exame = relationship("Exame", back_populates="laudos")
