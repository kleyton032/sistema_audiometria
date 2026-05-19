from sqlalchemy.orm import Session
from datetime import datetime

from app.db.models import (
    PTS,
    PTSDiagPrincipal,
    PTSDiagArea,
    PTSDiagTerapeutico,
    PTSCerTerapia,
    PTSCondutaMed,
    PTSCondutaMulti,
    PTSInstrumento,
    PTSObjetivo,
    PTSTerapia,
)
from app.schemas.pts import PTSCreate

def calcular_vigencia() -> str:
    """Retorna a vigência atual no formato YYYY-MM, sendo 05 ou 11."""
    now = datetime.now()
    if now.month <= 6:
        return f"{now.year}-05"
    return f"{now.year}-11"


def pts_to_dict(pts: PTS) -> dict:
    """Serializa um objeto PTS (com seus filhos) para o formato esperado pelo frontend."""
    # Monta objetivos agrupados por especialidade
    objetivos: dict = {}
    vazio = lambda: {"objetivo": None, "descricao": None, "status": None, "motivo": None}
    for obj in pts.objetivos:
        esp = obj.ds_especialidade
        if esp not in objetivos:
            objetivos[esp] = {
                "anterior": [vazio(), vazio(), vazio()],
                "atual":    [vazio(), vazio(), vazio()],
                "outros_atual": None,
            }
        idx = (obj.nr_item or 1) - 1
        if 0 <= idx <= 2:
            objetivo_val = obj.ds_outros if (getattr(obj, "ds_outros", None) and idx == 2) else obj.ds_objetivo
            objetivos[esp][obj.ds_momento][idx] = {
                "objetivo": objetivo_val,
                "descricao": obj.ds_descricao,
                "status":   obj.ds_status,
                "motivo":   obj.ds_motivo,
            }
            
        if obj.ds_momento == "atual" and idx == 2 and getattr(obj, "ds_outros", None):
            objetivos[esp]["outros_atual"] = obj.ds_outros

    return {
        "id_pts":        pts.id_pts,
        "id_usuario":    pts.id_usuario,
        "usuario_especialidade": (pts.usuario.prestador.nm_tip_presta if pts.usuario and pts.usuario.prestador else (pts.usuario.ds_especialidade if pts.usuario else None)),
        "usuario_conselho": (pts.usuario.prestador.ds_conselho if pts.usuario and pts.usuario.prestador else "Conselho"),
        "usuario_nr_conselho": (pts.usuario.prestador.ds_codigo_conselho if pts.usuario and pts.usuario.prestador else (pts.usuario.nr_conselho if pts.usuario else None)),
        "fl_finalizado": getattr(pts, "fl_finalizado", 0) or 0,
        "ds_vigencia":   pts.ds_vigencia,
        # Campos escalares do formulário
        "queixa_principal":          pts.ds_queixa_principal,
        "def_associada_visual":      bool(pts.fl_def_visual),
        "def_associada_intelectual": bool(pts.fl_def_intelectual),
        "def_associada_fisica":      bool(pts.fl_def_fisica),
        "def_associada_auditiva":    bool(pts.fl_def_auditiva),
        "cond_nao_se_aplica":        bool(pts.fl_cond_nao_se_aplica),
        "cond_nao_escuta":           bool(pts.fl_cond_nao_escuta),
        "cond_nao_fala":             bool(pts.fl_cond_nao_fala),
        "cond_nao_enxerga":          bool(pts.fl_cond_nao_enxerga),
        "cond_agitacao":             bool(pts.fl_cond_agitacao),
        "cond_agressividade":        bool(pts.fl_cond_agressividade),
        "cond_nao_anda":             bool(pts.fl_cond_nao_anda),
        "cond_nao_fica_sozinho":     bool(pts.fl_cond_nao_fica_sozinho),
        "cond_sem_ctrl_cervical":    bool(pts.fl_cond_sem_ctrl_cervical),
        "cond_sem_ctrl_tronco":      bool(pts.fl_cond_sem_ctrl_tronco),
        "cond_outra":                pts.ds_cond_outra,
        "opme_nao_se_aplica":        bool(pts.fl_opme_nao_se_aplica),
        "opme_cadeira":              bool(pts.fl_opme_cadeira),
        "opme_bengala":              bool(pts.fl_opme_bengala),
        "opme_muleta":               bool(pts.fl_opme_muleta),
        "opme_andador":              bool(pts.fl_opme_andador),
        "opme_protese":              bool(pts.fl_opme_protese),
        "opme_com_alta":             bool(pts.fl_opme_com_alta),
        "opme_com_baixa":            bool(pts.fl_opme_com_baixa),
        "opme_orteses":              bool(pts.fl_opme_orteses),
        "opme_outros":               pts.ds_opme_outros,
        "cer_terapias_texto":        pts.ds_cer_terapias_texto,
        "ext_nao_realiza":           bool(pts.fl_ext_nao_realiza),
        "observacoes_gerais":        pts.ds_observacoes_gerais,
        "conduta_interdisciplinar":  pts.ds_conduta_interdisciplinar,
        "intervencao_prazo":         pts.ds_intervencao_prazo,
        "intervencao_descricao":     pts.ds_intervencao_descricao,
        "prog_nao_se_aplica":        bool(pts.fl_prog_nao_se_aplica),
        "prog_glaucoma":             bool(pts.fl_prog_glaucoma),
        "prog_catarata":             bool(pts.fl_prog_catarata),
        "prog_alem_olhar":           bool(pts.fl_prog_alem_olhar),
        "prog_zika":                 bool(pts.fl_prog_zika),
        "prog_apoio_familiar":       bool(pts.fl_prog_apoio_familiar),
        "prog_tea":                  bool(pts.fl_prog_tea),
        "prog_intervencao_precoce":  bool(pts.fl_prog_intervencao_precoce),
        "prog_rop":                  bool(pts.fl_prog_rop),
        "prog_pronas_tea":           bool(pts.fl_prog_pronas_tea),
        "prog_pronas_doencas_raras": bool(pts.fl_prog_pronas_doencas_raras),
        "pts_nao_concluido":         bool(pts.fl_nao_concluido),
        "pts_vigencia":              pts.ds_vigencia,
        # Listas
        "diagnosticos_principais": [
            r.ds_diagnostico for r in sorted(pts.diagnosticos_principais, key=lambda x: x.nr_ordem)
        ],
        "diagnosticos_area": {r.ds_area: r.ds_diagnostico for r in pts.diagnosticos_area},
        "grau_area":         {r.ds_area: r.ds_grau        for r in pts.diagnosticos_area},
        "diagnosticos_terapeuticos": [
            r.ds_diagnostico for r in sorted(pts.diagnosticos_terapeuticos, key=lambda x: x.nr_ordem)
        ],
        "cer_terapias": [
            r.ds_diagnostico for r in sorted(pts.cer_terapias, key=lambda x: x.nr_ordem)
        ],
        "conduta_avaliacao_medica": [
            r.ds_especialidade for r in sorted(pts.condutas_medicas, key=lambda x: x.nr_ordem)
        ],
        "conduta_multidisciplinar": [
            r.ds_item for r in sorted(pts.condutas_multi, key=lambda x: x.nr_ordem)
        ],
        "instrumentos": [
            {"ds_instrumento": r.ds_instrumento, "ds_calculo": r.ds_calculo}
            for r in sorted(pts.instrumentos, key=lambda x: x.nr_ordem)
        ],
        "terapias_indicadas": [
            {
                "key": i + 1,
                "cd_terapia":       r.cd_terapia,
                "terapia":          r.ds_terapia,
                "tipo_atendimento": r.ds_tipo_atendimento,
                "periodicidade":    r.ds_periodicidade,
                "qtde_sessoes":     r.nr_qtde_sessoes,
            }
            for i, r in enumerate(sorted(pts.terapias_indicadas, key=lambda x: x.nr_ordem))
        ],
        "objetivos": objetivos,
    }


