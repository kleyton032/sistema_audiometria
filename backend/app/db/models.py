# app/db/models.py
from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, LargeBinary, Date, Sequence, Text
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

    prestador = relationship("UsuarioPrestador", back_populates="usuario", uselist=False)

    def __repr__(self):
        return f"<User login={self.nm_login} profile={self.ds_perfil}>"


class UsuarioPrestador(Base):
    """Dados profissionais sincronizados do MV no momento do cadastro."""
    __tablename__ = "FAV_TB_USUARIO_PRESTADOR"

    id_usuario         = Column("ID_USUARIO",         Integer, ForeignKey("FAV_TB_SILA_USUARIOS.ID_USUARIO", ondelete="CASCADE"), primary_key=True)
    cd_prestador       = Column("CD_PRESTADOR",       Integer, unique=True, nullable=False)
    nm_prestador       = Column("NM_PRESTADOR",       String(200), nullable=False)
    ds_conselho        = Column("DS_CONSELHO",        String(50))   # CREFONO, CREFITO, CRM...
    ds_codigo_conselho = Column("DS_CODIGO_CONSELHO", String(30))   # número do registro
    nm_tip_presta      = Column("NM_TIP_PRESTA",      String(100))  # Fonoaudiólogo, Fisioterapeuta...
    dt_sincronizacao   = Column("DT_SINCRONIZACAO",   DateTime(timezone=True), server_default=func.now(), nullable=False)

    usuario = relationship("User", back_populates="prestador")

    def __repr__(self):
        return f"<UsuarioPrestador cd={self.cd_prestador} nm={self.nm_prestador}>"


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

