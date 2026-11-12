# app/api/v1/psicopedagogia.py
from app.api.v1.psicologia import build_modulo_clinico_router
from app.dependencies import pode_acessar_psicopedagogia, require_psicopedagogia

router = build_modulo_clinico_router(
    prefix="/psicopedagogia",
    tag="Psicopedagogia",
    modulo="PSICOPEDAGOGIA",
    check_acesso=pode_acessar_psicopedagogia,
    require_acesso=require_psicopedagogia,
    erro_acesso="Acesso restrito. Este módulo é exclusivo para psicopedagogos.",
    erro_dono="Somente o psicopedagogo responsável pode acessar esta avaliação.",
)