def get_pts_by_id(db: Session, id_pts: int) -> PTS | None:
    from sqlalchemy.orm import joinedload
    return (
        db.query(PTS)
        .options(
            joinedload(PTS.diagnosticos_principais),
            joinedload(PTS.diagnosticos_area),
            joinedload(PTS.diagnosticos_terapeuticos),
            joinedload(PTS.cer_terapias),
            joinedload(PTS.condutas_medicas),
            joinedload(PTS.condutas_multi),
            joinedload(PTS.instrumentos),
            joinedload(PTS.objetivos),
            joinedload(PTS.terapias_indicadas),
        )
        .filter(PTS.id_pts == id_pts)
        .first()
    )


def get_pts_status_batch(db: Session, nr_atendimentos: list[str], vigencia: str) -> dict:
    """Retorna {nr_atendimento: {id_pts, fl_finalizado}} para os atendimentos informados."""
    rows = (
        db.query(PTS.nr_atendimento, PTS.id_pts, PTS.fl_finalizado)
        .filter(
            PTS.nr_atendimento.in_(nr_atendimentos),
            PTS.ds_vigencia == vigencia,
            PTS.fl_ativo == 1,
        )
        .all()
    )
    return {
        row.nr_atendimento: {
            "id_pts":        row.id_pts,
            "fl_finalizado": getattr(row, "fl_finalizado", 0) or 0,
        }
        for row in rows
    }


