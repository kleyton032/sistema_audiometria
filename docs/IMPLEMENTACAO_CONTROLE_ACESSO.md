# Implementação do Sistema de Controle de Acesso

## 📋 Visão Geral

Este guia descreve a implementação do sistema de controle de acesso baseado em **Perfis** (Roles) e **Permissões** granulares.

---

## 🗄️ Estrutura de Tabelas Criadas

### 1. **FAV_TB_PERFIS** (Roles)
Armazena os perfis/roles do sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| ID_PERFIL | NUMBER(10) | PK - Gerado automaticamente |
| DS_PERFIL | VARCHAR2(50) | Nome único do perfil (ex: "ADMIN", "OPERADOR") |
| DS_DESCRICAO | VARCHAR2(500) | Descrição do perfil |
| FL_ATIVO | NUMBER(1) | 1=ativo, 0=inativo |
| DT_CRIACAO | DATE | Data de criação automática |

**Perfis Padrão Criados:**
- ADMIN - Acesso completo
- SUPERVISOR - Acesso parcial com permissões de administração limitadas
- OPERADOR - Acesso padrão (módulos principais)
- VISUALIZADOR - Apenas visualização de dados

---

### 2. **FAV_TB_PERMISSOES** (Permissions)
Define todas as permissões granulares do sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| ID_PERMISSAO | NUMBER(10) | PK - Gerado automaticamente |
| CD_PERMISSAO | VARCHAR2(50) | Código único (ex: "PTS_VISUALIZAR") |
| DS_PERMISSAO | VARCHAR2(200) | Descrição legível |
| DS_MODULO | VARCHAR2(50) | Módulo (PTS, AUDIOMETRIA, ADMIN, etc) |
| DS_TIPO | VARCHAR2(20) | Tipo (VISUALIZAR, CRIAR, EDITAR, DELETAR) |
| FL_ATIVO | NUMBER(1) | 1=ativa, 0=inativa |
| DT_CRIACAO | DATE | Data de criação automática |

**Permissões Criadas:**
```
PTS:
  - PTS_VISUALIZAR
  - PTS_CRIAR
  - PTS_EDITAR
  - PTS_FINALIZAR
  - PTS_CANCELAR
  - PTS_IMPRIMIR
  - PTS_DASHBOARD

AUDIOMETRIA:
  - AUDIOMETRIA_VISUALIZAR
  - AUDIOMETRIA_CRIAR
  - AUDIOMETRIA_EDITAR
  - AUDIOMETRIA_DELETAR

IMITANCIOMETRIA:
  - IMITANCIOMETRIA_VISUALIZAR
  - IMITANCIOMETRIA_CRIAR
  - IMITANCIOMETRIA_EDITAR
  - IMITANCIOMETRIA_DELETAR

ADMIN:
  - ADMIN_ACESSO
  - USUARIOS_GERENCIAR
  - PERFIS_GERENCIAR
  - MENUS_GERENCIAR
  - AUDITORIA_VISUALIZAR
```

---

### 3. **FAV_TB_PERFIS_PERMISSOES** (Role-Permission Mapping)
Relacionamento many-to-many entre perfis e permissões.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| ID_PERFIL_PERMISSAO | NUMBER(10) | PK |
| ID_PERFIL | NUMBER(10) | FK para FAV_TB_PERFIS |
| ID_PERMISSAO | NUMBER(10) | FK para FAV_TB_PERMISSOES |
| DT_CRIACAO | DATE | Data de criação |

---

### 4. **FAV_TB_MENUS** (Menu Structure)
Define a estrutura hierárquica de menus do sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| ID_MENU | NUMBER(10) | PK |
| NM_MENU | VARCHAR2(100) | Nome do menu (ex: "Dashboard PTS") |
| DS_MENU | VARCHAR2(200) | Descrição |
| CD_ROTA | VARCHAR2(255) | Rota do React (ex: "/pts/dashboard") |
| ID_MENU_PAI | NUMBER(10) | Auto-referência para submenus |
| NR_ORDEM | NUMBER(3) | Ordem de exibição |
| ID_PERMISSAO | NUMBER(10) | FK - Permissão requerida para acessar |
| FL_ATIVO | NUMBER(1) | 1=ativo, 0=inativo |
| DT_CRIACAO | DATE | Data de criação |

