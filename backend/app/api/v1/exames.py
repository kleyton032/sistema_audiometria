# app/api/v1/exames.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import io
from datetime import datetime
from typing import Any

from app.dependencies import get_db, get_current_user
from app.db.models import User
from app.db.repositories import exame as repo
from app.schemas.exame import (
    ExameAudiometriaCreate,
    ExameImitanciometriaCreate,
    ExameResponse,
    LaudoResponse,
)
from app.pdf.audiometria import gerar_pdf_audiometria
from app.pdf.imitanciometria import gerar_pdf_imitanciometria

router = APIRouter(prefix="/exames", tags=["Exames"])


@router.get("/dashboard/stats")
def dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return repo.get_dashboard_stats(db)


@router.post("/status-atendimentos", response_model=dict[str, Any])
def status_por_atendimentos(
    body: dict[str, list[int]],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Recebe {cd_atendimentos: [1,2,3]} e retorna status de exame por atendimento."""
    ids = body.get("cd_atendimentos", [])
    result = repo.get_status_por_atendimentos(db, ids)
    # converte chaves para string (JSON só aceita string como key)
    return {str(k): v for k, v in result.items()}


@router.post(
    "/audiometria",
    response_model=ExameResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_exame(
    payload: ExameAudiometriaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exame = repo.criar_exame_audiometria(db, payload, current_user.id_usuario)
    return exame


@router.put("/audiometria/{id_exame}", response_model=ExameResponse)
def atualizar_exame(
    id_exame: int,
    payload: ExameAudiometriaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exame = repo.get_exame_por_id(db, id_exame)
    if not exame:
        raise HTTPException(status_code=404, detail="Exame não encontrado.")
    if exame.ds_status == "FINALIZADO":
        raise HTTPException(
            status_code=400,
            detail="Exame finalizado não pode ser alterado.",
        )
    return repo.atualizar_exame_audiometria(db, exame, payload)


@router.get("/por-atendimento/{cd_atendimento}", response_model=ExameResponse | None)
def buscar_por_atendimento(
    cd_atendimento: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return repo.get_exame_por_atendimento(db, cd_atendimento)


@router.get("/{id_exame}", response_model=ExameResponse)
def buscar_exame(
    id_exame: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exame = repo.get_exame_por_id(db, id_exame)
    if not exame:
        raise HTTPException(status_code=404, detail="Exame não encontrado.")
    return exame


@router.post("/{id_exame}/finalizar", response_model=ExameResponse)
def finalizar_exame(
    id_exame: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exame = repo.get_exame_por_id(db, id_exame)
    if not exame:
        raise HTTPException(status_code=404, detail="Exame não encontrado.")
    if exame.ds_status == "FINALIZADO":
        raise HTTPException(status_code=400, detail="Exame já está finalizado.")
    return repo.finalizar_exame(db, exame)


@router.post("/{id_exame}/laudo")
def gerar_laudo(
    id_exame: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exame = repo.get_exame_por_id(db, id_exame)
    if not exame:
        raise HTTPException(status_code=404, detail="Exame não encontrado.")

    nm_usuario = current_user.nm_usuario
    nr_conselho = current_user.nr_conselho or ""

    if exame.ds_tipo == "AUDIOMETRIA":
        if not exame.resultado_audio:
            raise HTTPException(status_code=400, detail="Exame não possui resultado registrado.")
        pdf_bytes = gerar_pdf_audiometria(exame, nm_usuario, nr_conselho)
        nm_arquivo = f"laudo_audio_{exame.id_exame}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"

    elif exame.ds_tipo == "IMITANCIOMETRIA":
        if not exame.resultado_imitan:
            raise HTTPException(status_code=400, detail="Exame não possui resultado registrado.")
        pdf_bytes = gerar_pdf_imitanciometria(exame, nm_usuario, nr_conselho)
        nm_arquivo = f"laudo_imitan_{exame.id_exame}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"

    else:
        raise HTTPException(status_code=400, detail=f"Tipo de exame não suportado: {exame.ds_tipo}")

    repo.salvar_laudo(db, exame.id_exame, current_user.id_usuario, pdf_bytes, nm_arquivo)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{nm_arquivo}"'},
    )


# ── Imitanciometria ───────────────────────────────────────────────────────────

@router.post(
    "/imitanciometria",
    response_model=ExameResponse,
    status_code=status.HTTP_201_CREATED,
)
def criar_exame_imitanciometria(
    payload: ExameImitanciometriaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return repo.criar_exame_imitanciometria(db, payload, current_user.id_usuario)


@router.put("/imitanciometria/{id_exame}", response_model=ExameResponse)
def atualizar_exame_imitanciometria(
    id_exame: int,
    payload: ExameImitanciometriaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    exame = repo.get_exame_por_id(db, id_exame)
    if not exame:
        raise HTTPException(status_code=404, detail="Exame não encontrado.")
    if exame.ds_status == "FINALIZADO":
        raise HTTPException(status_code=400, detail="Exame finalizado não pode ser alterado.")
    return repo.atualizar_exame_imitanciometria(db, exame, payload)


@router.get("/imitanciometria/por-atendimento/{cd_atendimento}", response_model=ExameResponse | None)
def buscar_imitan_por_atendimento(
    cd_atendimento: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return repo.get_exame_imitan_por_atendimento(db, cd_atendimento)
