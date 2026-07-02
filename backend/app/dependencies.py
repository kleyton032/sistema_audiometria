# app/dependencies.py
import logging
from typing import Generator
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.core.security import decode_token
from app.db.repositories.user import get_by_login
from app.db.models import User

logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    login = decode_token(token)
    if not login:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = get_by_login(db, login)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ── Classificação automática: usuário sem prestador vinculado = CONSULTA ──
    # Só aplica se o perfil NÃO for ADMIN (admin pode não ter prestador e
    # ainda assim precisa de acesso total).
    if user.perfil_nome != "ADMIN" and not user.prestador:
        # Busca o perfil CONSULTA na tabela de perfis
        from app.db.models import Perfil
        perfil_consulta = db.query(Perfil).filter(
            Perfil.ds_perfil == "CONSULTA"
        ).first()
        if perfil_consulta:
            user.id_perfil = perfil_consulta.id_perfil
            user.ds_perfil = perfil_consulta.ds_perfil
            # Força o relacionamento para que perfil_nome retorne CONSULTA
            user.perfil = perfil_consulta

    return user


def require_perfis(*perfis: str):
    """
    Dependency factory: bloqueia a requisição se o perfil do usuário não estiver na lista.

    Uso:
        @router.get("/admin-only")
        def admin_route(user: User = Depends(require_perfis("ADMIN", "SUPERVISOR"))):
            ...
    """
    def _check(user: User = Depends(get_current_user)) -> User:
        if user.perfil_nome not in perfis:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso restrito. Perfil necessário: {', '.join(perfis)}. "
                       f"Seu perfil: {user.perfil_nome}",
            )
        return user
    return _check


def require_escrita():
    """
    Dependency factory: bloqueia a requisição se o usuário tiver perfil CONSULTA
    (usuários sem prestador vinculado ao MV).

    Deve ser usada em TODOS os endpoints de escrita (POST, PUT, PATCH, DELETE).

    Uso:
        @router.post("/pts")
        def salvar_pts(
            pts_data: PTSCreate,
            user: User = Depends(require_escrita()),
            ...
        ):
            ...
    """
    def _check(
        request: Request,
        user: User = Depends(get_current_user),
    ) -> User:
        if user.perfil_nome == "CONSULTA":
            # Registra tentativa de acesso não autorizado em auditoria
            _log_audit_escrita_bloqueada(user, request)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso restrito. Seu perfil (CONSULTA) permite apenas "
                       "visualização. Para editar ou criar registros, é necessário "
                       "possuir um prestador vinculado ao MV.",
            )
        return user
    return _check


def _log_audit_escrita_bloqueada(user: User, request: Request):
    """
    Registra tentativa de escrita bloqueada por perfil CONSULTA na tabela de auditoria.
    Não lança exceção em caso de falha no log para não interromper o fluxo.
    """
    try:
        from sqlalchemy.sql import text
        db = SessionLocal()
        try:
            db.execute(
                text("""
                    INSERT INTO FAV_TB_AUDIT_LOG
                      (NM_TABELA, TP_OPERACAO, NM_LOGIN, NM_USUARIO,
                       DT_OPERACAO, DS_DESCRICAO)
                    VALUES
                      (:tabela, :operacao, :login, :nome_usuario,
                       SYSDATE, :descricao)
                """),
                {
                    "tabela": request.url.path,
                    "operacao": "BLOQUEIO_CONSULTA",
                    "login": user.nm_login,
                    "nome_usuario": user.nm_usuario,
                    "descricao": (
                        f"Tentativa de escrita bloqueada: {request.method} {request.url.path}. "
                        f"Usuário {user.nm_login} (ID={user.id_usuario}) sem prestador "
                        f"vinculado tentou operação de modificação."
                    ),
                },
            )
            db.commit()
        finally:
            db.close()
    except Exception:
        logger.warning(
            f"Falha ao registrar auditoria de bloqueio para {user.nm_login}",
            exc_info=True,
        )
