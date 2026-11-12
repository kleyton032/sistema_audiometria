"""
Testes de autorização e isolamento de catálogo do módulo de Psicopedagogia.

Cenários cobertos:
  * capacidade `pode_acessar_psicopedagogia` (cd_tip_presta = 16)
  * bloqueio cruzado: psicopedagogo não acessa /psicologia e psicólogo não acessa /psicopedagogia
  * filtragem de catálogo por módulo: PAFE (PSICOLOGIA), PAPE (PSICOPEDAGOGIA) e PAHB (compartilhado)
  * criação de avaliação bloqueia protocolo de outro módulo
  * exclusividade por autor também em /psicopedagogia
"""
from datetime import datetime

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.dependencies import get_current_user, pode_acessar_psicopedagogia
from app.db.models import (
    User,
    UsuarioPrestador,
    PsiProtocolo,
    PsiAvaliacao,
)


def _user(id_usuario: int, cd_tip_presta=None, perfil: str = "OPERADOR") -> User:
    u = User(
        nm_login=f"psp_u{id_usuario}",
        nm_usuario="Nome Teste",
        ds_email=f"psp_u{id_usuario}@test.com",
        ds_perfil=perfil,
        fl_ativo=1,
    )
    u.id_usuario = id_usuario
    if cd_tip_presta is not None:
        u.prestador = UsuarioPrestador(
            id_usuario=id_usuario,
            cd_prestador=2000 + id_usuario,
            nm_prestador="Nome Teste",
            cd_tip_presta=cd_tip_presta,
        )
    return u


def _override(user: User):
    app.dependency_overrides[get_current_user] = lambda: user


def _seed_protocolo(db_session, codigo: str, modulo: str) -> int:
    p = PsiProtocolo(
        ds_codigo=codigo,
        nr_versao="1.0",
        ds_titulo=f"Protocolo {codigo}",
        ds_modulo=modulo,
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
        cd_prestador=2000 + id_usuario,
        dt_clinica=datetime(2026, 11, 12, 10, 0, 0),
        id_protocolo=id_protocolo,
        ds_situacao="RASCUNHO",
        nr_revisao=0,
    )
    db_session.add(a)
    db_session.flush()
    return a.id_avaliacao


# ── Unit: capacidade por tipo de prestador ──────────────────────────────────

def test_psicopedagogo_tem_acesso():
    assert pode_acessar_psicopedagogia(_user(1, cd_tip_presta=16)) is True


def test_psicologo_nao_tem_acesso_psicopedagogia():
    assert pode_acessar_psicopedagogia(_user(2, cd_tip_presta=10)) is False


def test_fonoaudiologo_sem_acesso_psicopedagogia():
    assert pode_acessar_psicopedagogia(_user(3, cd_tip_presta=6)) is False


def test_sem_prestador_sem_acesso_psicopedagogia():
    assert pode_acessar_psicopedagogia(_user(4, cd_tip_presta=None)) is False


# ── API: autorização cruzada e catálogo por módulo ──────────────────────────

class TestPsicopedagogiaAutorizacao:

    @pytest.fixture(autouse=True)
    def _cleanup(self):
        yield
        app.dependency_overrides.clear()

    def test_psicopedagogo_acessa_apenas_protocolos_do_modulo(self, client: TestClient, db_session):
        _seed_protocolo(db_session, "PAFE", "PSICOLOGIA")
        _seed_protocolo(db_session, "PAHB", "PSICOLOGIA,PSICOPEDAGOGIA")
        _seed_protocolo(db_session, "PAPE", "PSICOPEDAGOGIA")

        _override(_user(1, cd_tip_presta=16))
        resp = client.get("/api/v1/psicopedagogia/protocolos")
        assert resp.status_code == 200
        codigos = {p["ds_codigo"] for p in resp.json()}
        assert codigos == {"PAPE", "PAHB"}

    def test_psicologo_ve_apenas_protocolos_psicologia(self, client: TestClient, db_session):
        _seed_protocolo(db_session, "PAFE", "PSICOLOGIA")
        _seed_protocolo(db_session, "PAHB", "PSICOLOGIA,PSICOPEDAGOGIA")
        _seed_protocolo(db_session, "PAPE", "PSICOPEDAGOGIA")

        _override(_user(2, cd_tip_presta=10))
        resp = client.get("/api/v1/psicologia/protocolos")
        assert resp.status_code == 200
        codigos = {p["ds_codigo"] for p in resp.json()}
        assert codigos == {"PAFE", "PAHB"}

    def test_psicologo_bloqueado_em_psicopedagogia(self, client: TestClient, db_session):
        _seed_protocolo(db_session, "PAPE", "PSICOPEDAGOGIA")
        _override(_user(2, cd_tip_presta=10))
        resp = client.get("/api/v1/psicopedagogia/protocolos")
        assert resp.status_code == 403

    def test_psicopedagogo_bloqueado_em_psicologia(self, client: TestClient, db_session):
        _seed_protocolo(db_session, "PAFE", "PSICOLOGIA")
        _override(_user(1, cd_tip_presta=16))
        resp = client.get("/api/v1/psicologia/protocolos")
        assert resp.status_code == 403

    def test_psicopedagogo_nao_cria_avaliacao_com_protocolo_pafe(self, client: TestClient, db_session):
        id_pafe = _seed_protocolo(db_session, "PAFE", "PSICOLOGIA")
        _override(_user(1, cd_tip_presta=16))
        resp = client.post(
            "/api/v1/psicopedagogia/avaliacoes",
            json={
                "cd_paciente": "123",
                "cd_atendimento": "456",
                "dt_clinica": "2026-11-12T10:00:00",
                "id_protocolo": id_pafe,
            },
        )
        assert resp.status_code == 404


# ── API: exclusividade por autor ────────────────────────────────────────────

class TestPsicopedagogiaAutorUnico:

    @pytest.fixture(autouse=True)
    def _cleanup(self):
        yield
        app.dependency_overrides.clear()

    def test_autor_acessa_propria_avaliacao(self, client: TestClient, db_session):
        id_prot = _seed_protocolo(db_session, "PAPE", "PSICOPEDAGOGIA")
        id_av = _seed_avaliacao(db_session, id_usuario=1, id_protocolo=id_prot)
        _override(_user(1, cd_tip_presta=16))
        resp = client.get(f"/api/v1/psicopedagogia/avaliacoes/{id_av}")
        assert resp.status_code == 200

    def test_outro_psicopedagogo_bloqueado(self, client: TestClient, db_session):
        id_prot = _seed_protocolo(db_session, "PAPE", "PSICOPEDAGOGIA")
        id_av = _seed_avaliacao(db_session, id_usuario=1, id_protocolo=id_prot)
        _override(_user(2, cd_tip_presta=16))
        resp = client.get(f"/api/v1/psicopedagogia/avaliacoes/{id_av}")
        assert resp.status_code == 403