def _inserir_filhos(db: Session, id_pts: int, vigencia: str, pts_data: PTSCreate):
    """Apaga todos os registros filhos e reinsere com os dados atuais."""
    for model in (PTSDiagPrincipal, PTSDiagArea, PTSDiagTerapeutico, PTSCerTerapia,
                  PTSCondutaMed, PTSCondutaMulti, PTSInstrumento, PTSObjetivo, PTSTerapia):
        db.query(model).filter(model.id_pts == id_pts).delete()
    db.flush()

    for i, diag in enumerate(pts_data.diagnosticos_principais):
        db.add(PTSDiagPrincipal(id_pts=id_pts, nr_ordem=i+1, ds_diagnostico=diag))

    for area, diag in pts_data.diagnosticos_area.items():
        grau = pts_data.grau_area.get(area)
        if diag or grau:
            db.add(PTSDiagArea(id_pts=id_pts, ds_area=area, ds_diagnostico=diag, ds_grau=grau))

    for i, diag in enumerate(pts_data.diagnosticos_terapeuticos):
        db.add(PTSDiagTerapeutico(id_pts=id_pts, nr_ordem=i+1, ds_diagnostico=diag))

    for i, diag in enumerate(pts_data.cer_terapias):
        db.add(PTSCerTerapia(id_pts=id_pts, ds_grupo="unificado", nr_ordem=i+1, ds_diagnostico=diag))

    for i, cond in enumerate(pts_data.conduta_avaliacao_medica):
        db.add(PTSCondutaMed(id_pts=id_pts, nr_ordem=i+1, cd_especialidade="0", ds_especialidade=cond))

    for i, cond in enumerate(pts_data.conduta_multidisciplinar):
        db.add(PTSCondutaMulti(id_pts=id_pts, nr_ordem=i+1, cd_item="0", ds_item=cond))

    for i, terapia in enumerate(pts_data.terapias_indicadas):
        if terapia.terapia:
            db.add(PTSTerapia(
                id_pts=id_pts,
                nr_ordem=i+1,
                cd_terapia=terapia.cd_terapia or "0",
                ds_terapia=terapia.terapia,
                cd_tipo_atendimento="0",
                ds_tipo_atendimento=terapia.tipo_atendimento,
                cd_periodicidade="0",
                ds_periodicidade=terapia.periodicidade,
                nr_qtde_sessoes=terapia.qtde_sessoes
            ))

    for i, inst in enumerate(pts_data.instrumentos):
        db.add(PTSInstrumento(
            id_pts=id_pts,
            nr_ordem=i+1,
            ds_instrumento=inst.ds_instrumento,
            ds_calculo=inst.ds_calculo,
        ))

    for esp, momentos in pts_data.objetivos.items():
        for i, obj in enumerate(momentos.anterior):
            if obj.objetivo or obj.descricao:
                db.add(PTSObjetivo(
                    id_pts=id_pts, ds_vigencia=vigencia, ds_especialidade=esp,
                    ds_momento="anterior", nr_item=i+1,
                    ds_objetivo=obj.objetivo, ds_descricao=obj.descricao,
                    ds_status=obj.status, ds_motivo=obj.motivo
                ))
        for i, obj in enumerate(momentos.atual):
            if obj.objetivo or obj.descricao:
                db.add(PTSObjetivo(
                    id_pts=id_pts, ds_vigencia=vigencia, ds_especialidade=esp,
                    ds_momento="atual", nr_item=i+1,
                    ds_objetivo=obj.objetivo, ds_descricao=obj.descricao,
                    ds_status=None, ds_motivo=None
                ))
        if getattr(momentos, "outros_atual", None):
            db.add(PTSObjetivo(
                id_pts=id_pts, ds_vigencia=vigencia, ds_especialidade=esp,
                ds_momento="atual", nr_item=3,
                ds_objetivo=None, ds_descricao=None,
                ds_status=None, ds_motivo=None,
                ds_outros=momentos.outros_atual
            ))


