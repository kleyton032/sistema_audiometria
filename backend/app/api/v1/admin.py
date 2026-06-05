# app/api/v1/admin.py
"""
Painel Administrativo — endpoints exclusivos para perfil ADMIN.

Funcionalidades:
- Gerenciamento de usuários (listar, alterar perfil, ativar/desativar, reset senha)
- Controle de perfis e permissões
- Auditoria e logs
- Logs de erros do sistema
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql import text

from app.dependencies import get_db, require_perfis
from app.db.models import User, Perfil
from app.core.security import hash_password
from app.schemas.admin import (
    UserAdminResponse,
    UpdatePerfilRequest,
    UpdateStatusRequest,
    ResetPasswordRequest,
    PerfilPermissaoResponse,
    AuditLogResponse,
    SystemLogResponse,
    AdminStatsResponse,
)

router = APIRouter(prefix="/admin", tags=["Admin"])

_only_admin = Depends(require_perfis("ADMIN"))


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _user_to_admin_response(user: User) -> UserAdminResponse:
    p = user.prestador
    return UserAdminResponse(
        id_usuario         = user.id_usuario,
        cd_usuario_mv      = user.cd_usuario_mv,
        nm_login           = user.nm_login,
        nm_usuario         = user.nm_usuario,
        ds_email           = user.ds_email,
        ds_perfil          = user.perfil_nome,
        id_perfil          = user.id_perfil,
        fl_ativo           = user.fl_ativo,
        dt_criacao         = user.dt_criacao,
        dt_ultimo_acesso   = user.dt_ultimo_acesso,
        cd_prestador       = p.cd_prestador       if p else None,
        nm_tip_presta      = p.nm_tip_presta      if p else None,
        ds_conselho        = p.ds_conselho        if p else None,
        ds_codigo_conselho = p.ds_codigo_conselho if p else None,
        ds_especialidade   = user.ds_especialidade,
        nr_conselho        = user.nr_conselho,
    )


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 1 — Gerenciamento de Usuários
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/users",
    response_model=List[UserAdminResponse],
    summary="Listar todos os usuários (Admin)",
)
def list_all_users(
    search: Optional[str] = Query(None, description="Busca por nome, login, e-mail ou especialidade"),
    fl_ativo: Optional[int] = Query(None, description="Filtrar por status: 1=ativo, 0=inativo"),
    ds_perfil: Optional[str] = Query(None, description="Filtrar por perfil"),
    db: Session = Depends(get_db),
    _: User = _only_admin,
):
    """Lista todos os usuários com suporte a busca e filtros."""
    query = db.query(User)

    if fl_ativo is not None:
        query = query.filter(User.fl_ativo == fl_ativo)

    if search:
        s = f"%{search.lower()}%"
        from sqlalchemy import or_, func
        query = query.filter(
            or_(
                func.lower(User.nm_usuario).like(s),
                func.lower(User.nm_login).like(s),
                func.lower(User.ds_email).like(s),
                func.lower(User.ds_especialidade).like(s),
            )
        )

    users = query.order_by(User.nm_usuario).all()

    # Filtro por perfil (feito em Python para aproveitar perfil_nome com fallback)
    if ds_perfil:
        users = [u for u in users if u.perfil_nome == ds_perfil.upper()]

    return [_user_to_admin_response(u) for u in users]


@router.get(
    "/users/{id_usuario}",
    response_model=UserAdminResponse,
    summary="Buscar usuário por ID (Admin)",
)
def get_user_admin(
    id_usuario: int,
    db: Session = Depends(get_db),
    _: User = _only_admin,
):
    user = db.query(User).filter(User.id_usuario == id_usuario).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return _user_to_admin_response(user)


@router.patch(
    "/users/{id_usuario}/perfil",
    response_model=UserAdminResponse,
    summary="Alterar perfil de um usuário",
)
def update_user_perfil(
    id_usuario: int,
    payload: UpdatePerfilRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perfis("ADMIN")),
):
    user = db.query(User).filter(User.id_usuario == id_usuario).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    perfil = db.query(Perfil).filter(Perfil.ds_perfil == payload.ds_perfil.upper()).first()
    if not perfil:
        raise HTTPException(status_code=400, detail=f"Perfil '{payload.ds_perfil}' não encontrado")

    old_perfil = user.perfil_nome
    user.id_perfil = perfil.id_perfil
    user.ds_perfil = perfil.ds_perfil  # mantém coluna legada sincronizada

    db.commit()
    db.refresh(user)

    # Registra auditoria
    _log_audit(db, "FAV_TB_SILA_USUARIOS", "UPDATE", current_admin,
               f"Alterou perfil de '{old_perfil}' para '{perfil.ds_perfil}'",
               usuario_afetado_id=id_usuario)

    return _user_to_admin_response(user)


@router.patch(
    "/users/{id_usuario}/status",
    response_model=UserAdminResponse,
    summary="Ativar ou desativar usuário",
)
def update_user_status(
    id_usuario: int,
    payload: UpdateStatusRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perfis("ADMIN")),
):
    if payload.fl_ativo not in (0, 1):
        raise HTTPException(status_code=400, detail="fl_ativo deve ser 0 ou 1")

    user = db.query(User).filter(User.id_usuario == id_usuario).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    # Impede que admin desative a si mesmo
    if user.id_usuario == current_admin.id_usuario and payload.fl_ativo == 0:
        raise HTTPException(status_code=400, detail="Você não pode desativar sua própria conta")

    action = "ativou" if payload.fl_ativo == 1 else "desativou"
    user.fl_ativo = payload.fl_ativo
    db.commit()
    db.refresh(user)

    _log_audit(db, "FAV_TB_SILA_USUARIOS", "UPDATE", current_admin,
               f"{action.capitalize()} o usuário '{user.nm_login}'",
               usuario_afetado_id=id_usuario)

    return _user_to_admin_response(user)


@router.post(
    "/users/{id_usuario}/reset-password",
    summary="Resetar senha de um usuário",
)
def reset_user_password(
    id_usuario: int,
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_perfis("ADMIN")),
):
    if len(payload.nova_senha) < 8:
        raise HTTPException(status_code=400, detail="A senha deve ter no mínimo 8 caracteres")

    user = db.query(User).filter(User.id_usuario == id_usuario).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    user.ds_senha_hash = hash_password(payload.nova_senha)
    user.fl_troca_senha = 1
    db.commit()

    _log_audit(db, "FAV_TB_SILA_USUARIOS", "UPDATE", current_admin,
               f"Resetou a senha do usuário '{user.nm_login}'",
               usuario_afetado_id=id_usuario)

    return {"detail": "Senha alterada com sucesso"}


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 2 — Perfis e Permissões
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/profiles",
    response_model=List[PerfilPermissaoResponse],
    summary="Listar perfis com suas permissões",
)
def list_profiles(
    db: Session = Depends(get_db),
    _: User = _only_admin,
):
    rows = db.execute(text("""
        SELECT
            p.ID_PERFIL,
            p.DS_PERFIL,
            p.DS_DESCRICAO,
            perm.CD_PERMISSAO
        FROM FAV_TB_PERFIS p
        LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp ON p.ID_PERFIL = pp.ID_PERFIL
        LEFT JOIN FAV_TB_PERMISSOES perm ON pp.ID_PERMISSAO = perm.ID_PERMISSAO
            AND perm.FL_ATIVO = 1
        WHERE p.FL_ATIVO = 1
        ORDER BY p.ID_PERFIL, perm.DS_MODULO, perm.CD_PERMISSAO
    """)).fetchall()

    result: dict = {}
    for row in rows:
        pid = row[0]
        if pid not in result:
            result[pid] = PerfilPermissaoResponse(
                id_perfil=pid,
                ds_perfil=row[1],
                ds_descricao=row[2],
                permissoes=[],
            )
        if row[3]:
            result[pid].permissoes.append(row[3])

    return list(result.values())


@router.get(
    "/permissions",
    summary="Listar todas as permissões do sistema",
)
def list_permissions(
    db: Session = Depends(get_db),
    _: User = _only_admin,
):
    rows = db.execute(text("""
        SELECT ID_PERMISSAO, CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO
        FROM FAV_TB_PERMISSOES
        ORDER BY DS_MODULO, DS_TIPO, CD_PERMISSAO
    """)).fetchall()
    return [
        {
            "id_permissao": r[0],
            "cd_permissao": r[1],
            "ds_permissao": r[2],
            "ds_modulo": r[3],
            "ds_tipo": r[4],
            "fl_ativo": r[5],
        }
        for r in rows
    ]


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 3 — Auditoria
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/audit",
    response_model=List[AuditLogResponse],
    summary="Consultar logs de auditoria",
)
def get_audit_logs(
    tabela: Optional[str] = Query(None, description="Filtrar por tabela"),
    operacao: Optional[str] = Query(None, description="INSERT | UPDATE | DELETE"),
    nm_login: Optional[str] = Query(None, description="Filtrar por login do usuário"),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    _: User = _only_admin,
):
    """Retorna logs de auditoria com filtros opcionais."""
    # Verifica se a tabela de auditoria existe
    exists = _table_exists(db, "FAV_TB_LOG_AUDITORIA")
    if not exists:
        return []

    filters = ["1=1"]
    params: dict = {"limit": limit}

    if tabela:
        filters.append("UPPER(nm_tabela) = UPPER(:tabela)")
        params["tabela"] = tabela
    if operacao:
        filters.append("UPPER(tp_operacao) = UPPER(:operacao)")
        params["operacao"] = operacao
    if nm_login:
        filters.append("UPPER(nm_login) LIKE UPPER(:nm_login)")
        params["nm_login"] = f"%{nm_login}%"

    where = " AND ".join(filters)

    rows = db.execute(text(f"""
        SELECT
            id_log, nm_tabela, tp_operacao, nm_login, nm_usuario,
            dt_operacao, ds_descricao, ds_valores_anteriores, ds_valores_novos
        FROM FAV_TB_LOG_AUDITORIA
        WHERE {where}
        ORDER BY dt_operacao DESC
        FETCH FIRST :limit ROWS ONLY
    """), params).fetchall()

    return [
        AuditLogResponse(
            id_log=r[0], nm_tabela=r[1], tp_operacao=r[2], nm_login=r[3],
            nm_usuario=r[4], dt_operacao=r[5], ds_descricao=r[6],
            ds_valores_anteriores=r[7], ds_valores_novos=r[8],
        )
        for r in rows
    ]


@router.get(
    "/audit/tables",
    summary="Verificar quais tabelas têm auditoria implementada",
)
def get_audited_tables(
    db: Session = Depends(get_db),
    _: User = _only_admin,
):
    """Lista as tabelas que possuem triggers de auditoria no banco."""
    try:
        rows = db.execute(text("""
            SELECT
                t.TABLE_NAME,
                t.TRIGGER_NAME,
                t.TRIGGER_TYPE,
                t.TRIGGERING_EVENT,
                t.STATUS
            FROM USER_TRIGGERS t
            WHERE UPPER(t.TABLE_NAME) LIKE 'FAV_TB%'
               OR UPPER(t.TABLE_NAME) LIKE 'TB_FAV%'
            ORDER BY t.TABLE_NAME
        """)).fetchall()

        return [
            {
                "table_name": r[0],
                "trigger_name": r[1],
                "trigger_type": r[2],
                "events": r[3],
                "status": r[4],
            }
            for r in rows
        ]
    except Exception:
        return []


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 4 — Logs de Erros do Sistema
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/system-logs",
    response_model=List[SystemLogResponse],
    summary="Consultar logs de erros e sistema",
)
def get_system_logs(
    tp_nivel: Optional[str] = Query(None, description="ERROR | WARNING | INFO"),
    nm_modulo: Optional[str] = Query(None, description="Filtrar por módulo"),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db),
    _: User = _only_admin,
):
    exists = _table_exists(db, "FAV_TB_LOG_SISTEMA")
    if not exists:
        return []

    filters = ["1=1"]
    params: dict = {"limit": limit}

    if tp_nivel:
        filters.append("UPPER(tp_nivel) = UPPER(:tp_nivel)")
        params["tp_nivel"] = tp_nivel
    if nm_modulo:
        filters.append("UPPER(nm_modulo) LIKE UPPER(:nm_modulo)")
        params["nm_modulo"] = f"%{nm_modulo}%"

    where = " AND ".join(filters)

    rows = db.execute(text(f"""
        SELECT id_log, tp_nivel, nm_modulo, ds_mensagem, ds_detalhe, nm_login, dt_criacao
        FROM FAV_TB_LOG_SISTEMA
        WHERE {where}
        ORDER BY dt_criacao DESC
        FETCH FIRST :limit ROWS ONLY
    """), params).fetchall()

    return [
        SystemLogResponse(
            id_log=r[0], tp_nivel=r[1], nm_modulo=r[2], ds_mensagem=r[3],
            ds_detalhe=r[4], nm_login=r[5], dt_criacao=r[6],
        )
        for r in rows
    ]


# ─────────────────────────────────────────────────────────────────────────────
# SECTION 5 — Dashboard Stats
# ─────────────────────────────────────────────────────────────────────────────

@router.get(
    "/stats",
    response_model=AdminStatsResponse,
    summary="Estatísticas gerais para o painel administrativo",
)
def get_admin_stats(
    db: Session = Depends(get_db),
    _: User = _only_admin,
):
    all_users = db.query(User).all()
    total      = len(all_users)
    ativos     = sum(1 for u in all_users if u.fl_ativo == 1)
    inativos   = total - ativos
    sem_perfil = sum(1 for u in all_users if u.id_perfil is None and u.fl_ativo == 1)

    por_perfil: dict = {}
    for u in all_users:
        if u.fl_ativo == 1:
            p = u.perfil_nome
            por_perfil[p] = por_perfil.get(p, 0) + 1

    logs_hoje = 0
    erros_hoje = 0

    if _table_exists(db, "FAV_TB_LOG_AUDITORIA"):
        r = db.execute(text(
            "SELECT COUNT(*) FROM FAV_TB_LOG_AUDITORIA "
            "WHERE TRUNC(dt_operacao) = TRUNC(SYSDATE)"
        )).scalar()
        logs_hoje = r or 0

    if _table_exists(db, "FAV_TB_LOG_SISTEMA"):
        r = db.execute(text(
            "SELECT COUNT(*) FROM FAV_TB_LOG_SISTEMA "
            "WHERE UPPER(tp_nivel) = 'ERROR' AND TRUNC(dt_criacao) = TRUNC(SYSDATE)"
        )).scalar()
        erros_hoje = r or 0

    return AdminStatsResponse(
        total_usuarios=total,
        usuarios_ativos=ativos,
        usuarios_inativos=inativos,
        sem_perfil=sem_perfil,
        por_perfil=por_perfil,
        logs_hoje=logs_hoje,
        erros_hoje=erros_hoje,
    )


# ─────────────────────────────────────────────────────────────────────────────
# Helpers internos
# ─────────────────────────────────────────────────────────────────────────────

def _table_exists(db: Session, table_name: str) -> bool:
    """Verifica se uma tabela Oracle existe no schema atual."""
    try:
        result = db.execute(
            text("SELECT COUNT(*) FROM USER_TABLES WHERE TABLE_NAME = :t"),
            {"t": table_name.upper()},
        ).scalar()
        return (result or 0) > 0
    except Exception:
        return False


def _log_audit(
    db: Session,
    nm_tabela: str,
    tp_operacao: str,
    admin: User,
    ds_descricao: str,
    usuario_afetado_id: Optional[int] = None,
) -> None:
    """Registra uma entrada de auditoria (não falha se a tabela não existir)."""
    try:
        if not _table_exists(db, "FAV_TB_LOG_AUDITORIA"):
            return

        nm_usuario_afetado = None
        if usuario_afetado_id:
            u = db.query(User).filter(User.id_usuario == usuario_afetado_id).first()
            nm_usuario_afetado = u.nm_usuario if u else None

        db.execute(text("""
            INSERT INTO FAV_TB_LOG_AUDITORIA
                (NM_TABELA, TP_OPERACAO, NM_LOGIN, NM_USUARIO, DT_OPERACAO, DS_DESCRICAO, DS_VALORES_NOVOS)
            VALUES
                (:tabela, :op, :login, :usuario, SYSDATE, :desc, :novos)
        """), {
            "tabela":  nm_tabela,
            "op":      tp_operacao,
            "login":   admin.nm_login,
            "usuario": nm_usuario_afetado or admin.nm_usuario,
            "desc":    ds_descricao,
            "novos":   f"Afetou ID_USUARIO={usuario_afetado_id}" if usuario_afetado_id else None,
        })
        db.commit()
    except Exception:
        # Silencia erros de log para não quebrar a operação principal
        pass
