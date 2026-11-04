# app/db/repositories/psicologia.py
from datetime import datetime
from typing import Optional, Sequence

from sqlalchemy.orm import Session, joinedload

from app.db.models import (
    PsiProtocolo,
    PsiItem,
    PsiAvaliacao,
    PsiResposta,
    PsiEvento,
)


class ConflitoRevisao(Exception):
    """Levantada quando há conflito de controle otimista ao salvar."""


# ── Catálogo / protocolo ─────────────────────────────────────────────────────

def get_protocolo_ativo(db: Session) -> Optional[PsiProtocolo]:
    return (
        db.query(PsiProtocolo)
        .options(joinedload(PsiProtocolo.itens))
        .filter(PsiProtocolo.ds_situacao == "ATIVO")
        .order_by(PsiProtocolo.dt_vigencia.desc(), PsiProtocolo.id_protocolo.desc())
        .first()
    )


def get_protocolo_por_id(db: Session, id_protocolo: int) -> Optional[PsiProtocolo]:
    return (
        db.query(PsiProtocolo)
        .options(joinedload(PsiProtocolo.itens))
        .filter(PsiProtocolo.id_protocolo == id_protocolo)
        .first()
    )


def get_itens_do_protocolo(db: Session, id_protocolo: int) -> Sequence[PsiItem]:
    return (
        db.query(PsiItem)
        .filter(PsiItem.id_protocolo == id_protocolo)
        .order_by(PsiItem.nr_ordem, PsiItem.id_item)
        .all()
    )


# ── Avaliações ───────────────────────────────────────────────────────────────

def create_avaliacao(
    db: Session,
    *,
    cd_paciente: str,
    id_usuario: int,
    id_protocolo: int,
    dt_clinica: datetime,
    cd_atendimento: Optional[str] = None,
    cd_prestador: Optional[int] = None,
    nr_idade_aplicacao: Optional[int] = None,
) -> PsiAvaliacao:
    avaliacao = PsiAvaliacao(
        cd_paciente=cd_paciente,
        cd_atendimento=cd_atendimento,
        id_usuario=id_usuario,
        cd_prestador=cd_prestador,
        dt_clinica=dt_clinica,
        nr_idade_aplicacao=nr_idade_aplicacao,
        id_protocolo=id_protocolo,
        ds_situacao="RASCUNHO",
        nr_revisao=0,
    )
    db.add(avaliacao)
    db.flush()
    registrar_evento(db, avaliacao.id_avaliacao, id_usuario, "CRIACAO")
    db.commit()
    db.refresh(avaliacao)
    return avaliacao


def get_avaliacao(db: Session, id_avaliacao: int) -> Optional[PsiAvaliacao]:
    return (
        db.query(PsiAvaliacao)
        .options(joinedload(PsiAvaliacao.respostas))
        .filter(PsiAvaliacao.id_avaliacao == id_avaliacao)
        .first()
    )


def list_avaliacoes_por_usuario(db: Session, id_usuario: int) -> list[PsiAvaliacao]:
    return (
        db.query(PsiAvaliacao)
        .options(joinedload(PsiAvaliacao.respostas))
        .filter(PsiAvaliacao.id_usuario == id_usuario)
        .order_by(PsiAvaliacao.dt_clinica.desc(), PsiAvaliacao.id_avaliacao.desc())
        .all()
    )


def get_avaliacoes_status_batch(
    db: Session,
    cd_pacientes: list[str],
    id_usuario: int,
) -> dict:
    """
    Retorna a avaliação mais recente do psicólogo autenticado para cada paciente
    informado. Usado pela tela de agenda para decidir entre Iniciar/Continuar/Ver.
    """
    rows = (
        db.query(PsiAvaliacao)
        .filter(
            PsiAvaliacao.cd_paciente.in_(cd_pacientes),
            PsiAvaliacao.id_usuario == id_usuario,
        )
        .order_by(PsiAvaliacao.dt_criacao.desc(), PsiAvaliacao.id_avaliacao.desc())
        .all()
    )
    resultado = {cd: {"avaliacao": None} for cd in cd_pacientes}
    for r in rows:
        if resultado[r.cd_paciente]["avaliacao"] is None:
            resultado[r.cd_paciente]["avaliacao"] = {
                "id_avaliacao": r.id_avaliacao,
                "ds_situacao": r.ds_situacao,
            }
    return resultado


def salvar_rascunho(
    db: Session,
    avaliacao: PsiAvaliacao,
    *,
    respostas: list,
    ds_observacoes: Optional[str],
    ds_evolucao: Optional[str],
    ds_conduta: Optional[str],
    nr_revisao: int,
) -> PsiAvaliacao:
    if avaliacao.ds_situacao != "RASCUNHO":
        raise ValueError("Apenas avaliações em rascunho podem ser editadas.")

    if avaliacao.nr_revisao != nr_revisao:
        raise ConflitoRevisao(
            "A avaliação foi alterada em outra sessão. Recarregue os dados antes de salvar."
        )

    # Substitui as respostas do rascunho
    db.query(PsiResposta).filter(PsiResposta.id_avaliacao == avaliacao.id_avaliacao).delete()
    for r in respostas:
        db.add(
            PsiResposta(
                id_avaliacao=avaliacao.id_avaliacao,
                id_item=r["id_item"],
                nr_valor=r["nr_valor"],
                ds_observacao=r.get("ds_observacao"),
            )
        )

    avaliacao.ds_observacoes = ds_observacoes
    avaliacao.ds_evolucao = ds_evolucao
    avaliacao.ds_conduta = ds_conduta
    avaliacao.nr_revisao = avaliacao.nr_revisao + 1
    avaliacao.dt_atualizacao = datetime.now()

    registrar_evento(db, avaliacao.id_avaliacao, avaliacao.id_usuario, "ALTERACAO")
    db.commit()
    db.refresh(avaliacao)
    return avaliacao


# ── Vínculo assistencial (MV) ────────────────────────────────────────────────

def atendimento_pertence_paciente_mv(
    db: Session,
    cd_paciente: str,
    cd_atendimento: str,
) -> bool:
    """
    Valida no servidor se o atendimento existe no MV e pertence ao paciente
    informado. A validação não é feita apenas pela interface.
    """
    from sqlalchemy.sql import text

    row = db.execute(
        text("""
            SELECT 1
            FROM dbamv.ATENDIME a
            WHERE a.CD_ATENDIMENTO = TO_NUMBER(:cd_atendimento)
              AND a.CD_PACIENTE    = TO_NUMBER(:cd_paciente)
              AND ROWNUM = 1
        """),
        {"cd_atendimento": cd_atendimento, "cd_paciente": cd_paciente},
    ).first()
    return row is not None


# ── Eventos / auditoria ──────────────────────────────────────────────────────

def registrar_evento(
    db: Session,
    id_avaliacao: int,
    id_usuario: int,
    ds_acao: str,
    ds_motivo: Optional[str] = None,
) -> None:
    db.add(
        PsiEvento(
            id_avaliacao=id_avaliacao,
            id_usuario=id_usuario,
            ds_acao=ds_acao,
            ds_motivo=ds_motivo,
        )
    )
    db.flush()
