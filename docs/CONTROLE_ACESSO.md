# Documentação Técnica — Controle de Acesso e Permissões

> Sistema: CDM — Documentação Multidisciplinar  
> Banco de dados: Oracle 11g/12c+  
> Backend: FastAPI (Python 3.8+)  
> Frontend: React + TypeScript  
> Última atualização: 21/05/2026

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Estrutura de Tabelas](#2-estrutura-de-tabelas)
3. [Relacionamentos](#3-relacionamentos)
4. [Perfis do Sistema](#4-perfis-do-sistema)
5. [Permissões por Módulo](#5-permissões-por-módulo)
6. [Matriz de Perfis × Permissões](#6-matriz-de-perfis--permissões)
7. [Coordenadores por Especialidade](#7-coordenadores-por-especialidade)
8. [Regras de Acesso — PTS](#8-regras-de-acesso--pts)
9. [Fluxo de Autenticação e Autorização](#9-fluxo-de-autenticação-e-autorização)
10. [Implementação Backend](#10-implementação-backend)
11. [Implementação Frontend](#11-implementação-frontend)
12. [Scripts de Consulta Úteis](#12-scripts-de-consulta-úteis)
13. [Scripts de Manutenção](#13-scripts-de-manutenção)
14. [Observações Importantes](#14-observações-importantes)

---

## 1. Visão Geral

O sistema utiliza RBAC (Role-Based Access Control) com perfis hierárquicos.  
Cada usuário possui um **perfil** que define quais **permissões** possui, e o backend aplica filtros de dados adicionais conforme regras de negócio.

```
USUÁRIO → PERFIL → PERMISSÕES (granulares)
                 ↓
              FILTRO DE DADOS (backend)
              ├── ADMIN/SUPERVISOR  → vê tudo
              ├── COORDENADOR       → vê por especialidade
              └── OPERADOR          → vê apenas os próprios
```

---

## 2. Estrutura de Tabelas

### 2.1 Tabelas de Usuários

#### `FAV_TB_SILA_USUARIOS` — Tabela principal de usuários
| Coluna           | Tipo         | Descrição                                      |
|------------------|--------------|------------------------------------------------|
| ID_USUARIO       | NUMBER(10)   | PK — Identificador único                       |
| NM_LOGIN         | VARCHAR2(50) | Login do usuário (único)                       |
| NM_USUARIO       | VARCHAR2(200)| Nome completo                                  |
| DS_EMAIL         | VARCHAR2(200)| E-mail (único)                                 |
| DS_SENHA_HASH    | VARCHAR2(255)| Hash bcrypt da senha                           |
| ID_PERFIL        | NUMBER(10)   | **FK → FAV_TB_PERFIS.ID_PERFIL** (fonte da verdade para controle de acesso) |
| DS_PERFIL        | VARCHAR2(20) | Coluna legada (mantida para compatibilidade)   |
| CD_USUARIO_MV    | VARCHAR2(50) | Código do usuário no sistema MV                |
| NR_CONSELHO      | VARCHAR2(20) | Número do conselho profissional                |
| DS_ESPECIALIDADE | VARCHAR2(100)| Especialidade (coluna local)                   |
| DT_CRIACAO       | DATETIME     | Data de criação do registro                    |
| DT_ULTIMO_ACESSO | DATETIME     | Último acesso ao sistema                       |
| FL_ATIVO         | NUMBER(1)    | 1=Ativo, 0=Inativo                             |

> ⚠️ **Importante:** `ID_PERFIL` (FK) é a fonte de verdade para o controle de acesso. A coluna `DS_PERFIL` é legada e pode estar desatualizada. O backend prioriza `ID_PERFIL` via relationship.

---

#### `FAV_TB_USUARIO_PRESTADOR` — Dados profissionais sincronizados do MV
| Coluna            | Tipo         | Descrição                                      |
|-------------------|--------------|------------------------------------------------|
| ID_USUARIO        | NUMBER(10)   | PK/FK → FAV_TB_SILA_USUARIOS.ID_USUARIO        |
| CD_PRESTADOR      | NUMBER       | Código do prestador no MV (único)              |
| NM_PRESTADOR      | VARCHAR2(200)| Nome do prestador                              |
| DS_CONSELHO       | VARCHAR2(50) | Conselho profissional (CREFONO, CREFITO, CRM…) |
| DS_CODIGO_CONSELHO| VARCHAR2(30) | Número do registro no conselho                 |
| NM_TIP_PRESTA     | VARCHAR2(100)| Tipo de prestador (FONOAUDIÓLOGO(A), FISIOTERAPEUTA…) |
| DT_SINCRONIZACAO  | DATETIME     | Última sincronização com o MV                  |

> `NM_TIP_PRESTA` é usada para controle de acesso dos COORDENADORES e para exibição do módulo de Audiometria no frontend.

---

### 2.2 Tabelas de Controle de Acesso

#### `FAV_TB_PERFIS` — Perfis do sistema
| Coluna       | Tipo         | Descrição                        |
|--------------|--------------|----------------------------------|
| ID_PERFIL    | NUMBER(10)   | PK — Identificador único         |
| DS_PERFIL    | VARCHAR2(50) | Nome do perfil (ADMIN, OPERADOR…)|
| DS_DESCRICAO | VARCHAR2(500)| Descrição da finalidade          |
| FL_ATIVO     | NUMBER(1)    | 1=Ativo, 0=Inativo               |
| DT_CRIACAO   | DATE         | Data de criação                  |

---

#### `FAV_TB_PERMISSOES` — Permissões granulares
| Coluna       | Tipo         | Descrição                                       |
|--------------|--------------|-------------------------------------------------|
| ID_PERMISSAO | NUMBER(10)   | PK — Identificador único                        |
| CD_PERMISSAO | VARCHAR2(50) | Código único (ex: `PTS_CANCELAR`)               |
| DS_PERMISSAO | VARCHAR2(200)| Descrição legível (ex: "Cancelar PTS")          |
| DS_MODULO    | VARCHAR2(50) | Módulo: `PTS`, `AUDIOMETRIA`, `IMITANCIOMETRIA`, `ADMIN` |
| DS_TIPO      | VARCHAR2(20) | Tipo: `VISUALIZAR`, `CRIAR`, `EDITAR`, `DELETAR`, `CANCELAR` |
| FL_ATIVO     | NUMBER(1)    | 1=Ativo                                         |

---

#### `FAV_TB_PERFIS_PERMISSOES` — Relacionamento Perfil ↔ Permissão (N:N)
| Coluna              | Tipo       | Descrição                              |
|---------------------|------------|----------------------------------------|
| ID_PERFIL_PERMISSAO | NUMBER(10) | PK                                     |
| ID_PERFIL           | NUMBER(10) | FK → FAV_TB_PERFIS.ID_PERFIL           |
| ID_PERMISSAO        | NUMBER(10) | FK → FAV_TB_PERMISSOES.ID_PERMISSAO    |
| DT_CRIACAO          | DATE       | Data da associação                     |

---

#### `FAV_TB_MENUS` — Estrutura de menus por perfil
| Coluna       | Tipo         | Descrição                                        |
|--------------|--------------|--------------------------------------------------|
| ID_MENU      | NUMBER(10)   | PK                                               |
| NM_MENU      | VARCHAR2(100)| Nome do menu                                     |
| CD_ROTA      | VARCHAR2(255)| Rota do frontend (ex: `/pts/dashboard`)          |
| ID_MENU_PAI  | NUMBER(10)   | FK self-referencing — para submenus              |
| NR_ORDEM     | NUMBER(3)    | Ordem de exibição                                |
| ID_PERMISSAO | NUMBER(10)   | FK — permissão necessária para ver este menu     |
| FL_ATIVO     | NUMBER(1)    | 1=Ativo                                          |

---

#### `FAV_TB_COORD_ESP` — Especialidades dos Coordenadores
| Coluna          | Tipo         | Descrição                                         |
|-----------------|--------------|---------------------------------------------------|
| ID_COORD_ESP    | NUMBER(10)   | PK (sequence SEQ_COORD_ESP)                       |
| ID_USUARIO      | NUMBER(10)   | FK → FAV_TB_SILA_USUARIOS.ID_USUARIO              |
| DS_ESPECIALIDADE| VARCHAR2(100)| Nome da especialidade (ex: FISIOTERAPIA)          |
| DS_TIPO_PRESTA  | VARCHAR2(100)| Tipo do prestador no MV (ex: FISIOTERAPEUTA)      |
| CD_ESPECIALIDADE| VARCHAR2(20) | Código da especialidade (opcional)                |
| DT_INICIO       | DATE         | Início da coordenação                             |
| DT_FIM          | DATE         | Fim da coordenação (NULL = ativo)                 |
| FL_ATIVO        | NUMBER(1)    | 1=Ativo, 0=Inativo                                |

> Criada pelo script `05_criar_perfil_coordenador.sql`. Nome reduzido de `FAV_TB_COORDENADORES_ESPECIALIDADES` (35 chars) para `FAV_TB_COORD_ESP` (16 chars) por limitação Oracle (máx. 30 chars).

---

### 2.3 Tabela Principal de PTS

#### `FAV_TB_PTS` — Projetos Terapêuticos Singulares
| Coluna       | Tipo       | Relevante para acesso                          |
|--------------|------------|------------------------------------------------|
| ID_PTS       | NUMBER(10) | PK                                             |
| ID_USUARIO   | NUMBER(10) | FK → usuário que criou o PTS (**dono**)        |
| FL_FINALIZADO| NUMBER(1)  | 0=Rascunho, 1=Finalizado                       |
| FL_ATIVO     | NUMBER(1)  | 1=Ativo, 0=Cancelado                           |
| DS_VIGENCIA  | VARCHAR2   | Vigência semestral (ex: 2026-05)               |

---

## 3. Relacionamentos

```
FAV_TB_SILA_USUARIOS
  ├── ID_PERFIL ──────────────► FAV_TB_PERFIS
  │                               └── ID_PERFIL ──► FAV_TB_PERFIS_PERMISSOES
  │                                                    └── ID_PERMISSAO ──► FAV_TB_PERMISSOES
  │
  ├── ID_USUARIO ─────────────► FAV_TB_USUARIO_PRESTADOR
  │                               └── NM_TIP_PRESTA (usado pelo COORDENADOR)
  │
  ├── ID_USUARIO ─────────────► FAV_TB_COORD_ESP (apenas para COORDENADOR)
  │                               └── DS_TIPO_PRESTA ◄──── match ──► NM_TIP_PRESTA
  │
  └── ID_USUARIO ─────────────► FAV_TB_PTS (PTS criados pelo usuário)
```

---

## 4. Perfis do Sistema

| Perfil       | Descrição                                              | Visão de PTS            |
|--------------|--------------------------------------------------------|-------------------------|
| ADMIN        | Administrador — acesso completo ao sistema             | Todos os PTS            |
| SUPERVISOR   | Gerencia relatórios, usuários e auditoria              | Todos os PTS            |
| COORDENADOR  | Coordenador de especialidade — gerencia sua área       | PTS da sua especialidade |
| OPERADOR     | Profissional de saúde — acesso às próprias atividades  | Apenas os próprios PTS  |

> O perfil **VISUALIZADOR** existe na estrutura SQL mas não está em uso ativo no sistema atualmente.

---

## 5. Permissões por Módulo

### Módulo PTS
| Código              | Descrição                        | Tipo       |
|---------------------|----------------------------------|------------|
| `PTS_VISUALIZAR`    | Visualizar PTS                   | VISUALIZAR |
| `PTS_CRIAR`         | Criar novo PTS                   | CRIAR      |
| `PTS_EDITAR`        | Editar PTS                       | EDITAR     |
| `PTS_FINALIZAR`     | Finalizar PTS                    | EDITAR     |
| `PTS_CANCELAR`      | Cancelar PTS                     | DELETAR    |
| `PTS_IMPRIMIR`      | Imprimir PTS                     | VISUALIZAR |
| `PTS_DASHBOARD`     | Acessar Dashboard de PTS         | VISUALIZAR |

### Módulo Audiometria
| Código                  | Descrição               | Tipo       |
|-------------------------|-------------------------|------------|
| `AUDIOMETRIA_VISUALIZAR`| Visualizar Audiometria  | VISUALIZAR |
| `AUDIOMETRIA_CRIAR`     | Criar Audiometria       | CRIAR      |
| `AUDIOMETRIA_EDITAR`    | Editar Audiometria      | EDITAR     |
| `AUDIOMETRIA_DELETAR`   | Deletar Audiometria     | DELETAR    |

### Módulo Imitanciometria
| Código                      | Descrição                   | Tipo       |
|-----------------------------|-----------------------------|------------|
| `IMITANCIOMETRIA_VISUALIZAR`| Visualizar Imitanciometria  | VISUALIZAR |
| `IMITANCIOMETRIA_CRIAR`     | Criar Imitanciometria       | CRIAR      |
| `IMITANCIOMETRIA_EDITAR`    | Editar Imitanciometria      | EDITAR     |
| `IMITANCIOMETRIA_DELETAR`   | Deletar Imitanciometria     | DELETAR    |

### Módulo Admin
| Código               | Descrição                             | Tipo       |
|----------------------|---------------------------------------|------------|
| `ADMIN_ACESSO`       | Acessar painel administrativo         | VISUALIZAR |
| `USUARIOS_GERENCIAR` | Gerenciar usuários                    | EDITAR     |
| `PERFIS_GERENCIAR`   | Gerenciar perfis e permissões         | EDITAR     |
| `MENUS_GERENCIAR`    | Gerenciar menus por perfil            | EDITAR     |
| `AUDITORIA_VISUALIZAR`| Visualizar logs de auditoria         | VISUALIZAR |

---

## 6. Matriz de Perfis × Permissões

| Permissão                   | ADMIN | SUPERVISOR | COORDENADOR | OPERADOR |
|-----------------------------|:-----:|:----------:|:-----------:|:--------:|
| PTS_VISUALIZAR              | ✅    | ✅         | ✅          | ✅       |
| PTS_CRIAR                   | ✅    | ✅         | ✅          | ✅       |
| PTS_EDITAR                  | ✅    | ✅         | ✅          | ✅       |
| PTS_FINALIZAR               | ✅    | ✅         | ✅          | ✅       |
| PTS_CANCELAR                | ✅    | ❌         | ✅          | ✅ ¹     |
| PTS_IMPRIMIR                | ✅    | ✅         | ✅          | ✅       |
| PTS_DASHBOARD               | ✅    | ✅         | ✅          | ✅       |
| AUDIOMETRIA_VISUALIZAR      | ✅    | ✅         | ✅          | ✅       |
| AUDIOMETRIA_CRIAR           | ✅    | ✅         | ✅          | ✅       |
| AUDIOMETRIA_EDITAR          | ✅    | ✅         | ✅          | ✅       |
| AUDIOMETRIA_DELETAR         | ✅    | ❌         | ❌          | ❌       |
| IMITANCIOMETRIA_VISUALIZAR  | ✅    | ✅         | ✅          | ✅       |
| IMITANCIOMETRIA_CRIAR       | ✅    | ✅         | ✅          | ✅       |
| IMITANCIOMETRIA_EDITAR      | ✅    | ✅         | ✅          | ✅       |
| IMITANCIOMETRIA_DELETAR     | ✅    | ❌         | ❌          | ❌       |
| ADMIN_ACESSO                | ✅    | ✅         | ❌          | ❌       |
| USUARIOS_GERENCIAR          | ✅    | ✅         | ❌          | ❌       |
| PERFIS_GERENCIAR            | ✅    | ❌         | ❌          | ❌       |
| MENUS_GERENCIAR             | ✅    | ❌         | ❌          | ❌       |
| AUDITORIA_VISUALIZAR        | ✅    | ✅         | ✅          | ❌       |

> ¹ OPERADOR pode cancelar apenas **os próprios PTS** (validação por `id_usuario` no backend).

---

## 7. Coordenadores por Especialidade

Coordenadores visualizam todos os PTS criados por profissionais da sua especialidade, identificada pelo campo `NM_TIP_PRESTA` em `FAV_TB_USUARIO_PRESTADOR`.

| ID_USUARIO | Nome                                        | Especialidade  | DS_TIPO_PRESTA       |
|:----------:|---------------------------------------------|:--------------:|----------------------|
| 8          | WAGNER HENRIQUE DOS SANTOS                  | FISIOTERAPIA   | FISIOTERAPEUTA       |
| 3          | MONICA FRANCISCA M DOS SANTOS DOURADO       | FONOAUDIOLOGIA | FONOAUDIÓLOGO(A)     |
| 11         | CLAUDIA MARQUES DA SILVA                    | PSICOLOGIA     | PSICÓLOGO(A)         |
| 10         | JHONATAS DE OLIVEIRA SOARES DA SILVA        | PSICOPEDAGOGIA | PSICOPEDAGOGO(A)     |

**Como o filtro funciona no banco:**
```sql
-- Um COORDENADOR (ex: ID 3 - MONICA / FONOAUDIOLOGIA) vê PTS de usuários
-- cujo NM_TIP_PRESTA == DS_TIPO_PRESTA cadastrado em FAV_TB_COORD_ESP

SELECT COUNT(*) FROM FAV_TB_PTS p
WHERE EXISTS (
    SELECT 1
    FROM FAV_TB_COORD_ESP ce
    JOIN FAV_TB_USUARIO_PRESTADOR up
        ON UPPER(up.NM_TIP_PRESTA) = UPPER(ce.DS_TIPO_PRESTA)
    WHERE ce.ID_USUARIO = 3        -- ID do coordenador
      AND up.ID_USUARIO = p.ID_USUARIO
      AND ce.FL_ATIVO   = 1
);
```

---

## 8. Regras de Acesso — PTS

### 8.1 Visualização no Dashboard (`/dashboard/report` e `/dashboard/stats`)

| Perfil       | Regra de Visualização                                           |
|--------------|-----------------------------------------------------------------|
| ADMIN        | Vê todos os PTS do sistema                                      |
| SUPERVISOR   | Vê todos os PTS do sistema                                      |
| COORDENADOR  | Vê apenas PTS de profissionais da sua especialidade             |
| OPERADOR     | Vê apenas os próprios PTS (`WHERE p.ID_USUARIO = :id_usuario`)  |

### 8.2 Cancelamento de PTS (`POST /pts/{id_pts}/cancelar`)

> **Esta regra já está implementada e deve ser preservada em futuras manutenções.**

- **Todos os perfis com `PTS_CANCELAR`**: só podem cancelar PTS onde `FAV_TB_PTS.ID_USUARIO = usuário_logado`
- Validação no backend (arquivo `backend/app/api/v1/pts.py`):
  ```python
  if pts_db.id_usuario != user.id_usuario:
      raise HTTPException(status_code=403,
          detail="Apenas o profissional que criou este PTS pode cancelá-lo.")
  ```

### 8.3 Módulo de Exames Auditivos (Audiometria/Imitanciometria)

- Visível **apenas para FONOAUDIÓLOGO(A)**, identificado pelo campo `NM_TIP_PRESTA`
- Esta é uma regra por **especialidade**, não por perfil
- Validação no frontend (`Layout.tsx`): `usuario?.nm_tip_presta === 'FONOAUDIOLOGO(A)'`

---

## 9. Fluxo de Autenticação e Autorização

```
1. LOGIN
   ├── POST /api/v1/auth/token  (usuário/senha)
   └── Retorna JWT com { sub: nm_login }

2. AUTENTICAÇÃO (toda requisição)
   ├── Header: Authorization: Bearer <token>
   ├── decode_token(token) → extrai nm_login
   ├── get_by_login(db, nm_login) → carrega User do banco
   │     └── JOIN FAV_TB_PERFIS via id_perfil (lazy joined)
   └── user.perfil_nome → nome do perfil atual

3. AUTORIZAÇÃO (por endpoint)
   ├── require_perfis("ADMIN", "SUPERVISOR")  → bloqueia outros perfis (HTTP 403)
   └── _pts_access_filter(user) → adiciona filtro SQL conforme perfil

4. DADOS DO USUÁRIO NO FRONTEND
   ├── GET /api/v1/users/me → retorna User com ds_perfil = perfil_nome
   └── AuthContext expõe: isAdmin, isSupervisor, isCoordenador, isOperador, isGestor
```

---

## 10. Implementação Backend

### Arquivos envolvidos

| Arquivo                                     | Função                                                  |
|---------------------------------------------|---------------------------------------------------------|
| `app/db/models.py`                          | Models `Perfil`, `User` com relationship e `perfil_nome`|
| `app/dependencies.py`                       | `get_current_user()`, `require_perfis(*perfis)`         |
| `app/api/v1/pts.py`                         | `_pts_access_filter(user)` + endpoints com filtro       |
| `app/api/v1/users.py`                       | `_user_to_response()` usando `user.perfil_nome`         |
| `app/schemas/user.py`                       | `PerfilLiteral` com todos os perfis                     |

### `models.py` — Modelo Perfil
```python
class Perfil(Base):
    __tablename__ = "FAV_TB_PERFIS"
    id_perfil    = Column("ID_PERFIL",    Integer, primary_key=True)
    ds_perfil    = Column("DS_PERFIL",    String(20), nullable=False)
    ds_descricao = Column("DS_DESCRICAO", String(200))

class User(Base):
    # ... demais colunas ...
    id_perfil = Column("ID_PERFIL", Integer, ForeignKey("FAV_TB_PERFIS.ID_PERFIL"))
    perfil    = relationship("Perfil", lazy="joined")

    @property
    def perfil_nome(self) -> str:
        """FK como fonte de verdade; fallback para DS_PERFIL legado."""
        if self.perfil:
            return self.perfil.ds_perfil
        return self.ds_perfil or "OPERADOR"
```

### `dependencies.py` — Proteção de Endpoints por Perfil
```python
def require_perfis(*perfis: str):
    """Bloqueia (HTTP 403) se o perfil do usuário não estiver na lista."""
    def _check(user: User = Depends(get_current_user)) -> User:
        if user.perfil_nome not in perfis:
            raise HTTPException(status_code=403, detail="Acesso restrito.")
        return user
    return _check

# Exemplo de uso em um endpoint:
@router.delete("/admin/usuarios/{id}")
def remover_usuario(id: int, user: User = Depends(require_perfis("ADMIN"))):
    ...
```

### `pts.py` — Filtro de Dados por Perfil
```python
def _pts_access_filter(user: User) -> tuple[str, dict]:
    perfil = user.perfil_nome
    if perfil in ("ADMIN", "SUPERVISOR"):
        return "", {}
    if perfil == "COORDENADOR":
        extra_where = """
            AND EXISTS (
                SELECT 1 FROM FAV_TB_COORD_ESP ce
                JOIN FAV_TB_USUARIO_PRESTADOR up
                    ON UPPER(up.NM_TIP_PRESTA) = UPPER(ce.DS_TIPO_PRESTA)
                WHERE ce.ID_USUARIO = :coord_id
                  AND up.ID_USUARIO = p.ID_USUARIO
                  AND ce.FL_ATIVO   = 1
            )
        """
        return extra_where, {"coord_id": user.id_usuario}
    # OPERADOR
    return "AND p.ID_USUARIO = :op_id", {"op_id": user.id_usuario}
```

---

## 11. Implementação Frontend

### Arquivos envolvidos

| Arquivo                               | Função                                               |
|---------------------------------------|------------------------------------------------------|
| `src/types/auth.ts`                   | Tipo `Perfil` + interface `User`                     |
| `src/contexts/AuthContext.tsx`        | Helpers de perfil no contexto global                 |
| `src/components/Layout.tsx`           | Controle de menu por perfil/especialidade            |
| `src/components/ProtectedRoute.tsx`   | Proteção de rotas (autenticação)                     |

### `types/auth.ts`
```typescript
export type Perfil = 'ADMIN' | 'SUPERVISOR' | 'COORDENADOR' | 'OPERADOR'

export interface User {
  ds_perfil:   Perfil
  nm_tip_presta: string | null  // usado para controle de módulo Audiometria
  // ...
}
```

### `AuthContext.tsx` — Helpers Disponíveis
```typescript
const { isAdmin, isSupervisor, isCoordenador, isOperador, isGestor, perfil } = useAuth()
```

| Helper         | Valor `true` quando                        |
|----------------|--------------------------------------------|
| `isAdmin`      | `ds_perfil === 'ADMIN'`                    |
| `isSupervisor` | `ds_perfil === 'SUPERVISOR'`               |
| `isCoordenador`| `ds_perfil === 'COORDENADOR'`              |
| `isOperador`   | `ds_perfil === 'OPERADOR'`                 |
| `isGestor`     | ADMIN **ou** SUPERVISOR (visão global)     |
| `perfil`       | O valor do `Perfil` atual (ou `null`)      |

### `Layout.tsx` — Controle de Menu
```typescript
// Exames Auditivos: apenas FONOAUDIOLOGO(A)
const isFonoaudiologo = usuario?.nm_tip_presta === 'FONOAUDIOLOGO(A)'

// Dashboard PTS: rótulo diferente por perfil
label: isGestorOuCoordenador ? 'Dashboard PTS' : 'Meus PTS'
```

---

## 12. Scripts de Consulta Úteis

### Listar todos os usuários com seus perfis
```sql
SELECT
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.NM_USUARIO,
    COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE) AS ESPECIALIDADE,
    CASE
        WHEN u.ID_PERFIL IS NULL THEN 'SEM PERFIL'
        ELSE p.DS_PERFIL
    END AS PERFIL,
    u.FL_ATIVO,
    u.DT_CRIACAO
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
ORDER BY u.DT_CRIACAO DESC;
```

### Listar coordenadores e suas especialidades
```sql
SELECT
    u.ID_USUARIO,
    u.NM_USUARIO,
    ce.DS_ESPECIALIDADE,
    ce.DS_TIPO_PRESTA,
    ce.FL_ATIVO,
    (SELECT COUNT(*) FROM FAV_TB_PTS pts
     JOIN FAV_TB_USUARIO_PRESTADOR up2 ON up2.ID_USUARIO = pts.ID_USUARIO
     WHERE UPPER(up2.NM_TIP_PRESTA) = UPPER(ce.DS_TIPO_PRESTA)
       AND pts.FL_ATIVO = 1) AS QTD_PTS_VISIVEL
FROM FAV_TB_COORD_ESP ce
JOIN FAV_TB_SILA_USUARIOS u ON u.ID_USUARIO = ce.ID_USUARIO
ORDER BY ce.DS_ESPECIALIDADE;
```

### Verificar permissões de um perfil específico
```sql
SELECT
    p.DS_PERMISSAO,
    p.CD_PERMISSAO,
    p.DS_MODULO,
    p.DS_TIPO
FROM FAV_TB_PERFIS_PERMISSOES pp
JOIN FAV_TB_PERFIS pf ON pp.ID_PERFIL = pf.ID_PERFIL
JOIN FAV_TB_PERMISSOES p ON pp.ID_PERMISSAO = p.ID_PERMISSAO
WHERE pf.DS_PERFIL = 'OPERADOR'  -- trocar pelo perfil desejado
ORDER BY p.DS_MODULO, p.DS_TIPO;
```

### Contar PTS por perfil de criador
```sql
SELECT
    pf.DS_PERFIL,
    COUNT(pts.ID_PTS) AS TOTAL_PTS,
    SUM(CASE WHEN pts.FL_FINALIZADO = 1 AND pts.FL_ATIVO = 1 THEN 1 ELSE 0 END) AS FINALIZADOS,
    SUM(CASE WHEN pts.FL_FINALIZADO = 0 AND pts.FL_ATIVO = 1 THEN 1 ELSE 0 END) AS RASCUNHOS,
    SUM(CASE WHEN pts.FL_ATIVO = 0 THEN 1 ELSE 0 END) AS CANCELADOS
FROM FAV_TB_PTS pts
JOIN FAV_TB_SILA_USUARIOS u ON pts.ID_USUARIO = u.ID_USUARIO
LEFT JOIN FAV_TB_PERFIS pf ON u.ID_PERFIL = pf.ID_PERFIL
GROUP BY pf.DS_PERFIL
ORDER BY TOTAL_PTS DESC;
```

### Simular o filtro que o COORDENADOR usa no dashboard
```sql
-- Substitua :coord_id pelo ID_USUARIO do coordenador (ex: 3 = MONICA/FONOAUDIOLOGIA)
SELECT
    pts.ID_PTS,
    u.NM_USUARIO AS AUTOR,
    up.NM_TIP_PRESTA,
    ce.DS_ESPECIALIDADE AS COORD_ESPECIALIDADE,
    pts.FL_FINALIZADO,
    pts.FL_ATIVO
FROM FAV_TB_PTS pts
JOIN FAV_TB_SILA_USUARIOS u ON u.ID_USUARIO = pts.ID_USUARIO
JOIN FAV_TB_USUARIO_PRESTADOR up ON up.ID_USUARIO = pts.ID_USUARIO
JOIN FAV_TB_COORD_ESP ce
    ON ce.ID_USUARIO = :coord_id
    AND UPPER(up.NM_TIP_PRESTA) = UPPER(ce.DS_TIPO_PRESTA)
    AND ce.FL_ATIVO = 1
WHERE pts.FL_ATIVO = 1
ORDER BY pts.DT_CRIACAO DESC;
```

### Verificar se existe usuário sem perfil
```sql
SELECT COUNT(*) AS USUARIOS_SEM_PERFIL
FROM FAV_TB_SILA_USUARIOS
WHERE ID_PERFIL IS NULL AND FL_ATIVO = 1;
```

---

## 13. Scripts de Manutenção

### Atribuir um perfil a um usuário
```sql
-- Alterar perfil de um usuário específico
BEGIN
    UPDATE FAV_TB_SILA_USUARIOS
    SET ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'OPERADOR')
    WHERE ID_USUARIO = :id_usuario;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('✓ Perfil atualizado para ID_USUARIO = ' || :id_usuario);
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('✗ Erro: ' || SQLERRM);
END;
/
```

### Adicionar especialidade a um coordenador
```sql
BEGIN
    INSERT INTO FAV_TB_COORD_ESP (ID_USUARIO, DS_ESPECIALIDADE, DS_TIPO_PRESTA, FL_ATIVO)
    VALUES (:id_usuario, 'FONOAUDIOLOGIA', 'FONOAUDIÓLOGO(A)', 1);
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('✓ Especialidade adicionada');
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('✗ Erro: ' || SQLERRM);
END;
/
```

### Remover especialidade de um coordenador
```sql
BEGIN
    UPDATE FAV_TB_COORD_ESP
    SET FL_ATIVO = 0, DT_FIM = SYSDATE
    WHERE ID_USUARIO = :id_usuario
      AND DS_ESPECIALIDADE = :ds_especialidade;
    COMMIT;
END;
/
```

### Adicionar nova permissão a um perfil
```sql
BEGIN
    INSERT INTO FAV_TB_PERFIS_PERMISSOES (ID_PERFIL, ID_PERMISSAO)
    SELECT
        (SELECT ID_PERFIL   FROM FAV_TB_PERFIS   WHERE DS_PERFIL   = :ds_perfil),
        (SELECT ID_PERMISSAO FROM FAV_TB_PERMISSOES WHERE CD_PERMISSAO = :cd_permissao)
    FROM DUAL
    WHERE NOT EXISTS (
        SELECT 1 FROM FAV_TB_PERFIS_PERMISSOES pp
        JOIN FAV_TB_PERFIS pf ON pp.ID_PERFIL = pf.ID_PERFIL
        JOIN FAV_TB_PERMISSOES per ON pp.ID_PERMISSAO = per.ID_PERMISSAO
        WHERE pf.DS_PERFIL = :ds_perfil AND per.CD_PERMISSAO = :cd_permissao
    );
    COMMIT;
END;
/
```

---

## 14. Observações Importantes

### Regras já implementadas — não alterar sem análise

1. **Cancelamento de PTS por proprietário**
   - Endpoint: `POST /pts/{id_pts}/cancelar`
   - Regra: **qualquer perfil** com `PTS_CANCELAR` só pode cancelar PTS onde `ID_USUARIO = usuário_logado`
   - Arquivo: `backend/app/api/v1/pts.py` — método `cancelar_pts()`

2. **Módulo de Audiometria restrito a Fonoaudiólogos**
   - Controle feito pelo campo `NM_TIP_PRESTA` do prestador MV, **não** pelo perfil
   - Visível apenas para `NM_TIP_PRESTA = 'FONOAUDIOLOGO(A)'`

3. **Sincronização automática com MV no login**
   - Ao logar, o sistema busca dados do prestador no sistema MV e sincroniza `FAV_TB_USUARIO_PRESTADOR`
   - Garante que `NM_TIP_PRESTA` esteja sempre atualizado

### Convenção de nomenclatura Oracle
- Nomes de tabelas/colunas: máximo **30 caracteres** no Oracle 11g/12c
- A tabela `FAV_TB_COORD_ESP` foi criada com nome reduzido exatamente por essa limitação (`FAV_TB_COORDENADORES_ESPECIALIDADES` = 35 chars — **inválido**)

### Coluna DS_PERFIL legada
- Existe em `FAV_TB_SILA_USUARIOS` por compatibilidade histórica
- **Não é atualizada automaticamente** quando `ID_PERFIL` é alterado
- O backend usa `user.perfil_nome` que prioriza `ID_PERFIL → FAV_TB_PERFIS.DS_PERFIL`
- Para usuários com `ID_PERFIL = NULL`, o fallback é `DS_PERFIL`

### Scripts de inicialização (ordem de execução)
| Script                               | Descrição                                                 |
|--------------------------------------|-----------------------------------------------------------|
| `01_schema_and_data.sql`             | Schema principal e dados base                             |
| `02_add_nr_per_freq.sql`             | Adição de colunas NR por frequência                       |
| `03_controle_acesso.sql`             | Criação de tabelas de perfis, permissões e menus          |
| `04_adicionar_pts_cancelar.sql`      | Permissão PTS_CANCELAR ao perfil OPERADOR                 |
| `05_criar_perfil_coordenador.sql`    | Perfil COORDENADOR + tabela FAV_TB_COORD_ESP              |
| `06_adicionar_pollyanna_coordenador.sql` | ⚠️ Descontinuado — uso incorreto. Ver 07 e 08         |
| `07_reverter_pollyanna.sql`          | Reverte mudanças incorretas do script 06                  |
| `08_adicionar_pollyanna_supervisor.sql` | POLLYANNA (ID 13) → perfil SUPERVISOR               |
| `09_adicionar_sem_perfil_como_operador.sql` | Migra todos SEM PERFIL → OPERADOR              |

---

*Documentação gerada em 21/05/2026 — CDM Sistema de Documentação Multidisciplinar*