def create_pts(db: Session, pts_data: PTSCreate, id_usuario: int) -> PTS:
    vigencia = pts_data.pts_vigencia or calcular_vigencia()

    # Tenta localizar um PTS já existente para este profissional, paciente e vigência (Upsert)
    existente = db.query(PTS).filter(
        PTS.cd_paciente == pts_data.cd_paciente,
        PTS.ds_vigencia == vigencia,
        PTS.id_usuario == id_usuario,
        PTS.fl_ativo == 1
    ).first()

    if existente:
        return update_pts(db, existente.id_pts, pts_data)

    db_pts = PTS(
        cd_paciente=pts_data.cd_paciente,
        nr_atendimento=pts_data.nr_atendimento,
        id_usuario=id_usuario,
        ds_vigencia=vigencia,
        ds_queixa_principal=pts_data.queixa_principal,
        fl_def_visual=int(pts_data.def_associada_visual),
        fl_def_intelectual=int(pts_data.def_associada_intelectual),
        fl_def_fisica=int(pts_data.def_associada_fisica),
        fl_def_auditiva=int(pts_data.def_associada_auditiva),
        fl_cond_nao_se_aplica=int(pts_data.cond_nao_se_aplica),
        fl_cond_nao_escuta=int(pts_data.cond_nao_escuta),
        fl_cond_nao_fala=int(pts_data.cond_nao_fala),
        fl_cond_nao_enxerga=int(pts_data.cond_nao_enxerga),
        fl_cond_agitacao=int(pts_data.cond_agitacao),
        fl_cond_agressividade=int(pts_data.cond_agressividade),
        fl_cond_nao_anda=int(pts_data.cond_nao_anda),
        fl_cond_nao_fica_sozinho=int(pts_data.cond_nao_fica_sozinho),
        fl_cond_sem_ctrl_cervical=int(pts_data.cond_sem_ctrl_cervical),
        fl_cond_sem_ctrl_tronco=int(pts_data.cond_sem_ctrl_tronco),
        ds_cond_outra=pts_data.cond_outra,
        fl_opme_nao_se_aplica=int(pts_data.opme_nao_se_aplica),
        fl_opme_cadeira=int(pts_data.opme_cadeira),
        fl_opme_bengala=int(pts_data.opme_bengala),
        fl_opme_muleta=int(pts_data.opme_muleta),
        fl_opme_andador=int(pts_data.opme_andador),
        fl_opme_protese=int(pts_data.opme_protese),
        fl_opme_com_alta=int(pts_data.opme_com_alta),
        fl_opme_com_baixa=int(pts_data.opme_com_baixa),
        fl_opme_orteses=int(pts_data.opme_orteses),
        ds_opme_outros=pts_data.opme_outros,
        ds_cer_terapias_texto=pts_data.cer_terapias_texto,
        fl_ext_nao_realiza=int(pts_data.ext_nao_realiza),
        ds_observacoes_gerais=pts_data.observacoes_gerais,
        ds_conduta_interdisciplinar=pts_data.conduta_interdisciplinar,
        ds_intervencao_prazo=pts_data.intervencao_prazo,
        ds_intervencao_descricao=pts_data.intervencao_descricao,
        fl_prog_nao_se_aplica=int(pts_data.prog_nao_se_aplica),
        fl_prog_glaucoma=int(pts_data.prog_glaucoma),
        fl_prog_catarata=int(pts_data.prog_catarata),
        fl_prog_alem_olhar=int(pts_data.prog_alem_olhar),
        fl_prog_zika=int(pts_data.prog_zika),
        fl_prog_apoio_familiar=int(pts_data.prog_apoio_familiar),
        fl_prog_tea=int(pts_data.prog_tea),
        fl_prog_intervencao_precoce=int(pts_data.prog_intervencao_precoce),
        fl_prog_rop=int(pts_data.prog_rop),
        fl_prog_pronas_tea=int(pts_data.prog_pronas_tea),
        fl_prog_pronas_doencas_raras=int(pts_data.prog_pronas_doencas_raras),
        fl_nao_concluido=int(pts_data.pts_nao_concluido),
        fl_finalizado=0,
        fl_ativo=1
    )

    db.add(db_pts)
    db.flush()

    _inserir_filhos(db, db_pts.id_pts, vigencia, pts_data)

    db.commit()
    db.refresh(db_pts)
    return db_pts


