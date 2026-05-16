# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.schemas.user import UserResponse
from app.db.repositories.user import get_by_id
from app.dependencies import get_db, get_current_user
from app.db.models import User

router = APIRouter(prefix="/users", tags=["Usuários"])


def _user_to_response(user: User) -> UserResponse:
    """Converte modelo User + relacionamento prestador para UserResponse."""
    p = user.prestador
    return UserResponse(
        id_usuario         = user.id_usuario,
        cd_usuario_mv      = user.cd_usuario_mv,
        nm_login           = user.nm_login,
        nm_usuario         = user.nm_usuario,
        ds_email           = user.ds_email,
        ds_perfil          = user.ds_perfil,
        dt_criacao         = user.dt_criacao,
        fl_ativo           = user.fl_ativo,
        cd_prestador       = p.cd_prestador       if p else None,
        ds_conselho        = p.ds_conselho        if p else None,
        ds_codigo_conselho = p.ds_codigo_conselho if p else None,
        nm_tip_presta      = p.nm_tip_presta      if p else None,
        nr_conselho        = user.nr_conselho,
        ds_especialidade   = user.ds_especialidade,
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Dados do usuário autenticado",
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    """Retorna os dados do usuário logado (extraídos do JWT)."""
    return _user_to_response(current_user)


@router.get(
    "/{id_usuario}",
    response_model=UserResponse,
    summary="Buscar usuário por ID",
)
def get_user(
    id_usuario: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    user = get_by_id(db, id_usuario)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return _user_to_response(user)


@router.get(
    "/debug/prestador",
    summary="DEBUG: Testar busca de prestador no MV",
)
def debug_prestador(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """DEBUG APENAS: Testa a sincronização de prestador do MV para o usuário logado."""
    from app.db.repositories.user import buscar_prestador_mv
    
    cd_usuario_mv = current_user.cd_usuario_mv or current_user.nm_login
    prestador = buscar_prestador_mv(db, cd_usuario_mv)
    
    return {
        "usuario_id": current_user.id_usuario,
        "nm_login": current_user.nm_login,
        "cd_usuario_mv": cd_usuario_mv,
        "prestador_encontrado": prestador is not None,
        "prestador": prestador.model_dump() if prestador else None,
    }
