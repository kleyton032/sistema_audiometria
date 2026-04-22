# app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1 import auth, users, agenda

api_router = APIRouter()

# Módulo 1 — Autenticação
api_router.include_router(auth.router)

# Módulo 2 — Usuários
api_router.include_router(users.router)

# Módulo 3 — Agenda / Pacientes (integração MV)
api_router.include_router(agenda.router)

