# app/api/v1/psicologia.py
from typing import Callable

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.dependencies import (
    get_db,
    pode_acessar_psicologia,
    require_psicologia,
    require_escrita,
)
from app.db.models import User
from app.db.repositories import psicologia as repo
from app.db.repositories.psicologia import ConflitoRevisao
from app.schemas.psicologia import (
    PsiProtocoloOut,
    PsiItemOut,
    PsiAvaliacaoCreate,
    PsiAvaliacaoUpdate,
    PsiAvaliacaoOut,
    PsiRespostaOut,
    PsiResultadoOut,
    PsiAvaliacaoListOut,
)


# ── helpers de serialização ──────────────────────────────────────────────────

def _protocolo_to_out(protocolo) -> PsiProtocoloOut:
    itens = sorted(protocolo.itens, key=lambda i: (i.nr_ordem, i.id_item))
    return PsiProtocoloOut(
        id_protocolo=protocolo.id_protocolo,
        ds_codigo=protocolo.ds_codigo,
        nr_versao=protocolo.nr_versao,
        ds_titulo=protocolo.ds_titulo,
        nr_idade_min=protocolo.nr_idade_min,
        nr_idade_max=protocolo.nr_idade_max,
        ds_faixa_etaria=protocolo.ds_faixa_etaria,
        ds_escala=protocolo.ds_escala,
        ds_situacao=protocolo.ds_situacao,
        itens=[
            PsiItemOut(
                id_item=i.id_item,
                ds_codigo=i.ds_codigo,
                ds_dominio=i.ds_dominio,
                nr_ordem=i.nr_ordem,
                ds_componente=i.ds_componente,
                ds_criterio=i.ds_criterio,
            )
            for i in itens
        ],
    )


def _avaliacao_to_out(db: Session, avaliacao) -> PsiAvaliacaoOut:
    itens = {i.id_item: i for i in repo.get_itens_do_protocolo(db, avaliacao.id_protocolo)}
    respostas = [
        PsiRespostaOut(
            id_item=r.id_item,
            ds_codigo=itens[r.id_item].ds_codigo if r.id_item in itens else None,
            ds_dominio=itens[r.id_item].ds_dominio if r.id_item in itens else None,
            nr_valor=r.nr_valor,
            ds_observacao=r.ds_observacao,
        )
        for r in sorted(avaliacao.respostas, key=lambda r: r.id_item)
    ]
    return PsiAvaliacaoOut(
        id_avaliacao=avaliacao.id_avaliacao,
        cd_paciente=avaliacao.cd_paciente,
        cd_atendimento=avaliacao.cd_atendimento,
        id_usuario=avaliacao.id_usuario,
        cd_prestador=avaliacao.cd_prestador,
        dt_clinica=avaliacao.dt_clinica,
        nr_idade_aplicacao=avaliacao.nr_idade_aplicacao,
        id_protocolo=avaliacao.id_protocolo,
        ds_situacao=avaliacao.ds_situacao,
        ds_observacoes=avaliacao.ds_observacoes,
        ds_evolucao=avaliacao.ds_evolucao,
        ds_conduta=avaliacao.ds_conduta,
        nr_revisao=avaliacao.nr_revisao,
        dt_criacao=avaliacao.dt_criacao,
        respostas=respostas,
        resultados=[
            PsiResultadoOut(
                ds_dominio=r.ds_dominio,
                nr_subtotal=r.nr_subtotal,
                nr_maximo=r.nr_maximo,
            )
            for r in sorted(avaliacao.resultados, key=lambda r: r.ds_dominio)
        ],
    )


def _obter_avaliacao_autorizada(
    db: Session,
    id_avaliacao: int,
    user: User,
    erro_dono: str,
):
    """Garante que a avaliação existe e pertence ao profissional autenticado."""
    avaliacao = repo.get_avaliacao(db, id_avaliacao)
    if not avaliacao:
        raise HTTPException(status_code=404, detail="Avaliação não encontrada.")
    if avaliacao.id_usuario != user.id_usuario:
        raise HTTPException(status_code=403, detail=erro_dono)
    return avaliacao