class PTS(Base):
    __tablename__ = "FAV_TB_PTS"

    id_pts = Column("ID_PTS", Integer, Sequence("SEQ_PTS"), primary_key=True, index=True)
    cd_paciente = Column("CD_PACIENTE", String(20), nullable=False, index=True)
    nr_atendimento = Column("NR_ATENDIMENTO", String(20), nullable=False, index=True)
    id_usuario = Column("ID_USUARIO", Integer, ForeignKey("FAV_TB_SILA_USUARIOS.ID_USUARIO"), nullable=False, index=True)
    
    ds_vigencia = Column("DS_VIGENCIA", String(7), nullable=False)
    
    ds_queixa_principal = Column("DS_QUEIXA_PRINCIPAL", String(4000))
    
    fl_def_visual = Column("FL_DEF_VISUAL", Integer, default=0, nullable=False)
    fl_def_intelectual = Column("FL_DEF_INTELECTUAL", Integer, default=0, nullable=False)
    fl_def_fisica = Column("FL_DEF_FISICA", Integer, default=0, nullable=False)
    fl_def_auditiva = Column("FL_DEF_AUDITIVA", Integer, default=0, nullable=False)
    
    fl_cond_nao_se_aplica = Column("FL_COND_NAO_SE_APLICA", Integer, default=0, nullable=False)
    fl_cond_nao_escuta = Column("FL_COND_NAO_ESCUTA", Integer, default=0, nullable=False)
    fl_cond_nao_fala = Column("FL_COND_NAO_FALA", Integer, default=0, nullable=False)
    fl_cond_nao_enxerga = Column("FL_COND_NAO_ENXERGA", Integer, default=0, nullable=False)
    fl_cond_agitacao = Column("FL_COND_AGITACAO", Integer, default=0, nullable=False)
    fl_cond_agressividade = Column("FL_COND_AGRESSIVIDADE", Integer, default=0, nullable=False)
    fl_cond_nao_anda = Column("FL_COND_NAO_ANDA", Integer, default=0, nullable=False)
    fl_cond_nao_fica_sozinho = Column("FL_COND_NAO_FICA_SOZINHO", Integer, default=0, nullable=False)
    fl_cond_sem_ctrl_cervical = Column("FL_COND_SEM_CTRL_CERVICAL", Integer, default=0, nullable=False)
    fl_cond_sem_ctrl_tronco = Column("FL_COND_SEM_CTRL_TRONCO", Integer, default=0, nullable=False)
    ds_cond_outra = Column("DS_COND_OUTRA", String(500))
    
    fl_opme_nao_se_aplica = Column("FL_OPME_NAO_SE_APLICA", Integer, default=0, nullable=False)
    fl_opme_cadeira = Column("FL_OPME_CADEIRA", Integer, default=0, nullable=False)
    fl_opme_bengala = Column("FL_OPME_BENGALA", Integer, default=0, nullable=False)
    fl_opme_muleta = Column("FL_OPME_MULETA", Integer, default=0, nullable=False)
    fl_opme_andador = Column("FL_OPME_ANDADOR", Integer, default=0, nullable=False)
    fl_opme_protese = Column("FL_OPME_PROTESE", Integer, default=0, nullable=False)
    fl_opme_com_alta = Column("FL_OPME_COM_ALTA", Integer, default=0, nullable=False)
    fl_opme_com_baixa = Column("FL_OPME_COM_BAIXA", Integer, default=0, nullable=False)
    fl_opme_orteses = Column("FL_OPME_ORTESES", Integer, default=0, nullable=False)
    ds_opme_outros = Column("DS_OPME_OUTROS", String(500))
    
    ds_cer_terapias_texto = Column("DS_CER_TERAPIAS_TEXTO", String(4000))
    
    fl_ext_nao_realiza = Column("FL_EXT_NAO_REALIZA", Integer, default=0, nullable=False)
    
    ds_observacoes_gerais = Column("DS_OBSERVACOES_GERAIS", Text)
    ds_conduta_interdisciplinar = Column("DS_CONDUTA_INTERDISCIPLINAR", Text)
    ds_intervencao_prazo = Column("DS_INTERVENCAO_PRAZO", String(200))
    ds_intervencao_descricao = Column("DS_INTERVENCAO_DESCRICAO", Text)
    
    fl_prog_nao_se_aplica = Column("FL_PROG_NAO_SE_APLICA", Integer, default=0, nullable=False)
    fl_prog_glaucoma = Column("FL_PROG_GLAUCOMA", Integer, default=0, nullable=False)
    fl_prog_catarata = Column("FL_PROG_CATARATA", Integer, default=0, nullable=False)
    fl_prog_alem_olhar = Column("FL_PROG_ALEM_OLHAR", Integer, default=0, nullable=False)
    fl_prog_zika = Column("FL_PROG_ZIKA", Integer, default=0, nullable=False)
    fl_prog_apoio_familiar = Column("FL_PROG_APOIO_FAMILIAR", Integer, default=0, nullable=False)
    fl_prog_tea = Column("FL_PROG_TEA", Integer, default=0, nullable=False)
    fl_prog_intervencao_precoce = Column("FL_PROG_INTERVENCAO_PRECOCE", Integer, default=0, nullable=False)
    fl_prog_rop = Column("FL_PROG_ROP", Integer, default=0, nullable=False)
    fl_prog_pronas_tea = Column("FL_PROG_PRONAS_TEA", Integer, default=0, nullable=False)
    fl_prog_pronas_doencas_raras = Column("FL_PROG_PRONAS_DOENCAS_RARAS", Integer, default=0, nullable=False)
    
    fl_nao_concluido = Column("FL_NAO_CONCLUIDO", Integer, default=0, nullable=False)
    
    dt_criacao = Column("DT_CRIACAO", Date, server_default=func.now(), nullable=False)
    dt_atualizacao = Column("DT_ATUALIZACAO", Date, onupdate=func.now())
    fl_ativo = Column("FL_ATIVO", Integer, default=1, nullable=False)

    # Relacionamentos
    diagnosticos_principais = relationship("PTSDiagPrincipal", back_populates="pts", cascade="all, delete-orphan")
    diagnosticos_area = relationship("PTSDiagArea", back_populates="pts", cascade="all, delete-orphan")
    diagnosticos_terapeuticos = relationship("PTSDiagTerapeutico", back_populates="pts", cascade="all, delete-orphan")
    cer_terapias = relationship("PTSCerTerapia", back_populates="pts", cascade="all, delete-orphan")
    condutas_medicas = relationship("PTSCondutaMed", back_populates="pts", cascade="all, delete-orphan")
    condutas_multi = relationship("PTSCondutaMulti", back_populates="pts", cascade="all, delete-orphan")
    instrumentos = relationship("PTSInstrumento", back_populates="pts", cascade="all, delete-orphan")
    objetivos = relationship("PTSObjetivo", back_populates="pts", cascade="all, delete-orphan")
    terapias_indicadas = relationship("PTSTerapia", back_populates="pts", cascade="all, delete-orphan")

    usuario = relationship("User")


