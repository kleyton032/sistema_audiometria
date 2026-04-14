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

---
*Este é um projeto em fase de desenvolvimento experimental.*