def _validar_itens_payload(db: Session, id_protocolo: int, respostas: list) -> None:
    """Garante que todos os itens das respostas pertencem à versão do protocolo."""
    itens_validos = {i.id_item for i in repo.get_itens_do_protocolo(db, id_protocolo)}
    for r in respostas:
        if r.id_item not in itens_validos:
            raise HTTPException(
                status_code=422,
                detail=f"Item {r.id_item} não pertence ao protocolo da avaliação.",
            )


def build_modulo_clinico_router(
    *,
    prefix: str,
    tag: str,
    modulo: str,
    check_acesso: Callable[[User], bool],
    require_acesso: Callable,
    erro_acesso: str,
    erro_dono: str,
) -> APIRouter:
    """
    Fábrica de roteadores para módulos clínicos baseados em protocolos estruturados
    (ex.: Psicologia e Psicopedagogia), garantindo isolamento de acesso e catálogo.
    """
    mod_router = APIRouter(prefix=prefix, tags=[tag])

    @mod_router.get("/protocolo", response_model=PsiProtocoloOut)
    def protocolo_ativo(
        db: Session = Depends(get_db),
        user: User = Depends(require_acesso()),
    ):
        protocolo = repo.get_protocolo_ativo(db, modulo=modulo)
        if not protocolo:
            raise HTTPException(status_code=404, detail="Nenhum protocolo ativo.")
        return _protocolo_to_out(protocolo)

    @mod_router.get("/protocolos", response_model=list[PsiProtocoloOut])
    def protocolos_ativos(
        db: Session = Depends(get_db),
        user: User = Depends(require_acesso()),
    ):
        return [_protocolo_to_out(p) for p in repo.list_protocolos_ativos(db, modulo=modulo)]

    @mod_router.get("/protocolo/{id_protocolo}", response_model=PsiProtocoloOut)
    def obter_protocolo(
        id_protocolo: int,
        db: Session = Depends(get_db),
        user: User = Depends(require_acesso()),
    ):
        protocolo = repo.get_protocolo_por_id(db, id_protocolo)
        if not protocolo or not repo.protocolo_pertence_ao_modulo(protocolo, modulo):
            raise HTTPException(status_code=404, detail="Protocolo não encontrado.")
        return _protocolo_to_out(protocolo)

    @mod_router.get("/avaliacoes", response_model=PsiAvaliacaoListOut)
    def listar_avaliacoes(
        db: Session = Depends(get_db),
        user: User = Depends(require_acesso()),
    ):
        avaliacoes = repo.list_avaliacoes_por_usuario(db, user.id_usuario)
        return PsiAvaliacaoListOut(
            total=len(avaliacoes),
            items=[_avaliacao_to_out(db, a) for a in avaliacoes],
        )

    @mod_router.get("/avaliacoes/status-batch")
    def avaliacoes_status_batch(
        cd_pacientes: str = Query(..., description="IDs de pacientes separados por vírgula"),
        db: Session = Depends(get_db),
        user: User = Depends(require_acesso()),
    ):
        ids = [x.strip() for x in cd_pacientes.split(",") if x.strip()]
        if not ids:
            return {}
        return repo.get_avaliacoes_status_batch(db, ids, user.id_usuario)

    @mod_router.post(
        "/avaliacoes",
        response_model=PsiAvaliacaoOut,
        status_code=status.HTTP_201_CREATED,
    )
    def criar_avaliacao(
        payload: PsiAvaliacaoCreate,
        db: Session = Depends(get_db),
        user: User = Depends(require_escrita()),
    ):
        if not check_acesso(user):
            raise HTTPException(status_code=403, detail=erro_acesso)

        protocolo = repo.get_protocolo_por_id(db, payload.id_protocolo)
        if (
            not protocolo
            or protocolo.ds_situacao != "ATIVO"
            or not repo.protocolo_pertence_ao_modulo(protocolo, modulo)
        ):
            raise HTTPException(status_code=404, detail="Protocolo não encontrado ou inativo.")

        if payload.cd_atendimento:
            if not repo.atendimento_pertence_paciente_mv(
                db, payload.cd_paciente, payload.cd_atendimento
            ):
                raise HTTPException(
                    status_code=422,
                    detail="Atendimento inválido ou não pertence ao paciente informado.",
                )

        avaliacao = repo.create_avaliacao(
            db,
            cd_paciente=payload.cd_paciente,
            cd_atendimento=payload.cd_atendimento,
            id_usuario=user.id_usuario,
            cd_prestador=user.prestador.cd_prestador if user.prestador else None,
            dt_clinica=payload.dt_clinica,
            id_protocolo=payload.id_protocolo,
        )
        return _avaliacao_to_out(db, avaliacao)

    @mod_router.get("/avaliacoes/{id_avaliacao}", response_model=PsiAvaliacaoOut)
    def obter_avaliacao(
        id_avaliacao: int,
        db: Session = Depends(get_db),
        user: User = Depends(require_acesso()),
    ):
        avaliacao = _obter_avaliacao_autorizada(db, id_avaliacao, user, erro_dono)
        return _avaliacao_to_out(db, avaliacao)

    @mod_router.put("/avaliacoes/{id_avaliacao}", response_model=PsiAvaliacaoOut)
    def salvar_rascunho(
        id_avaliacao: int,
        payload: PsiAvaliacaoUpdate,
        db: Session = Depends(get_db),
        user: User = Depends(require_escrita()),
    ):
        if not check_acesso(user):
            raise HTTPException(status_code=403, detail=erro_acesso)

        avaliacao = _obter_avaliacao_autorizada(db, id_avaliacao, user, erro_dono)
        _validar_itens_payload(db, avaliacao.id_protocolo, payload.respostas)

        try:
            avaliacao = repo.salvar_rascunho(
                db,
                avaliacao,
                respostas=[r.model_dump() for r in payload.respostas],
                ds_observacoes=payload.ds_observacoes,
                ds_evolucao=payload.ds_evolucao,
                ds_conduta=payload.ds_conduta,
                nr_revisao=payload.nr_revisao,
            )
        except ConflitoRevisao as exc:
            raise HTTPException(status_code=409, detail=str(exc))
        except ValueError as exc:
            raise HTTPException(status_code=409, detail=str(exc))

        return _avaliacao_to_out(db, avaliacao)

    @mod_router.post("/avaliacoes/{id_avaliacao}/finalizar", response_model=PsiAvaliacaoOut)
    def finalizar_avaliacao(
        id_avaliacao: int,
        payload: PsiAvaliacaoUpdate,
        db: Session = Depends(get_db),
        user: User = Depends(require_escrita()),
    ):
        if not check_acesso(user):
            raise HTTPException(status_code=403, detail=erro_acesso)

        avaliacao = _obter_avaliacao_autorizada(db, id_avaliacao, user, erro_dono)
        _validar_itens_payload(db, avaliacao.id_protocolo, payload.respostas)

        try:
            avaliacao = repo.finalizar_avaliacao(
                db,
                avaliacao,
                respostas=[r.model_dump() for r in payload.respostas],
                ds_observacoes=payload.ds_observacoes,
                ds_evolucao=payload.ds_evolucao,
                ds_conduta=payload.ds_conduta,
                nr_revisao=payload.nr_revisao,
            )
        except ConflitoRevisao as exc:
            raise HTTPException(status_code=409, detail=str(exc))
        except ValueError as exc:
            raise HTTPException(status_code=409, detail=str(exc))

        return _avaliacao_to_out(db, avaliacao)

    return mod_router


router = build_modulo_clinico_router(
    prefix="/psicologia",
    tag="Psicologia",
    modulo="PSICOLOGIA",
    check_acesso=pode_acessar_psicologia,
    require_acesso=require_psicologia,
    erro_acesso="Acesso restrito. Este módulo é exclusivo para psicólogos.",
    erro_dono="Somente o psicólogo responsável pode acessar esta avaliação.",
)
