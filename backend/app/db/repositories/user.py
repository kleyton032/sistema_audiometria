from sqlalchemy.orm import Session
from sqlalchemy.sql import text

from app.db.models import User, UsuarioPrestador, Perfil
from app.schemas.user import UserCreate, PrestadorMVInfo
from app.core.security import hash_password


def get_by_login(db: Session, login: str) -> User | None:
    return (
        db.query(User)
        .filter(User.nm_login == login, User.fl_ativo == 1)
        .first()
    )


def get_by_id(db: Session, id_user: int) -> User | None:
    return db.query(User).filter(
        User.id_usuario == id_user,
        User.fl_ativo == 1
    ).first()


def buscar_prestador_mv(db: Session, cd_usuario: str) -> PrestadorMVInfo | None:
    """Busca dados do prestador no MV a partir do cd_usuario (login MV)."""
    query = text("""
        SELECT
            p.cd_prestador,
            p.nm_prestador,
            c.ds_conselho,
            p.ds_codigo_conselho,
            tp.nm_tip_presta
        FROM
            dbasgu.usuarios u
            INNER JOIN prestador       p  ON u.cd_prestador  = p.cd_prestador
            INNER JOIN tip_presta      tp ON p.cd_tip_presta  = tp.cd_tip_presta
            LEFT  JOIN conselho        c  ON tp.cd_conselho   = c.cd_conselho
        WHERE UPPER(u.cd_usuario) = UPPER(:cd_usuario)
          AND u.sn_ativo          = 'S'
    """)
    row = db.execute(query, {"cd_usuario": cd_usuario}).first()
    if row is None:
        return None
    return PrestadorMVInfo(
        cd_prestador       = row.cd_prestador,
        nm_prestador       = row.nm_prestador,
        ds_conselho        = row.ds_conselho,
        ds_codigo_conselho = row.ds_codigo_conselho,
        nm_tip_presta      = row.nm_tip_presta,
    )


def buscar_usuario_mv(db: Session, cd_usuario: str) -> str | None:
    """
    Verifica se o usuário existe no MV (dbasgu.usuarios), independentemente
    de possuir prestador vinculado. Retorna o nm_usuario do MV ou None.
    """
    query = text("""
        SELECT u.nm_usuario
        FROM dbasgu.usuarios u
        WHERE UPPER(u.cd_usuario) = UPPER(:cd_usuario)
          AND u.sn_ativo = 'S'
    """)
    row = db.execute(query, {"cd_usuario": cd_usuario}).first()
    if row is None:
        return None
    return row.nm_usuario


def sync_user_prestador(db: Session, user: User, prestador: PrestadorMVInfo) -> User:
    """Sincroniza dados profissionais do MV para um usuário local existente."""
    # Verifica se houve mudanças antes de comitar
    has_changes = False
    
    if user.nm_usuario != prestador.nm_prestador:
        user.nm_usuario = prestador.nm_prestador
        has_changes = True
    
    if user.prestador:
        if (user.prestador.cd_prestador != prestador.cd_prestador or
            user.prestador.nm_prestador != prestador.nm_prestador or
            user.prestador.ds_conselho != prestador.ds_conselho or
            user.prestador.ds_codigo_conselho != prestador.ds_codigo_conselho or
            user.prestador.nm_tip_presta != prestador.nm_tip_presta):
            
            user.prestador.cd_prestador = prestador.cd_prestador
            user.prestador.nm_prestador = prestador.nm_prestador
            user.prestador.ds_conselho = prestador.ds_conselho
            user.prestador.ds_codigo_conselho = prestador.ds_codigo_conselho
            user.prestador.nm_tip_presta = prestador.nm_tip_presta
            
            from datetime import datetime
            user.prestador.dt_sincronizacao = datetime.now()
            has_changes = True
    else:
        db.add(
            UsuarioPrestador(
                id_usuario=user.id_usuario,
                cd_prestador=prestador.cd_prestador,
                nm_prestador=prestador.nm_prestador,
                ds_conselho=prestador.ds_conselho,
                ds_codigo_conselho=prestador.ds_codigo_conselho,
                nm_tip_presta=prestador.nm_tip_presta,
            )
        )
        has_changes = True
    
    if has_changes:
        db.commit()
        db.refresh(user)
    return user


def sync_existing_user_from_mv(db: Session, user: User) -> User:
    """Completa o vínculo profissional para usuários antigos que ainda não foram sincronizados."""
    cd_usuario = user.cd_usuario_mv or user.nm_login
    prestador = buscar_prestador_mv(db, cd_usuario)
    if prestador is None:
        return user
    return sync_user_prestador(db, user, prestador)


def create_user(db: Session, payload: UserCreate, prestador: PrestadorMVInfo | None = None, nm_usuario_mv: str | None = None) -> User:
    """
    Cria usuário local a partir dos dados do MV.
    
    Se prestador for None (usuário sem prestador vinculado), o perfil será CONSULTA
    e o nome será obtido de nm_usuario_mv.
    """
    email = payload.ds_email or f"{payload.cd_usuario_mv.lower()}@sistema.local"

    nome = prestador.nm_prestador if prestador else (nm_usuario_mv or payload.cd_usuario_mv)
    perfil_nome = "CONSULTA" if prestador is None else "OPERADOR"

    # Busca o ID do perfil correspondente
    perfil_db = db.query(Perfil).filter(Perfil.ds_perfil == perfil_nome).first()

    new_user = User(
        nm_login      = payload.cd_usuario_mv.lower(),
        nm_usuario    = nome,
        ds_email      = email,
        ds_senha_hash = hash_password(payload.ds_senha),
        ds_perfil     = perfil_nome,
        id_perfil     = perfil_db.id_perfil if perfil_db else None,
        cd_usuario_mv = payload.cd_usuario_mv,
    )
    db.add(new_user)
    db.flush()  # gera ID_USUARIO sem commit

    if prestador:
        new_prestador = UsuarioPrestador(
            id_usuario         = new_user.id_usuario,
            cd_prestador       = prestador.cd_prestador,
            nm_prestador       = prestador.nm_prestador,
            ds_conselho        = prestador.ds_conselho,
            ds_codigo_conselho = prestador.ds_codigo_conselho,
            nm_tip_presta      = prestador.nm_tip_presta,
        )
        db.add(new_prestador)

    db.commit()
    db.refresh(new_user)
    return new_user