**Menus Criados:**
```
Home (sem permissão requerida)
├── Dashboard PTS (PTS_DASHBOARD)
├── PTS - Pacientes (PTS_VISUALIZAR)
Audiometria (AUDIOMETRIA_VISUALIZAR)
Imitanciometria (IMITANCIOMETRIA_VISUALIZAR)
Administração (ADMIN_ACESSO)
├── Controle de Acesso (USUARIOS_GERENCIAR)
└── Auditoria (AUDITORIA_VISUALIZAR)
```

---

### 5. **Alteração em FAV_TB_SILA_USUARIOS**
Adicionado campo:

```sql
ID_PERFIL NUMBER(10) -- FK para FAV_TB_PERFIS
```

---

## 🚀 Como Executar os Scripts

### Pré-requisitos:
- Acesso ao banco Oracle
- Usuário com permissões para CREATE TABLE, ALTER TABLE, etc.

### Execução:

#### 1️⃣ **Script Principal** - Criar estrutura:
```bash
sqlplus usuario/senha@banco @03_controle_acesso.sql
```

Ou no SQL Developer:
1. Abrir arquivo `03_controle_acesso.sql`
2. Selecionar tudo (Ctrl+A)
3. Executar (Ctrl+Enter)

#### 2️⃣ **Queries de Manutenção** - Para gerenciar após criação:
Abrir `queries_manutencao_acesso.sql` conforme necessário.

---

## 📝 Exemplos de Uso

### Exemplo 1: Consultar permissões de um usuário
```sql
-- Query #1 do arquivo queries_manutencao_acesso.sql
-- Substituir USER_ID pelo ID do usuário
SELECT * FROM VW_USUARIOS_PERMISSOES WHERE ID_USUARIO = 1;
```

### Exemplo 2: Alterar perfil de um usuário
```sql
-- Mudar usuário ID=2 para ADMIN
UPDATE FAV_TB_SILA_USUARIOS
SET ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'ADMIN')
WHERE ID_USUARIO = 2;
COMMIT;
```

### Exemplo 3: Adicionar permissão a um perfil
```sql
-- Adicionar "PTS_CANCELAR" ao perfil "OPERADOR"
INSERT INTO FAV_TB_PERFIS_PERMISSOES (ID_PERFIL, ID_PERMISSAO)
SELECT 
    (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'OPERADOR'),
    ID_PERMISSAO
FROM FAV_TB_PERMISSOES
WHERE CD_PERMISSAO = 'PTS_CANCELAR';
COMMIT;
```

### Exemplo 4: Criar novo perfil customizado
```sql
-- Criar perfil "AUDITOR" com permissões limitadas
INSERT INTO FAV_TB_PERFIS (DS_PERFIL, DS_DESCRICAO, FL_ATIVO)
VALUES ('AUDITOR', 'Auditor de sistema com acesso a logs e relatórios', 1);

-- Atribuir permissões
INSERT INTO FAV_TB_PERFIS_PERMISSOES (ID_PERFIL, ID_PERMISSAO)
SELECT ID_PERFIL, ID_PERMISSAO FROM FAV_TB_PERFIS, FAV_TB_PERMISSOES
WHERE DS_PERFIL = 'AUDITOR' 
  AND CD_PERMISSAO IN ('PTS_VISUALIZAR', 'AUDIOMETRIA_VISUALIZAR', 'AUDITORIA_VISUALIZAR');
COMMIT;
```

---

## 🔐 Matriz de Permissões por Perfil