class PTSDiagPrincipal(Base):
    __tablename__ = "FAV_TB_PTS_DIAG_PRINCIPAL"
    id_diag_principal = Column("ID_DIAG_PRINCIPAL", Integer, Sequence("SEQ_PTS_DIAG_PRINC"), primary_key=True)
    id_pts = Column("ID_PTS", Integer, ForeignKey("FAV_TB_PTS.ID_PTS", ondelete="CASCADE"), nullable=False, index=True)
    nr_ordem = Column("NR_ORDEM", Integer, default=1, nullable=False)
    ds_diagnostico = Column("DS_DIAGNOSTICO", String(500), nullable=False)
    
    pts = relationship("PTS", back_populates="diagnosticos_principais")


class PTSDiagArea(Base):
    __tablename__ = "FAV_TB_PTS_DIAG_AREA"
    id_diag_area = Column("ID_DIAG_AREA", Integer, Sequence("SEQ_PTS_DIAG_AREA"), primary_key=True)
    id_pts = Column("ID_PTS", Integer, ForeignKey("FAV_TB_PTS.ID_PTS", ondelete="CASCADE"), nullable=False, index=True)
    ds_area = Column("DS_AREA", String(20), nullable=False)
    ds_diagnostico = Column("DS_DIAGNOSTICO", String(500))
    ds_grau = Column("DS_GRAU", String(200))
    
    pts = relationship("PTS", back_populates="diagnosticos_area")


class PTSDiagTerapeutico(Base):
    __tablename__ = "FAV_TB_PTS_DIAG_TERAPEUTICO"
    id_diag_terapeutico = Column("ID_DIAG_TERAPEUTICO", Integer, Sequence("SEQ_PTS_DIAG_TERAP"), primary_key=True)
    id_pts = Column("ID_PTS", Integer, ForeignKey("FAV_TB_PTS.ID_PTS", ondelete="CASCADE"), nullable=False, index=True)
    nr_ordem = Column("NR_ORDEM", Integer, default=1, nullable=False)
    ds_diagnostico = Column("DS_DIAGNOSTICO", String(500), nullable=False)
    
    pts = relationship("PTS", back_populates="diagnosticos_terapeuticos")


class PTSCerTerapia(Base):
    __tablename__ = "FAV_TB_PTS_CER_TERAPIA"
    id_cer_terapia = Column("ID_CER_TERAPIA", Integer, Sequence("SEQ_PTS_CER_TERAP"), primary_key=True)
    id_pts = Column("ID_PTS", Integer, ForeignKey("FAV_TB_PTS.ID_PTS", ondelete="CASCADE"), nullable=False, index=True)
    ds_grupo = Column("DS_GRUPO", String(30), nullable=False)
    nr_ordem = Column("NR_ORDEM", Integer, default=1, nullable=False)
    ds_diagnostico = Column("DS_DIAGNOSTICO", String(500), nullable=False)
    
    pts = relationship("PTS", back_populates="cer_terapias")


class PTSCondutaMed(Base):
    __tablename__ = "FAV_TB_PTS_CONDUTA_MED"
    id_conduta_med = Column("ID_CONDUTA_MED", Integer, Sequence("SEQ_PTS_CONDUTA_MED"), primary_key=True)
    id_pts = Column("ID_PTS", Integer, ForeignKey("FAV_TB_PTS.ID_PTS", ondelete="CASCADE"), nullable=False, index=True)
    nr_ordem = Column("NR_ORDEM", Integer, default=1, nullable=False)
    cd_especialidade = Column("CD_ESPECIALIDADE", String(20), nullable=False)
    ds_especialidade = Column("DS_ESPECIALIDADE", String(200))
    
    pts = relationship("PTS", back_populates="condutas_medicas")


