"""
Repository para operações de dados do módulo Psicologia.
"""
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from datetime import datetime
from typing import List, Optional
from app.db.models import (
    PsicologiaDocumento,
    PsicologiaAnamnese,
    PsicologiaEvolucao,
    PsicologiaAvaliacao,
    PsicologiaVersao,
)
from app.schemas.psicologia import (
    DocumentoCreate,
    DocumentoUpdate,
    AnamneseCreate,
    AnamneseUpdate,
    EvolucaoCreate,
    EvolucaoUpdate,
    AvaliacaoCreate,
    AvaliacaoUpdate,
)


# ============================================================================
# OPERAÇÕES COM DOCUMENTOS
# ============================================================================

def criar_documento(
    db: Session,
    cd_paciente: str,
    id_usuario: int,
    ds_tipo_doc: str,
    ds_observacoes: Optional[str] = None,
) -> PsicologiaDocumento:
    """Cria um novo documento psicológico."""
    documento = PsicologiaDocumento(
        cd_paciente=cd_paciente,
        id_usuario=id_usuario,
        ds_tipo_doc=ds_tipo_doc,
        ds_observacoes=ds_observacoes,
        id_usuario_ultima_edicao=id_usuario,
    )
    db.add(documento)
    db.commit()
    db.refresh(documento)
    return documento


def obter_documento(db: Session, id_psicologia_doc: int) -> Optional[PsicologiaDocumento]:
    """Obtém um documento por ID."""
    return db.query(PsicologiaDocumento).filter(
        PsicologiaDocumento.id_psicologia_doc == id_psicologia_doc
    ).first()


def obter_documentos_paciente(
    db: Session,
    cd_paciente: str,
    ds_tipo_doc: Optional[str] = None,
    fl_ativo: int = 1,
) -> List[PsicologiaDocumento]:
    """Obtém todos os documentos de um paciente."""
    query = db.query(PsicologiaDocumento).filter(
        and_(
            PsicologiaDocumento.cd_paciente == cd_paciente,
            PsicologiaDocumento.fl_ativo == fl_ativo,
        )
    )
    
    if ds_tipo_doc:
        query = query.filter(PsicologiaDocumento.ds_tipo_doc == ds_tipo_doc)
    
    return query.order_by(desc(PsicologiaDocumento.dt_criacao)).all()


def obter_documento_tipo_recente(
    db: Session,
    cd_paciente: str,
    ds_tipo_doc: str,
) -> Optional[PsicologiaDocumento]:
    """Obtém o documento mais recente de um tipo específico."""
    return db.query(PsicologiaDocumento).filter(
        and_(
            PsicologiaDocumento.cd_paciente == cd_paciente,
            PsicologiaDocumento.ds_tipo_doc == ds_tipo_doc,
            PsicologiaDocumento.fl_ativo == 1,
        )
    ).order_by(desc(PsicologiaDocumento.dt_criacao)).first()


def atualizar_documento(
    db: Session,
    id_psicologia_doc: int,
    id_usuario: int,
    **kwargs
) -> Optional[PsicologiaDocumento]:
    """Atualiza um documento."""
    documento = obter_documento(db, id_psicologia_doc)
    if not documento:
        return None
    
    kwargs['id_usuario_ultima_edicao'] = id_usuario
    kwargs['dt_atualizacao'] = datetime.utcnow()
    
    for key, value in kwargs.items():
        if value is not None:
            setattr(documento, key, value)
    
    db.commit()
    db.refresh(documento)
    return documento


def desativar_documento(db: Session, id_psicologia_doc: int) -> Optional[PsicologiaDocumento]:
    """Desativa um documento (soft delete)."""
    return atualizar_documento(db, id_psicologia_doc, fl_ativo=0)


# ============================================================================
# OPERAÇÕES COM ANAMNESE
# ============================================================================

def criar_anamnese(
    db: Session,
    id_psicologia_doc: int,
    schema: AnamneseCreate,
) -> PsicologiaAnamnese:
    """Cria uma anamnese ligada a um documento."""
    anamnese = PsicologiaAnamnese(
        id_psicologia_doc=id_psicologia_doc,
        ds_historia_familiar=schema.ds_historia_familiar,
        ds_historia_pessoal=schema.ds_historia_pessoal,
        ds_escolaridade=schema.ds_escolaridade,
        ds_socioeconomico=schema.ds_socioeconomico,
        ds_queixa_principal=schema.ds_queixa_principal,
        ds_hipotese_inicial=schema.ds_hipotese_inicial,
    )
    db.add(anamnese)
    db.commit()
    db.refresh(anamnese)
    return anamnese


