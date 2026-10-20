from pydantic import BaseModel, Field
from typing import Optional, Dict, List

class PTSObjetivoItem(BaseModel):
    objetivo: Optional[str] = None
    descricao: Optional[str] = None
    status: Optional[str] = None
    motivo: Optional[str] = None

class PTSObjetivoMomento(BaseModel):
    anterior: List[PTSObjetivoItem]
    atual: List[PTSObjetivoItem]
    outros_atual: Optional[str] = None

class PTSTerapiaRow(BaseModel):
    key: int
    cd_terapia: Optional[str] = None
    terapia: Optional[str] = None
    tipo_atendimento: Optional[str] = None
    periodicidade: Optional[str] = None
    qtde_sessoes: Optional[int] = None

class PTSCreate(BaseModel):
    # Identificação básica
    cd_paciente: Optional[str] = None
    nr_atendimento: Optional[str] = None
    
    # Seção 4 - Queixa principal
    queixa_principal: Optional[str] = None
    
    # Seções 1 a 3 - Diagnósticos
    diagnosticos_principais: List[str] = []
    diagnosticos_area: Dict[str, Optional[str]] = {}
    grau_area: Dict[str, Optional[str]] = {}
    
    # Seção 5 - Diagnósticos Terapêuticos
    diagnosticos_terapeuticos: List[str] = []
    
    # Seção 6 - Deficiências Associadas
    def_associada_visual: bool = False
    def_associada_intelectual: bool = False
    def_associada_fisica: bool = False
    def_associada_auditiva: bool = False
    
    # Seção 7 - Condições do Paciente
    cond_nao_se_aplica: bool = False
    cond_nao_escuta: bool = False
    cond_nao_fala: bool = False
    cond_nao_enxerga: bool = False
    cond_agitacao: bool = False
    cond_agressividade: bool = False
    cond_nao_anda: bool = False
    cond_nao_fica_sozinho: bool = False
    cond_sem_ctrl_cervical: bool = False
    cond_sem_ctrl_tronco: bool = False
    cond_outra: Optional[str] = None
    
    # Seção 8 - OPME
    opme_nao_se_aplica: bool = False
    opme_cadeira: bool = False
    opme_bengala: bool = False
    opme_muleta: bool = False
    opme_andador: bool = False
    opme_protese: bool = False
    opme_com_alta: bool = False
    opme_com_baixa: bool = False
    opme_orteses: bool = False
    opme_outros: Optional[str] = None
    
    # Seção 9 - CER Terapias Texto (Read-only on frontend but maybe passed?)
    cer_terapias_texto: Optional[str] = None
    
    # Seção 10 - Terapias Externas (CER IV Externo)
    cer_terapias: List[str] = []
    ext_nao_realiza: bool = False
    
    # Seções 11 a 13 - Condutas e Terapias Indicadas
    conduta_avaliacao_medica: List[str] = []
    conduta_multidisciplinar: List[str] = []
    terapias_indicadas: List[PTSTerapiaRow] = []
    
    # Seção 14 a 16 - Intervenção
    observacoes_gerais: Optional[str] = None
    conduta_interdisciplinar: Optional[str] = None
    intervencao_prazo: Optional[str] = None
    intervencao_descricao: Optional[str] = None
    
    # Seção 17 - Instrumentos
    class InstrumentoItem(BaseModel):
        ds_instrumento: str
        ds_calculo: Optional[str] = None

    instrumentos: List['PTSCreate.InstrumentoItem'] = []
    
    # Seção 18 - Programas
    prog_nao_se_aplica: bool = False
    prog_glaucoma: bool = False
    prog_catarata: bool = False
    prog_alem_olhar: bool = False
    prog_zika: bool = False
    prog_apoio_familiar: bool = False
    prog_tea: bool = False
    prog_intervencao_precoce: bool = False
    prog_rop: bool = False
    prog_pronas_tea: bool = False
    prog_pronas_doencas_raras: bool = False
    
    # Objetivos (Seção de Objetivos por Especialidade)
    objetivos: Dict[str, PTSObjetivoMomento] = {}
    
    # Status e Vigência
    pts_nao_concluido: bool = False
    pts_vigencia: Optional[str] = None

class PtsHistoricoObjetivoOut(BaseModel):
    id_objetivo: int
    ds_especialidade: str
    ds_momento: str
    nr_item: int
    ds_objetivo: Optional[str] = None
    ds_status: Optional[str] = None
    ds_motivo: Optional[str] = None

class PtsHistoricoItemOut(BaseModel):
    id_pts: int
    dt_criacao: str
    ds_vigencia: str
    nm_usuario: str
    fl_finalizado: int
    objetivos: List[PtsHistoricoObjetivoOut] = []

class PtsHistoricoSummaryOut(BaseModel):
    total_pts: int
    primeiro_pts_data: Optional[str] = None
    ultimo_pts_data: Optional[str] = None
    historico: List[PtsHistoricoItemOut] = []
