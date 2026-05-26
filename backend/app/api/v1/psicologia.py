"""
Rotas da API para o módulo Psicologia.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List

from app.dependencies import get_db, get_current_user
from app.db.models import User
from app.schemas.psicologia import (
    DocumentoCreate,
    DocumentoUpdate,
    DocumentoResponse,
    DocumentoListResponse,
    AnamneseCreate,
    AnamneseUpdate,
    AnamneseResponse,
    EvolucaoCreate,
    EvolucaoUpdate,
    EvolucaoResponse,
    AvaliacaoCreate,
    AvaliacaoUpdate,
    AvaliacaoResponse,
    VersaoResponse,
    ListDocumentosResponse,
    CriarAnamnseRequest,
    CriarEvolucaoRequest,
    CriarAvaliacaoRequest,
)
from app.db.repositories import psicologia as repo_psicologia

router = APIRouter(prefix="/api/v1/psicologia", tags=["psicologia"])


# ============================================================================
# DOCUMENTOS
# ============================================================================

@router.get("/documentos/{cd_paciente}", response_model=ListDocumentosResponse)
def listar_documentos_paciente(
    cd_paciente: str,
    ds_tipo_doc: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista todos os documentos de um paciente."""
    documentos = repo_psicologia.obter_documentos_paciente(
        db,
        cd_paciente=cd_paciente,
        ds_tipo_doc=ds_tipo_doc,
    )
    return {
        "total": len(documentos),
        "documentos": [DocumentoListResponse.from_orm(doc) for doc in documentos],
    }