| Permissão | ADMIN | SUPERVISOR | OPERADOR | VISUALIZADOR |
|-----------|:-----:|:----------:|:--------:|:------------:|
| **PTS_VISUALIZAR** | ✅ | ✅ | ✅ | ✅ |
| **PTS_CRIAR** | ✅ | ✅ | ✅ | ❌ |
| **PTS_EDITAR** | ✅ | ✅ | ✅ | ❌ |
| **PTS_FINALIZAR** | ✅ | ✅ | ✅ | ❌ |
| **PTS_CANCELAR** | ✅ | ❌ | ❌ | ❌ |
| **PTS_DASHBOARD** | ✅ | ✅ | ✅ | ✅ |
| **AUDIOMETRIA_VISUALIZAR** | ✅ | ✅ | ✅ | ✅ |
| **AUDIOMETRIA_CRIAR** | ✅ | ✅ | ✅ | ❌ |
| **AUDIOMETRIA_EDITAR** | ✅ | ✅ | ✅ | ❌ |
| **AUDIOMETRIA_DELETAR** | ✅ | ❌ | ❌ | ❌ |
| **IMITANCIOMETRIA_VISUALIZAR** | ✅ | ✅ | ✅ | ✅ |
| **IMITANCIOMETRIA_CRIAR** | ✅ | ✅ | ✅ | ❌ |
| **IMITANCIOMETRIA_EDITAR** | ✅ | ✅ | ✅ | ❌ |
| **IMITANCIOMETRIA_DELETAR** | ✅ | ❌ | ❌ | ❌ |
| **ADMIN_ACESSO** | ✅ | ✅ | ❌ | ❌ |
| **USUARIOS_GERENCIAR** | ✅ | ✅ | ❌ | ❌ |
| **PERFIS_GERENCIAR** | ✅ | ❌ | ❌ | ❌ |
| **MENUS_GERENCIAR** | ✅ | ❌ | ❌ | ❌ |
| **AUDITORIA_VISUALIZAR** | ✅ | ✅ | ❌ | ❌ |

---

## 🔍 Views Criadas

O script cria 2 views úteis:

### 1. **VW_USUARIOS_PERMISSOES**
Mostra usuários com seus perfis e permissões.

```sql
SELECT * FROM VW_USUARIOS_PERMISSOES WHERE NM_LOGIN = 'seu_usuario';
```

### 2. **VW_MENUS_PERMISSOES**
Mostra menus com permissões associadas.

```sql
SELECT * FROM VW_MENUS_PERMISSOES ORDER BY NR_ORDEM;
```

---

## 📊 Relatórios Úteis

### Permissões por Perfil
```sql
-- Query #10 do arquivo queries_manutencao_acesso.sql
SELECT * FROM (relatório de permissões por perfil)
```

### Usuários por Perfil
```sql
-- Query #11 do arquivo queries_manutencao_acesso.sql
SELECT * FROM (relatório de usuários por perfil)
```

### Quem tem acesso ao Admin
```sql
-- Query #14 do arquivo queries_manutencao_acesso.sql
SELECT * FROM (usuários com ADMIN_ACESSO)
```

---

## ⚙️ Próximos Passos (Backend)

1. Criar models SQLAlchemy (Perfil, Permissao, Menu)
2. Criar repositories para CRUD de perfis/permissões
3. Adicionar middleware de autorização
4. Implementar decorators @require_permission
5. Modificar JWT para incluir permissões
6. Criar endpoints de admin

---

## ⚙️ Próximos Passos (Frontend)

1. Criar PermissionContext com hook usePermissions
2. Criar componente ProtectedRoute
3. Criar componente ProtectedMenu
4. Implementar painel administrativo
5. Integrar com backend para carregar permissões

---

## 🆘 Troubleshooting

### Erro: "ORA-00904: invalid identifier"
→ Verificar sequências: `SELECT * FROM USER_SEQUENCES;`

### Erro: "ORA-02292: integrity constraint violated"
→ Usuários têm ID_PERFIL nulo. Executar:
```sql
UPDATE FAV_TB_SILA_USUARIOS 
SET ID_PERFIL = 3  -- OPERADOR
WHERE ID_PERFIL IS NULL;
COMMIT;
```

### Permissão não aparece no JWT
→ Verificar se a permissão está ativa: `FL_ATIVO = 1`

---

## 📧 Suporte

Para dúvidas sobre o script, consultar:
- `03_controle_acesso.sql` - Documentado com comentários
- `queries_manutencao_acesso.sql` - Exemplos de operações comuns

---

**Última atualização:** 21 de maio de 2026