def obter_anamnese(db: Session, id_anamnese: int) -> Optional[PsicologiaAnamnese]:
    """Obtém uma anamnese por ID."""
    return db.query(PsicologiaAnamnese).filter(
        PsicologiaAnamnese.id_anamnese == id_anamnese
    ).first()


def obter_anamnese_por_documento(
    db: Session,
    id_psicologia_doc: int,
) -> Optional[PsicologiaAnamnese]:
    """Obtém a anamnese de um documento."""
    return db.query(PsicologiaAnamnese).filter(
        PsicologiaAnamnese.id_psicologia_doc == id_psicologia_doc
    ).first()


def atualizar_anamnese(
    db: Session,
    id_anamnese: int,
    schema: AnamneseUpdate,
) -> Optional[PsicologiaAnamnese]:
    """Atualiza uma anamnese."""
    anamnese = obter_anamnese(db, id_anamnese)
    if not anamnese:
        return None
    
    anamnese.ds_historia_familiar = schema.ds_historia_familiar
    anamnese.ds_historia_pessoal = schema.ds_historia_pessoal
    anamnese.ds_escolaridade = schema.ds_escolaridade
    anamnese.ds_socioeconomico = schema.ds_socioeconomico
    anamnese.ds_queixa_principal = schema.ds_queixa_principal
    anamnese.ds_hipotese_inicial = schema.ds_hipotese_inicial
    anamnese.dt_atualizacao = datetime.utcnow()
    
    db.commit()
    db.refresh(anamnese)
    return anamnese


# ============================================================================
# OPERAÇÕES COM EVOLUÇÃO
# ============================================================================

def criar_evolucao(
    db: Session,
    id_psicologia_doc: int,
    id_usuario: int,
    schema: EvolucaoCreate,
) -> PsicologiaEvolucao:
    """Cria uma evolução ligada a um documento."""
    evolucao = PsicologiaEvolucao(
        id_psicologia_doc=id_psicologia_doc,
        nr_atendimento=schema.nr_atendimento,
        ds_data_atendimento=schema.ds_data_atendimento,
        ds_observacoes=schema.ds_observacoes,
        ds_objetivos_sessao=schema.ds_objetivos_sessao,
        ds_intervencoes=schema.ds_intervencoes,
        ds_proximos_passos=schema.ds_proximos_passos,
        id_usuario_criou=id_usuario,
    )
    db.add(evolucao)
    db.commit()
    db.refresh(evolucao)
    return evolucao


def obter_evolucao(db: Session, id_evolucao: int) -> Optional[PsicologiaEvolucao]:
    """Obtém uma evolução por ID."""
    return db.query(PsicologiaEvolucao).filter(
        PsicologiaEvolucao.id_evolucao == id_evolucao
    ).first()


def obter_evolucoes_documento(
    db: Session,
    id_psicologia_doc: int,
) -> List[PsicologiaEvolucao]:
    """Obtém todas as evoluções de um documento (ordenadas por data)."""
    return db.query(PsicologiaEvolucao).filter(
        PsicologiaEvolucao.id_psicologia_doc == id_psicologia_doc
    ).order_by(desc(PsicologiaEvolucao.ds_data_atendimento)).all()


def atualizar_evolucao(
    db: Session,
    id_evolucao: int,
    schema: EvolucaoUpdate,
) -> Optional[PsicologiaEvolucao]:
    """Atualiza uma evolução."""
    evolucao = obter_evolucao(db, id_evolucao)
    if not evolucao:
        return None
    
    evolucao.ds_observacoes = schema.ds_observacoes
    evolucao.ds_objetivos_sessao = schema.ds_objetivos_sessao
    evolucao.ds_intervencoes = schema.ds_intervencoes
    evolucao.ds_proximos_passos = schema.ds_proximos_passos
    evolucao.dt_atualizacao = datetime.utcnow()
    
    db.commit()
    db.refresh(evolucao)
    return evolucao


def deletar_evolucao(db: Session, id_evolucao: int) -> bool:
    """Deleta uma evolução."""
    evolucao = obter_evolucao(db, id_evolucao)
    if not evolucao:
        return False
    
    db.delete(evolucao)
    db.commit()
    return True


# ============================================================================
# OPERAÇÕES COM AVALIAÇÃO
# ============================================================================

