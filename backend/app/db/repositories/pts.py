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

def create_pts(db: Session, pts_data: PTSCreate, id_usuario: int) -> PTS:
    # 1. Inativar PTS anterior (mesma vigência, mesmo paciente)
    vigencia = pts_data.pts_vigencia or calcular_vigencia()
    
    db.query(PTS).filter(
        PTS.cd_paciente == pts_data.cd_paciente,
        PTS.ds_vigencia == vigencia,
        PTS.fl_ativo == 1
    ).update({"fl_ativo": 0})
    
    # 2. Criar registro principal do PTS
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
        fl_ativo=1
    )
    
    db.add(db_pts)
    db.flush() # Garante que db_pts.id_pts esteja preenchido via sequence/trigger
    
    # 3. Inserir Tabelas Filhas
    
    # Diagnósticos Principais
    for i, diag in enumerate(pts_data.diagnosticos_principais):
        db.add(PTSDiagPrincipal(id_pts=db_pts.id_pts, nr_ordem=i+1, ds_diagnostico=diag))
        
    # Diagnóstico Área (visual, intelectual, fisica, auditiva)
    for area, diag in pts_data.diagnosticos_area.items():
        grau = pts_data.grau_area.get(area)
        if diag or grau:
            db.add(PTSDiagArea(id_pts=db_pts.id_pts, ds_area=area, ds_diagnostico=diag, ds_grau=grau))
            
    # Diagnósticos Terapêuticos
    for i, diag in enumerate(pts_data.diagnosticos_terapeuticos):
        db.add(PTSDiagTerapeutico(id_pts=db_pts.id_pts, nr_ordem=i+1, ds_diagnostico=diag))
        
    # CER Terapias (Seção 10 - Serviços Externos)
    for i, diag in enumerate(pts_data.cer_terapias):
        # A nova estrutura de UI usa um grupo único, vamos salvar todos sob 'outros' ou 'unificado'
        db.add(PTSCerTerapia(id_pts=db_pts.id_pts, ds_grupo="unificado", nr_ordem=i+1, ds_diagnostico=diag))
        
    # Conduta Médica
    for i, cond in enumerate(pts_data.conduta_avaliacao_medica):
        # Assumindo que a string tem o formato "cd/ds" ou vamos salvar direto
        db.add(PTSCondutaMed(id_pts=db_pts.id_pts, nr_ordem=i+1, cd_especialidade="0", ds_especialidade=cond))
        
    # Conduta Multidisciplinar
    for i, cond in enumerate(pts_data.conduta_multidisciplinar):
        db.add(PTSCondutaMulti(id_pts=db_pts.id_pts, nr_ordem=i+1, cd_item="0", ds_item=cond))
        
    # Terapias Indicadas
    for i, terapia in enumerate(pts_data.terapias_indicadas):
        if terapia.terapia:
            db.add(PTSTerapia(
                id_pts=db_pts.id_pts,
                nr_ordem=i+1,
                cd_terapia="0",
                ds_terapia=terapia.terapia,
                cd_tipo_atendimento="0",
                ds_tipo_atendimento=terapia.tipo_atendimento,
                cd_periodicidade="0",
                ds_periodicidade=terapia.periodicidade,
                nr_qtde_sessoes=terapia.qtde_sessoes
            ))
            
    # Instrumentos
    for i, inst in enumerate(pts_data.instrumentos):
        db.add(PTSInstrumento(id_pts=db_pts.id_pts, nr_ordem=i+1, ds_instrumento=inst))
        
    # Objetivos
    for esp, momentos in pts_data.objetivos.items():
        # Anterior
        for i, obj in enumerate(momentos.anterior):
            if obj.objetivo or obj.descricao:
                db.add(PTSObjetivo(
                    id_pts=db_pts.id_pts,
                    ds_vigencia=vigencia,
                    ds_especialidade=esp,
                    ds_momento="anterior",
                    nr_item=i+1,
                    ds_objetivo=obj.objetivo,
                    ds_descricao=obj.descricao,
                    ds_status=obj.status,
                    ds_motivo=obj.motivo
                ))
        # Atual
        for i, obj in enumerate(momentos.atual):
            if obj.objetivo or obj.descricao:
                db.add(PTSObjetivo(
                    id_pts=db_pts.id_pts,
                    ds_vigencia=vigencia,
                    ds_especialidade=esp,
                    ds_momento="atual",
                    nr_item=i+1,
                    ds_objetivo=obj.objetivo,
                    ds_descricao=obj.descricao,
                    ds_status=None,
                    ds_motivo=None
                ))

    db.commit()
    db.refresh(db_pts)
    return db_pts
