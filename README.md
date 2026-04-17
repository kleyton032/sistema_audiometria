# Sistema de Laudos de Audiometria

Este projeto é uma iniciativa para o desenvolvimento de um sistema automatizado para a geração de laudos audiológicos. O objetivo é criar uma solução robusta e escalável para processar exames de audiometria e imitanciometria, integrando-se a sistemas hospitalares existentes.

## 🚀 Visão Geral

A abordagem utiliza uma arquitetura em camadas para garantir que o sistema seja modular e fácil de manter. O foco inicial está na construção de um motor de processamento clínico e geração de documentos de alta precisão.

## 🏗️ Arquitetura

O sistema foi desenhado seguindo o padrão de separação de responsabilidades:

1.  **Camada de Apresentação**: Inicialmente operando via CLI para automação de tarefas, evoluindo para uma API REST robusta utilizando **FastAPI**.
2.  **Lógica de Negócio**: Centraliza as regras clínicas, incluindo a classificação de limiares audiométricos (OMS 2021) e análise de timpanogramas (Jerger 1972).
3.  **Geração de Documentos**: Núcleo do sistema focado na criação de PDFs de alta fidelidade para audiogramas e imitanciometrias, utilizando tecnologias como **Jinja2** e **WeasyPrint** ou **ReportLab**.
4.  **Persistência**: Integração com banco de dados **Oracle** através de **SQLAlchemy**, garantindo a integridade dos dados dos pacientes e resultados dos exames.

## 🛠️ Tecnologias Utilizadas

-   **Linguagem**: Python 3.14+
-   **Framework API**: FastAPI
-   **Banco de Dados**: Oracle DB (SQLAlchemy + oracledb)
-   **Geração de PDF**: WeasyPrint / Matplotlib
-   **Migrações**: Alembic

## 📂 Estrutura do Projeto

```text
backend/
├── app/
│   ├── api/          # Endpoints da API
│   ├── core/         # Configurações globais
│   ├── db/           # Modelos e repositórios de dados
│   ├── pdf/          # Lógica de geração de laudos e templates
│   └── schemas/       # Esquemas de validação (Pydantic)
├── tests/            # Testes unitários e de integração
└── venv/             # Ambiente virtual Python
```

## 🧪 Guia de Execução dos Testes

### Estrutura de Testes

```
backend/tests/
├── conftest.py                          # Fixtures do cliente e utilidades
├── db_tests.py                          # Fixtures do banco de dados SQLite
└── unit/
    ├── __init__.py
    └── auth/
        ├── __init__.py
        └── test_security.py             # Testes unitários de segurança
```

### Instalação das Dependências de Teste

Antes de executar os testes, instale as dependências:

```bash
cd backend
pip install -r requirements.txt
```

As dependências adicionadas para testes são:
- `pytest==8.3.2` - Framework de testes
- `pytest-asyncio==0.24.0` - Suporte a testes assíncronos
- `httpx==0.28.1` - Cliente HTTP para testes

### Executar Testes

```bash
# Todos os testes
cd backend
pytest

# Apenas testes de segurança
pytest tests/unit/auth/test_security.py -v

# Um teste específico
pytest tests/unit/auth/test_security.py::TestPasswordHashing::test_hash_password_creates_hash -v
```

### Opções Úteis do Pytest

```bash
# Modo verboso (mostra mais detalhes)
pytest -v

# Mostrar output print
pytest -s

# Parar no primeiro erro
pytest -x

# Mostrar cobertura de testes
pytest --cov=app tests/
```

### Testes de Segurança Implementados

| Teste | Descrição |
|-------|-----------|
| `test_hash_password_creates_hash` | Hash de senha funciona |
| `test_verify_password_correct` | Verificação com senha correta |
| `test_verify_password_incorrect` | Verificação com senha incorreta |
| `test_verify_password_different_hashes` | Hashes diferentes para mesma senha |
| `test_create_token_success` | Criação de token JWT |
| `test_decode_token_success` | Decodificação de token válido |
| `test_decode_invalid_token` | Token inválido é rejeitado |
| `test_decode_expired_token` | Token expirado é rejeitado |
| `test_token_modified_raises_error` | Token modificado é rejeitado |

### Notas Sobre os Testes

Os testes usam um banco de dados SQLite em memória (`sqlite:///:memory:`) para isolamento completo:

- **Vantagem**: Testes rápidos e sem dependências do Oracle
- **Cada teste**: Recebe um banco de dados limpo e isolado
- **Limpeza**: Automática após cada teste

Para mais informações, veja [backend/tests/README.md](backend/tests/README.md).

---
*Este é um projeto em fase de desenvolvimento experimental.*
