# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.schemas.user import UserCreate, UserResponse
from app.db.repositories.user import create_user, get_by_id, verify_mv_user_validity
from app.dependencies import get_db, get_current_user
from app.db.models import User

router = APIRouter(prefix="/users", tags=["Usuários"])


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar novo usuário",
)
def create_new_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Cria um usuário na **FAV_TB_SILA_USUARIOS**.

    - Requer um token JWT válido (apenas ADMINs deveriam chamar este endpoint em produção).
    - O ID é gerado automaticamente pelo trigger Oracle.
    - A senha é armazenada como bcrypt hash.
    """
    if current_user.ds_perfil != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem criar usuários",
        )    
    
    """ Ignora Validação para esse usuario """
    if payload.nm_login.lower() != "kleyton.bomfim":
        if not payload.cd_usuario_mv:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O código do usuário MV (cd_usuario_mv) é obrigatório."
            )
        
        is_valid_mv = verify_mv_user_validity(db, payload.cd_usuario_mv)
        if not is_valid_mv:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Usuário MV inválido. Certifique-se de que ele existe, está ativo e é um fonoaudiólogo (tipo 6)."
            )

    try:
        user = create_user(db, payload)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Login ou e-mail já cadastrado",
        ) from exc

    return user


@router.get(
    "/{id_usuario}",
    response_model=UserResponse,
    summary="Buscar usuário por ID",
)
def get_user(
    id_usuario: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    user = get_by_id(db, id_usuario)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user