class PTSCondutaMulti(Base):
    __tablename__ = "FAV_TB_PTS_CONDUTA_MULTI"
    id_conduta_multi = Column("ID_CONDUTA_MULTI", Integer, Sequence("SEQ_PTS_CONDUTA_MULTI"), primary_key=True)
    id_pts = Column("ID_PTS", Integer, ForeignKey("FAV_TB_PTS.ID_PTS", ondelete="CASCADE"), nullable=False, index=True)
    nr_ordem = Column("NR_ORDEM", Integer, default=1, nullable=False)
    cd_item = Column("CD_ITEM", String(20), nullable=False)
    ds_item = Column("DS_ITEM", String(200))
    
    pts = relationship("PTS", back_populates="condutas_multi")


class PTSInstrumento(Base):
    __tablename__ = "FAV_TB_PTS_INSTRUMENTO"
    id_instrumento = Column("ID_INSTRUMENTO", Integer, Sequence("SEQ_PTS_INSTRUMENTO"), primary_key=True)
    id_pts = Column("ID_PTS", Integer, ForeignKey("FAV_TB_PTS.ID_PTS", ondelete="CASCADE"), nullable=False, index=True)
    nr_ordem = Column("NR_ORDEM", Integer, default=1, nullable=False)
    cd_instrumento = Column("CD_INSTRUMENTO", String(20))
    ds_instrumento = Column("DS_INSTRUMENTO", String(500), nullable=False)
    
    pts = relationship("PTS", back_populates="instrumentos")


class PTSObjetivo(Base):
    __tablename__ = "FAV_TB_PTS_OBJETIVO"
    id_objetivo = Column("ID_OBJETIVO", Integer, Sequence("SEQ_PTS_OBJETIVO"), primary_key=True)
    id_pts = Column("ID_PTS", Integer, ForeignKey("FAV_TB_PTS.ID_PTS", ondelete="CASCADE"), nullable=False, index=True)
    ds_vigencia = Column("DS_VIGENCIA", String(7), nullable=False)
    ds_especialidade = Column("DS_ESPECIALIDADE", String(30), nullable=False)
    ds_momento = Column("DS_MOMENTO", String(10), nullable=False)
    nr_item = Column("NR_ITEM", Integer, nullable=False)
    ds_objetivo = Column("DS_OBJETIVO", String(500))
    ds_descricao = Column("DS_DESCRICAO", Text)
    ds_status = Column("DS_STATUS", String(20))
    ds_motivo = Column("DS_MOTIVO", String(50))
    
    pts = relationship("PTS", back_populates="objetivos")


class PTSTerapia(Base):
    __tablename__ = "FAV_TB_PTS_TERAPIA"
    id_terapia = Column("ID_TERAPIA", Integer, Sequence("SEQ_PTS_TERAPIA"), primary_key=True)
    id_pts = Column("ID_PTS", Integer, ForeignKey("FAV_TB_PTS.ID_PTS", ondelete="CASCADE"), nullable=False, index=True)
    nr_ordem = Column("NR_ORDEM", Integer, default=1, nullable=False)
    cd_terapia = Column("CD_TERAPIA", String(20), nullable=False)
    ds_terapia = Column("DS_TERAPIA", String(200))
    cd_tipo_atendimento = Column("CD_TIPO_ATENDIMENTO", String(5))
    ds_tipo_atendimento = Column("DS_TIPO_ATENDIMENTO", String(50))
    cd_periodicidade = Column("CD_PERIODICIDADE", String(5))
    ds_periodicidade = Column("DS_PERIODICIDADE", String(50))
    nr_qtde_sessoes = Column("NR_QTDE_SESSOES", Integer)
    
    pts = relationship("PTS", back_populates="terapias_indicadas")