def criar_avaliacao(
    db: Session,
    id_psicologia_doc: int,
    id_usuario: int,
    schema: AvaliacaoCreate,
) -> PsicologiaAvaliacao:
    """Cria uma avaliação ligada a um documento."""
    avaliacao = PsicologiaAvaliacao(
        id_psicologia_doc=id_psicologia_doc,
        ds_tipo_teste=schema.ds_tipo_teste,
        ds_resultado=schema.ds_resultado,
        nr_escore=schema.nr_escore,
        ds_interpretacao=schema.ds_interpretacao,
        ds_recomendacoes=schema.ds_recomendacoes,
        id_usuario_fez=id_usuario,
        dt_realizacao=schema.dt_realizacao,
    )
    db.add(avaliacao)
    db.commit()
    db.refresh(avaliacao)
    return avaliacao


def obter_avaliacao(db: Session, id_avaliacao: int) -> Optional[PsicologiaAvaliacao]:
    """Obtém uma avaliação por ID."""
    return db.query(PsicologiaAvaliacao).filter(
        PsicologiaAvaliacao.id_avaliacao == id_avaliacao
    ).first()


def obter_avaliacao_por_documento(
    db: Session,
    id_psicologia_doc: int,
) -> Optional[PsicologiaAvaliacao]:
    """Obtém a avaliação de um documento."""
    return db.query(PsicologiaAvaliacao).filter(
        PsicologiaAvaliacao.id_psicologia_doc == id_psicologia_doc
    ).first()


def atualizar_avaliacao(
    db: Session,
    id_avaliacao: int,
    schema: AvaliacaoUpdate,
) -> Optional[PsicologiaAvaliacao]:
    """Atualiza uma avaliação."""
    avaliacao = obter_avaliacao(db, id_avaliacao)
    if not avaliacao:
        return None
    
    avaliacao.ds_resultado = schema.ds_resultado
    avaliacao.nr_escore = schema.nr_escore
    avaliacao.ds_interpretacao = schema.ds_interpretacao
    avaliacao.ds_recomendacoes = schema.ds_recomendacoes
    avaliacao.dt_atualizacao = datetime.utcnow()
    
    db.commit()
    db.refresh(avaliacao)
    return avaliacao


def finalizar_avaliacao(
    db: Session,
    id_avaliacao: int,
) -> Optional[PsicologiaAvaliacao]:
    """Marca uma avaliação como finalizada."""
    avaliacao = obter_avaliacao(db, id_avaliacao)
    if not avaliacao:
        return None
    
    avaliacao.ds_status = "FINALIZADO"
    avaliacao.dt_atualizacao = datetime.utcnow()
    
    db.commit()
    db.refresh(avaliacao)
    return avaliacao


def assinar_avaliacao(
    db: Session,
    id_avaliacao: int,
) -> Optional[PsicologiaAvaliacao]:
    """Marca uma avaliação como assinada."""
    avaliacao = obter_avaliacao(db, id_avaliacao)
    if not avaliacao:
        return None
    
    avaliacao.ds_status = "ASSINADO"
    avaliacao.dt_atualizacao = datetime.utcnow()
    
    db.commit()
    db.refresh(avaliacao)
    return avaliacao


# ============================================================================
# OPERAÇÕES COM VERSÕES (AUDITORIA)
# ============================================================================

def registrar_versao(
    db: Session,
    id_psicologia_doc: int,
    id_usuario: int,
    ds_campo_alterado: str,
    ds_conteudo_anterior: Optional[str] = None,
    ds_motivo_alteracao: Optional[str] = None,
) -> PsicologiaVersao:
    """Registra uma versão/mudança para auditoria."""
    # Obtém o número de versão anterior
    ultima_versao = db.query(PsicologiaVersao).filter(
        PsicologiaVersao.id_psicologia_doc == id_psicologia_doc
    ).order_by(desc(PsicologiaVersao.nr_versao)).first()
    
    nr_versao = (ultima_versao.nr_versao + 1) if ultima_versao else 1
    
    versao = PsicologiaVersao(
        id_psicologia_doc=id_psicologia_doc,
        nr_versao=nr_versao,
        ds_conteudo_anterior=ds_conteudo_anterior,
        id_usuario_editou=id_usuario,
        ds_motivo_alteracao=ds_motivo_alteracao,
        ds_campo_alterado=ds_campo_alterado,
    )
    db.add(versao)
    db.commit()
    db.refresh(versao)
    return versao


def obter_versoes_documento(
    db: Session,
    id_psicologia_doc: int,
) -> List[PsicologiaVersao]:
    """Obtém o histórico de versões de um documento."""
    return db.query(PsicologiaVersao).filter(
        PsicologiaVersao.id_psicologia_doc == id_psicologia_doc
    ).order_by(desc(PsicologiaVersao.dt_edicao)).all()