@router.get("/documento/{id_psicologia_doc}", response_model=DocumentoResponse)
def obter_documento(
    id_psicologia_doc: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtém um documento específico com todos os dados."""
    documento = repo_psicologia.obter_documento(db, id_psicologia_doc)
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento não encontrado",
        )
    return DocumentoResponse.from_orm(documento)


@router.post("/documentos", response_model=DocumentoResponse, status_code=status.HTTP_201_CREATED)
def criar_documento(
    payload: DocumentoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cria um novo documento psicológico."""
    documento = repo_psicologia.criar_documento(
        db,
        cd_paciente=payload.cd_paciente,
        id_usuario=current_user.id_usuario,
        ds_tipo_doc=payload.ds_tipo_doc,
        ds_observacoes=payload.ds_observacoes,
    )
    return DocumentoResponse.from_orm(documento)


@router.patch("/documento/{id_psicologia_doc}", response_model=DocumentoResponse)
def atualizar_documento(
    id_psicologia_doc: int,
    payload: DocumentoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atualiza um documento existente."""
    documento = repo_psicologia.obter_documento(db, id_psicologia_doc)
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento não encontrado",
        )
    
    # Registra a versão anterior
    if payload.ds_observacoes != documento.ds_observacoes:
        repo_psicologia.registrar_versao(
            db,
            id_psicologia_doc=id_psicologia_doc,
            id_usuario=current_user.id_usuario,
            ds_campo_alterado="DS_OBSERVACOES",
            ds_conteudo_anterior=documento.ds_observacoes,
        )
    
    documento_atualizado = repo_psicologia.atualizar_documento(
        db,
        id_psicologia_doc=id_psicologia_doc,
        id_usuario=current_user.id_usuario,
        ds_observacoes=payload.ds_observacoes,
    )
    return DocumentoResponse.from_orm(documento_atualizado)


@router.delete("/documento/{id_psicologia_doc}", status_code=status.HTTP_204_NO_CONTENT)
def desativar_documento(
    id_psicologia_doc: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Desativa (soft delete) um documento."""
    documento = repo_psicologia.obter_documento(db, id_psicologia_doc)
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento não encontrado",
        )
    
    repo_psicologia.desativar_documento(db, id_psicologia_doc)


# ============================================================================
# ANAMNESE
# ============================================================================

@router.post(
    "/documento/{id_psicologia_doc}/anamnese",
    response_model=AnamneseResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_anamnese(
    id_psicologia_doc: int,
    payload: AnamneseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cria uma anamnese para um documento."""
    # Verifica se o documento existe
    documento = repo_psicologia.obter_documento(db, id_psicologia_doc)
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento não encontrado",
        )
    
    # Verifica se já existe anamnese
    anamnese_existente = repo_psicologia.obter_anamnese_por_documento(db, id_psicologia_doc)
    if anamnese_existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma anamnese para este documento",
        )
    
    anamnese = repo_psicologia.criar_anamnese(db, id_psicologia_doc, payload)
    
    # Registra a versão
    repo_psicologia.registrar_versao(
        db,
        id_psicologia_doc=id_psicologia_doc,
        id_usuario=current_user.id_usuario,
        ds_campo_alterado="ANAMNESE_CRIADA",
    )
    
    return AnamneseResponse.from_orm(anamnese)


@router.get("/documento/{id_psicologia_doc}/anamnese", response_model=AnamneseResponse)
def obter_anamnese(
    id_psicologia_doc: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtém a anamnese de um documento."""
    anamnese = repo_psicologia.obter_anamnese_por_documento(db, id_psicologia_doc)
    if not anamnese:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anamnese não encontrada",
        )
    return AnamneseResponse.from_orm(anamnese)


@router.patch("/anamnese/{id_anamnese}", response_model=AnamneseResponse)
def atualizar_anamnese(
    id_anamnese: int,
    payload: AnamneseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atualiza uma anamnese."""
    anamnese = repo_psicologia.obter_anamnese(db, id_anamnese)
    if not anamnese:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Anamnese não encontrada",
        )
    
    # Registra a versão
    repo_psicologia.registrar_versao(
        db,
        id_psicologia_doc=anamnese.id_psicologia_doc,
        id_usuario=current_user.id_usuario,
        ds_campo_alterado="ANAMNESE",
    )
    
    anamnese_atualizada = repo_psicologia.atualizar_anamnese(db, id_anamnese, payload)
    return AnamneseResponse.from_orm(anamnese_atualizada)


# ============================================================================
# EVOLUÇÃO
# ============================================================================

@router.post(
    "/documento/{id_psicologia_doc}/evolucao",
    response_model=EvolucaoResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_evolucao(
    id_psicologia_doc: int,
    payload: EvolucaoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cria uma evolução para um documento."""
    documento = repo_psicologia.obter_documento(db, id_psicologia_doc)
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento não encontrado",
        )
    
    evolucao = repo_psicologia.criar_evolucao(
        db,
        id_psicologia_doc=id_psicologia_doc,
        id_usuario=current_user.id_usuario,
        schema=payload,
    )
    
    # Registra a versão
    repo_psicologia.registrar_versao(
        db,
        id_psicologia_doc=id_psicologia_doc,
        id_usuario=current_user.id_usuario,
        ds_campo_alterado="EVOLUCAO_CRIADA",
    )
    
    return EvolucaoResponse.from_orm(evolucao)


@router.get("/documento/{id_psicologia_doc}/evolucoes", response_model=List[EvolucaoResponse])
def listar_evolucoes(
    id_psicologia_doc: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lista todas as evoluções de um documento."""
    documento = repo_psicologia.obter_documento(db, id_psicologia_doc)
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento não encontrado",
        )
    
    evolucoes = repo_psicologia.obter_evolucoes_documento(db, id_psicologia_doc)
    return [EvolucaoResponse.from_orm(e) for e in evolucoes]


@router.patch("/evolucao/{id_evolucao}", response_model=EvolucaoResponse)
def atualizar_evolucao(
    id_evolucao: int,
    payload: EvolucaoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atualiza uma evolução."""
    evolucao = repo_psicologia.obter_evolucao(db, id_evolucao)
    if not evolucao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evolução não encontrada",
        )
    
    # Registra a versão
    repo_psicologia.registrar_versao(
        db,
        id_psicologia_doc=evolucao.id_psicologia_doc,
        id_usuario=current_user.id_usuario,
        ds_campo_alterado="EVOLUCAO",
    )
    
    evolucao_atualizada = repo_psicologia.atualizar_evolucao(db, id_evolucao, payload)
    return EvolucaoResponse.from_orm(evolucao_atualizada)


@router.delete("/evolucao/{id_evolucao}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_evolucao(
    id_evolucao: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deleta uma evolução."""
    sucesso = repo_psicologia.deletar_evolucao(db, id_evolucao)
    if not sucesso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evolução não encontrada",
        )


# ============================================================================
# AVALIAÇÃO
# ============================================================================

@router.post(
    "/documento/{id_psicologia_doc}/avaliacao",
    response_model=AvaliacaoResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_avaliacao(
    id_psicologia_doc: int,
    payload: AvaliacaoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Cria uma avaliação para um documento."""
    documento = repo_psicologia.obter_documento(db, id_psicologia_doc)
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento não encontrado",
        )
    
    # Verifica se já existe avaliação
    avaliacao_existente = repo_psicologia.obter_avaliacao_por_documento(db, id_psicologia_doc)
    if avaliacao_existente:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma avaliação para este documento",
        )
    
    avaliacao = repo_psicologia.criar_avaliacao(
        db,
        id_psicologia_doc=id_psicologia_doc,
        id_usuario=current_user.id_usuario,
        schema=payload,
    )
    
    # Registra a versão
    repo_psicologia.registrar_versao(
        db,
        id_psicologia_doc=id_psicologia_doc,
        id_usuario=current_user.id_usuario,
        ds_campo_alterado="AVALIACAO_CRIADA",
    )
    
    return AvaliacaoResponse.from_orm(avaliacao)


@router.get("/documento/{id_psicologia_doc}/avaliacao", response_model=AvaliacaoResponse)
def obter_avaliacao(
    id_psicologia_doc: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtém a avaliação de um documento."""
    avaliacao = repo_psicologia.obter_avaliacao_por_documento(db, id_psicologia_doc)
    if not avaliacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avaliação não encontrada",
        )
    return AvaliacaoResponse.from_orm(avaliacao)


@router.patch("/avaliacao/{id_avaliacao}", response_model=AvaliacaoResponse)
def atualizar_avaliacao(
    id_avaliacao: int,
    payload: AvaliacaoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Atualiza uma avaliação."""
    avaliacao = repo_psicologia.obter_avaliacao(db, id_avaliacao)
    if not avaliacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avaliação não encontrada",
        )
    
    # Registra a versão
    repo_psicologia.registrar_versao(
        db,
        id_psicologia_doc=avaliacao.id_psicologia_doc,
        id_usuario=current_user.id_usuario,
        ds_campo_alterado="AVALIACAO",
    )
    
    avaliacao_atualizada = repo_psicologia.atualizar_avaliacao(db, id_avaliacao, payload)
    return AvaliacaoResponse.from_orm(avaliacao_atualizada)


@router.post("/avaliacao/{id_avaliacao}/finalizar", response_model=AvaliacaoResponse)
def finalizar_avaliacao(
    id_avaliacao: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Marca uma avaliação como finalizada."""
    avaliacao = repo_psicologia.obter_avaliacao(db, id_avaliacao)
    if not avaliacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avaliação não encontrada",
        )
    
    avaliacao_finalizada = repo_psicologia.finalizar_avaliacao(db, id_avaliacao)
    return AvaliacaoResponse.from_orm(avaliacao_finalizada)


@router.post("/avaliacao/{id_avaliacao}/assinar", response_model=AvaliacaoResponse)
def assinar_avaliacao(
    id_avaliacao: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Marca uma avaliação como assinada."""
    avaliacao = repo_psicologia.assinar_avaliacao(db, id_avaliacao)
    if not avaliacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Avaliação não encontrada",
        )
    
    return AvaliacaoResponse.from_orm(avaliacao)


# ============================================================================
# VERSÕES (AUDITORIA)
# ============================================================================

@router.get("/documento/{id_psicologia_doc}/versoes", response_model=List[VersaoResponse])
def obter_historico_versoes(
    id_psicologia_doc: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Obtém o histórico de versões/edições de um documento."""
    documento = repo_psicologia.obter_documento(db, id_psicologia_doc)
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento não encontrado",
        )
    
    versoes = repo_psicologia.obter_versoes_documento(db, id_psicologia_doc)
    return [VersaoResponse.from_orm(v) for v in versoes]