def update_pts(db: Session, id_pts: int, pts_data: PTSCreate) -> PTS:
    db_pts = db.query(PTS).filter(PTS.id_pts == id_pts).first()
    if db_pts is None:
        raise ValueError(f"PTS {id_pts} não encontrado")

    vigencia = pts_data.pts_vigencia or calcular_vigencia()

    # Atualiza nr_atendimento para manter o vínculo com o atendimento atual,
    # garantindo que o status-batch encontre o PTS pelo cd_atendimento do dia.
    if pts_data.nr_atendimento:
        db_pts.nr_atendimento = pts_data.nr_atendimento

    db_pts.ds_queixa_principal = pts_data.queixa_principal
    db_pts.fl_def_visual = int(pts_data.def_associada_visual)
    db_pts.fl_def_intelectual = int(pts_data.def_associada_intelectual)
    db_pts.fl_def_fisica = int(pts_data.def_associada_fisica)
    db_pts.fl_def_auditiva = int(pts_data.def_associada_auditiva)
    db_pts.fl_cond_nao_se_aplica = int(pts_data.cond_nao_se_aplica)
    db_pts.fl_cond_nao_escuta = int(pts_data.cond_nao_escuta)
    db_pts.fl_cond_nao_fala = int(pts_data.cond_nao_fala)
    db_pts.fl_cond_nao_enxerga = int(pts_data.cond_nao_enxerga)
    db_pts.fl_cond_agitacao = int(pts_data.cond_agitacao)
    db_pts.fl_cond_agressividade = int(pts_data.cond_agressividade)
    db_pts.fl_cond_nao_anda = int(pts_data.cond_nao_anda)
    db_pts.fl_cond_nao_fica_sozinho = int(pts_data.cond_nao_fica_sozinho)
    db_pts.fl_cond_sem_ctrl_cervical = int(pts_data.cond_sem_ctrl_cervical)
    db_pts.fl_cond_sem_ctrl_tronco = int(pts_data.cond_sem_ctrl_tronco)
    db_pts.ds_cond_outra = pts_data.cond_outra
    db_pts.fl_opme_nao_se_aplica = int(pts_data.opme_nao_se_aplica)
    db_pts.fl_opme_cadeira = int(pts_data.opme_cadeira)
    db_pts.fl_opme_bengala = int(pts_data.opme_bengala)
    db_pts.fl_opme_muleta = int(pts_data.opme_muleta)
    db_pts.fl_opme_andador = int(pts_data.opme_andador)
    db_pts.fl_opme_protese = int(pts_data.opme_protese)
    db_pts.fl_opme_com_alta = int(pts_data.opme_com_alta)
    db_pts.fl_opme_com_baixa = int(pts_data.opme_com_baixa)
    db_pts.fl_opme_orteses = int(pts_data.opme_orteses)
    db_pts.ds_opme_outros = pts_data.opme_outros
    db_pts.ds_cer_terapias_texto = pts_data.cer_terapias_texto
    db_pts.fl_ext_nao_realiza = int(pts_data.ext_nao_realiza)
    db_pts.ds_observacoes_gerais = pts_data.observacoes_gerais
    db_pts.ds_conduta_interdisciplinar = pts_data.conduta_interdisciplinar
    db_pts.ds_intervencao_prazo = pts_data.intervencao_prazo
    db_pts.ds_intervencao_descricao = pts_data.intervencao_descricao
    db_pts.fl_prog_nao_se_aplica = int(pts_data.prog_nao_se_aplica)
    db_pts.fl_prog_glaucoma = int(pts_data.prog_glaucoma)
    db_pts.fl_prog_catarata = int(pts_data.prog_catarata)
    db_pts.fl_prog_alem_olhar = int(pts_data.prog_alem_olhar)
    db_pts.fl_prog_zika = int(pts_data.prog_zika)
    db_pts.fl_prog_apoio_familiar = int(pts_data.prog_apoio_familiar)
    db_pts.fl_prog_tea = int(pts_data.prog_tea)
    db_pts.fl_prog_intervencao_precoce = int(pts_data.prog_intervencao_precoce)
    db_pts.fl_prog_rop = int(pts_data.prog_rop)
    db_pts.fl_prog_pronas_tea = int(pts_data.prog_pronas_tea)
    db_pts.fl_prog_pronas_doencas_raras = int(pts_data.prog_pronas_doencas_raras)
    db_pts.fl_nao_concluido = int(pts_data.pts_nao_concluido)

    db.flush()

    _inserir_filhos(db, id_pts, vigencia, pts_data)

    db.commit()
    db.refresh(db_pts)
    return db_pts

