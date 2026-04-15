# app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1 import auth

api_router = APIRouter()

# Módulo 1 — Autenticação
api_router.include_router(auth.router)

# Módulo 2 — Exames (descomente após criar o arquivo)
# from app.api.v1 import exames
# api_router.include_router(exames.router)
