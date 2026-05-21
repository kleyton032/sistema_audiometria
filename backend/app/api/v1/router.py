# app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1 import auth, users, agenda, exames, pts, home, admin

api_router = APIRouter()

# Módulo 0 — Home (Dashboard)
api_router.include_router(home.router)

# Módulo 1 — Autenticação
api_router.include_router(auth.router)

# Módulo 2 — Usuários
api_router.include_router(users.router)

# Módulo 3 — Agenda / Pacientes (integração MV)
api_router.include_router(agenda.router)

# Módulo 4 — Exames audiológicos
api_router.include_router(exames.router)

# Módulo 5 — PTS (Projeto Terapêutico Singular)
api_router.include_router(pts.router)

# Módulo 6 — Painel Administrativo (apenas ADMIN)
api_router.include_router(admin.router)

