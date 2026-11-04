"""
Testes de autorização do módulo de Psicologia (Etapa 1).

Cenários cobertos:
  * capacidade `pode_acessar_psicologia` (cd_tip_presta = 10)
  * bloqueio de acesso a quem não é psicólogo (fono, ADMIN sem psicologia, CONSULTA)
  * exclusividade por autor: outro psicólogo não acessa a avaliação
"""
from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.dependencies import get_current_user, pode_acessar_psicologia
from app.db.models import (
    User,
    UsuarioPrestador,
    PsiProtocolo,
    PsiAvaliacao,
)


def _user(id_usuario: int, cd_tip_presta=None, perfil: str = "OPERADOR") -> User:
    u = User(
        nm_login=f"u{id_usuario}",
        nm_usuario="Nome Teste",
        ds_email=f"u{id_usuario}@test.com",
        ds_perfil=perfil,
        fl_ativo=1,
    )
    u.id_usuario = id_usuario
    if cd_tip_presta is not None:
        u.prestador = UsuarioPrestador(
            id_usuario=id_usuario,
            cd_prestador=1000 + id_usuario,
            nm_prestador="Nome Teste",
            cd_tip_presta=cd_tip_presta,
        )
    return u


def _override(user: User):
    app.dependency_overrides[get_current_user] = lambda: user


def _seed_protocolo(db_session) -> int:
    p = PsiProtocolo(
        ds_codigo="PAFE",
        nr_versao="1.0",
        ds_titulo="Protocolo de Avaliação de Funções Executivas",
        ds_situacao="ATIVO",
    )
    db_session.add(p)
    db_session.flush()
    return p.id_protocolo


def _seed_avaliacao(db_session, id_usuario: int, id_protocolo: int) -> int:
    a = PsiAvaliacao(
        cd_paciente="123",
        cd_atendimento="456",
        id_usuario=id_usuario,
        cd_prestador=1000 + id_usuario,
        dt_clinica=datetime(2026, 11, 3, 10, 0, 0),
        id_protocolo=id_protocolo,
        ds_situacao="RASCUNHO",
        nr_revisao=0,
    )
    db_session.add(a)
    db_session.flush()
    return a.id_avaliacao


# ── Unit: capacidade por tipo de prestador ──────────────────────────────────

def test_psicologo_tem_acesso():
    assert pode_acessar_psicologia(_user(1, cd_tip_presta=10)) is True


def test_fonoaudiologo_sem_acesso():
    assert pode_acessar_psicologia(_user(2, cd_tip_presta=6)) is False


def test_sem_prestador_sem_acesso():
    assert pode_acessar_psicologia(_user(3, cd_tip_presta=None)) is False


# ── API: autorização por especialidade ──────────────────────────────────────

class TestProtocoloAutorizacao:

    @pytest.fixture(autouse=True)
    def _cleanup(self):
        yield
        app.dependency_overrides.clear()

    def test_psicologo_acessa_protocolo(self, client: TestClient, db_session):
        _seed_protocolo(db_session)
        _override(_user(1, cd_tip_presta=10))
        resp = client.get("/api/v1/psicologia/protocolo")
        assert resp.status_code == 200

    def test_fonoaudiologo_bloqueado(self, client: TestClient, db_session):
        _seed_protocolo(db_session)
        _override(_user(2, cd_tip_presta=6))
        resp = client.get("/api/v1/psicologia/protocolo")
        assert resp.status_code == 403

    def test_admin_sem_psicologia_bloqueado(self, client: TestClient, db_session):
        _seed_protocolo(db_session)
        _override(_user(3, cd_tip_presta=6, perfil="ADMIN"))
        resp = client.get("/api/v1/psicologia/protocolo")
        assert resp.status_code == 403

    def test_consulta_bloqueado(self, client: TestClient, db_session):
        _seed_protocolo(db_session)
        _override(_user(4, cd_tip_presta=None, perfil="CONSULTA"))
        resp = client.get("/api/v1/psicologia/protocolo")
        assert resp.status_code == 403


# ── API: exclusividade por autor ────────────────────────────────────────────

class TestAutorUnico:

    @pytest.fixture(autouse=True)
    def _cleanup(self):
        yield
        app.dependency_overrides.clear()

    def test_autor_acessa_propria_avaliacao(self, client: TestClient, db_session):
        id_protocolo = _seed_protocolo(db_session)
        id_av = _seed_avaliacao(db_session, id_usuario=1, id_protocolo=id_protocolo)
        _override(_user(1, cd_tip_presta=10))
        resp = client.get(f"/api/v1/psicologia/avaliacoes/{id_av}")
        assert resp.status_code == 200

    def test_outro_psicologo_bloqueado(self, client: TestClient, db_session):
        id_protocolo = _seed_protocolo(db_session)
        id_av = _seed_avaliacao(db_session, id_usuario=1, id_protocolo=id_protocolo)
        _override(_user(2, cd_tip_presta=10))
        resp = client.get(f"/api/v1/psicologia/avaliacoes/{id_av}")
        assert resp.status_code == 403

    def test_avaliacao_inexistente_retorna_404(self, client: TestClient, db_session):
        _seed_protocolo(db_session)
        _override(_user(1, cd_tip_presta=10))
        resp = client.get("/api/v1/psicologia/avaliacoes/999999")
        assert resp.status_code == 404
