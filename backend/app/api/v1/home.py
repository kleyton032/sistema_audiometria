from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user
from app.db.models import User
from app.db.repositories.home import get_home_stats

router = APIRouter(prefix="/home", tags=["Home"])

@router.get("/geral")
def home_geral(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_home_stats(db, current_user.id_usuario)
