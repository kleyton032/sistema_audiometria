"""
Schemas Pydantic para validação de dados do módulo Psicologia.
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


# ============================================================================
# ANAMNESE
# ============================================================================

class AnamneseBase(BaseModel):
    """Base para Anamnese."""
    ds_historia_familiar: Optional[str] = Field(None, max_length=4000)
    ds_historia_pessoal: Optional[str] = Field(None, max_length=4000)
    ds_escolaridade: Optional[str] = Field(None, max_length=500)
    ds_socioeconomico: Optional[str] = Field(None, max_length=500)
    ds_queixa_principal: Optional[str] = Field(None, max_length=4000)
    ds_hipotese_inicial: Optional[str] = Field(None, max_length=4000)


class AnamneseCreate(AnamneseBase):
    """Schema para criação de Anamnese."""
    pass


class AnamneseUpdate(AnamneseBase):
    """Schema para atualização de Anamnese."""
    pass


class AnamneseResponse(AnamneseBase):
    """Schema de resposta da Anamnese."""
    id_anamnese: int
    id_psicologia_doc: int
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime]

    class Config:
        from_attributes = True


# ============================================================================
# EVOLUÇÃO
# ============================================================================

class EvolucaoBase(BaseModel):
    """Base para Evolução."""
    nr_atendimento: Optional[str] = Field(None, max_length=20)
    ds_data_atendimento: datetime
    ds_observacoes: Optional[str] = Field(None, max_length=4000)
    ds_objetivos_sessao: Optional[str] = Field(None, max_length=2000)
    ds_intervencoes: Optional[str] = Field(None, max_length=4000)
    ds_proximos_passos: Optional[str] = Field(None, max_length=2000)


class EvolucaoCreate(EvolucaoBase):
    """Schema para criação de Evolução."""
    pass


class EvolucaoUpdate(EvolucaoBase):
    """Schema para atualização de Evolução."""
    pass


class EvolucaoResponse(EvolucaoBase):
    """Schema de resposta de Evolução."""
    id_evolucao: int
    id_psicologia_doc: int
    id_usuario_criou: int
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime]

    class Config:
        from_attributes = True


# ============================================================================
# AVALIAÇÃO
# ============================================================================

class AvaliacaoBase(BaseModel):
    """Base para Avaliação."""
    ds_tipo_teste: Optional[str] = Field(None, max_length=100)
    ds_resultado: Optional[str] = Field(None, max_length=4000)
    nr_escore: Optional[float] = None
    ds_interpretacao: Optional[str] = Field(None, max_length=4000)
    ds_recomendacoes: Optional[str] = Field(None, max_length=4000)
    dt_realizacao: datetime


class AvaliacaoCreate(AvaliacaoBase):
    """Schema para criação de Avaliação."""
    pass


class AvaliacaoUpdate(BaseModel):
    """Schema para atualização de Avaliação (sem alterar tipo de teste ou data)."""
    ds_resultado: Optional[str] = Field(None, max_length=4000)
    nr_escore: Optional[float] = None
    ds_interpretacao: Optional[str] = Field(None, max_length=4000)
    ds_recomendacoes: Optional[str] = Field(None, max_length=4000)


class AvaliacaoResponse(AvaliacaoBase):
    """Schema de resposta de Avaliação."""
    id_avaliacao: int
    id_psicologia_doc: int
    id_usuario_fez: int
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime]
    ds_status: str

    class Config:
        from_attributes = True


# ============================================================================
# VERSÃO (AUDITORIA)
# ============================================================================

class VersaoResponse(BaseModel):
    """Schema de resposta de Versão/Auditoria."""
    id_versao: int
    id_psicologia_doc: int
    nr_versao: int
    ds_conteudo_anterior: Optional[str]
    ds_campo_alterado: Optional[str]
    ds_motivo_alteracao: Optional[str]
    dt_edicao: datetime

    class Config:
        from_attributes = True


# ============================================================================
# DOCUMENTO PSICOLÓGICO (Master)
# ============================================================================

class DocumentoCreate(BaseModel):
    """Schema para criação de Documento Psicológico."""
    cd_paciente: str = Field(..., max_length=20)
    ds_tipo_doc: str = Field(..., regex="^(ANAMNESE|EVOLUCAO|AVALIACAO)$")
    ds_observacoes: Optional[str] = Field(None, max_length=4000)


class DocumentoUpdate(BaseModel):
    """Schema para atualização de Documento."""
    ds_observacoes: Optional[str] = Field(None, max_length=4000)


class DocumentoResponse(BaseModel):
    """Schema de resposta de Documento completo."""
    id_psicologia_doc: int
    cd_paciente: str
    id_usuario: int
    ds_tipo_doc: str
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime]
    fl_ativo: int
    ds_observacoes: Optional[str]
    
    # Dados relacionados (opcionais)
    anamnese: Optional[AnamneseResponse] = None
    evolucoes: Optional[List[EvolucaoResponse]] = None
    avaliacao: Optional[AvaliacaoResponse] = None

    class Config:
        from_attributes = True


class DocumentoListResponse(BaseModel):
    """Schema simplificado para listagens."""
    id_psicologia_doc: int
    cd_paciente: str
    ds_tipo_doc: str
    dt_criacao: datetime
    dt_atualizacao: Optional[datetime]
    fl_ativo: int

    class Config:
        from_attributes = True


# ============================================================================
# REQUISIÇÕES/RESPOSTAS AGREGADAS
# ============================================================================

class ListDocumentosResponse(BaseModel):
    """Resposta para listagem de documentos."""
    total: int
    documentos: List[DocumentoListResponse]


class CriarAnamnseRequest(BaseModel):
    """Request para criar Anamnese com Documento."""
    cd_paciente: str = Field(..., max_length=20)
    ds_observacoes: Optional[str] = Field(None, max_length=4000)
    # Dados da anamnese
    ds_historia_familiar: Optional[str] = Field(None, max_length=4000)
    ds_historia_pessoal: Optional[str] = Field(None, max_length=4000)
    ds_escolaridade: Optional[str] = Field(None, max_length=500)
    ds_socioeconomico: Optional[str] = Field(None, max_length=500)
    ds_queixa_principal: Optional[str] = Field(None, max_length=4000)
    ds_hipotese_inicial: Optional[str] = Field(None, max_length=4000)


class CriarEvolucaoRequest(BaseModel):
    """Request para criar Evolução."""
    cd_paciente: str = Field(..., max_length=20)
    nr_atendimento: Optional[str] = Field(None, max_length=20)
    ds_data_atendimento: datetime
    ds_observacoes: Optional[str] = Field(None, max_length=4000)
    ds_objetivos_sessao: Optional[str] = Field(None, max_length=2000)
    ds_intervencoes: Optional[str] = Field(None, max_length=4000)
    ds_proximos_passos: Optional[str] = Field(None, max_length=2000)


class CriarAvaliacaoRequest(BaseModel):
    """Request para criar Avaliação."""
    cd_paciente: str = Field(..., max_length=20)
    ds_tipo_teste: Optional[str] = Field(None, max_length=100)
    ds_resultado: Optional[str] = Field(None, max_length=4000)
    nr_escore: Optional[float] = None
    ds_interpretacao: Optional[str] = Field(None, max_length=4000)
    ds_recomendacoes: Optional[str] = Field(None, max_length=4000)
    dt_realizacao: datetime
