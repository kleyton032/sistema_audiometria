# Estratégia de Controle de Acesso - Sistema de PTS

**Data:** 21 de maio de 2026  
**Status:** Planejamento e Validação  
**Objetivo:** Definir e estruturar perfis de acesso granulares baseados em especialidade e função

---

## 1. Visão Geral dos Perfis

### Perfil: ADMIN (Administrador)
**Acesso:** Completo a todos os módulos e funcionalidades
- ✅ Painel Administrativo
- ✅ Gestão de Usuários e Perfis
- ✅ PTS (visualizar todos, independente de especialidade)
- ✅ Exames Auditivos (Audiometria, Imitanciometria)
- ✅ Relatórios e Auditoria
- ✅ Configurações do Sistema

**Permissões Chave:**
- `PTS_VISUALIZAR_TODOS`
- `PTS_CRIAR`
- `PTS_EDITAR`
- `PTS_DELETAR`
- `EXAMES_ACESSO_COMPLETO`
- `ADMIN_PAINEL`

**Usuários Iniciais:** TBD (Validar na análise)

---

### Perfil: SUPERVISOR (Coordenador/Gestor)
**Acesso:** Gestão por especialidade + visualização de relatórios
- ✅ PTS da especialidade sob sua coordenação
- ✅ Todos os atendimentos da especialidade
- ✅ Relatórios gerenciais
- ⚠️ Sem acesso a outras especialidades
- ⚠️ Painel administrativo limitado

**Permissões Chave:**
- `PTS_VISUALIZAR_ESPECIALIDADE` (restrito por especialidade)
- `PTS_CRIAR`
- `PTS_EDITAR`
- `RELATORIOS_ESPECIALIDADE`
- `USUARIOS_VISUALIZAR_ESPECIALIDADE`

**Identificação:** Usuários com cargo contendo "COORDENADOR", "GESTOR", "SUPERVISOR"

**Especialidades Cobertas:**
- Fisioterapia (Coordenador de Fisioterapia)
- Psicologia (Coordenador de Psicologia)
- Fonoaudiologia (Coordenador de Fonoaudiologia)
- Oftalmologia (Coordenador de Oftalmologia)
- Etc.

---

### Perfil: OPERADOR (Profissional Assistencial)
**Acesso:** PTS dos seus atendimentos + Exames (conforme especialidade)
- ✅ Criar PTS
- ✅ Visualizar PTS dos seus atendimentos
- ✅ Editar PTS que criou ou participa
- ✅ Exames auditivos (apenas Fonoaudiólogos)
- ⚠️ Sem visualização de PTS de outras especialidades
- ⚠️ Sem painel administrativo

**Permissões Chave:**
- `PTS_VISUALIZAR_PROPRIOS` (apenas atendimentos do usuário)
- `PTS_CRIAR`
- `PTS_EDITAR_PROPRIOS`
- `EXAMES_AUDIOMETRIA` (apenas Fonoaudiólogos)

**Usuários:** Fisioterapeutas, Psicólogos, Fonoaudiólogos, Oftalmologistas, Educadores

---

### Perfil: VISUALIZADOR (Profissional com Acesso Limitado)
**Acesso:** Apenas leitura de PTS dos seus atendimentos
- ✅ Visualizar PTS dos seus atendimentos
- ⚠️ Sem criar PTS
- ⚠️ Sem editar PTS
- ⚠️ Sem painel administrativo

**Permissões Chave:**
- `PTS_VISUALIZAR_PROPRIOS` (apenas leitura)

**Usuários:** Profissionais em período de treinamento ou acesso limitado

---

## 2. Mapeamento: Especialidade → Perfil

### Tabela de Atribuição

| Especialidade | Padrão | Coordenador | Notas |
|---|---|---|---|
| FISIOTERAPIA | OPERADOR | SUPERVISOR | Coordenador vê todos da fisio |
| PSICOLOGIA | OPERADOR | SUPERVISOR | Coordenador vê todos da psicologia |
| FONOAUDIOLOGIA | OPERADOR + AUDIOMETRIA | SUPERVISOR | OPERADOR tem acesso a exames auditivos |
| OFTALMOLOGIA | OPERADOR | SUPERVISOR | Coordenador vê todos da oftalmologia |
| EDUCAÇÃO | OPERADOR | SUPERVISOR | Educadores também podem acessar PTS |
| PEDAGOGIA | OPERADOR | SUPERVISOR | Pedagogos também podem acessar PTS |
| ADMIN / GESTOR | ADMIN | - | Acesso completo |
| DIRETOR | ADMIN | - | Acesso completo |
| COORDENADOR | SUPERVISOR | - | Já são supervisores |

---

## 3. Fluxo de Acesso ao Módulo PTS

```
Usuário Acessa Sistema
    ↓
[MENU] PTS aparece?
    ├─ SIM se: FL_ATIVO = 1 E usuário tem permissão PTS_* 
    ├─ NÃO se: Sem permissão de PTS
    ↓
Clica em PTS
    ↓
[LISTA] Quais PTS aparecem?
    ├─ ADMIN: Todos os PTS do sistema
    ├─ SUPERVISOR: Todos os PTS da especialidade
    ├─ OPERADOR: PTS dos seus atendimentos
    ├─ VISUALIZADOR: PTS dos seus atendimentos (leitura)
    ↓
Clica em PTS específico
    ↓
[DETALHES] Pode editar?
    ├─ ADMIN: SIM (sempre)
    ├─ SUPERVISOR: SIM (é gestor)
    ├─ OPERADOR: SIM se é criador ou participa
    ├─ VISUALIZADOR: NÃO (apenas leitura)
```

---

## 4. Estrutura de Permissões por Módulo

### Módulo: PTS
| Permissão | Código | Descrição | Perfis |
|---|---|---|---|
| Visualizar Todos | `PTS_VISUALIZAR_TODOS` | Ver todos os PTS do sistema | ADMIN |
| Visualizar Especialidade | `PTS_VISUALIZAR_ESPECIALIDADE` | Ver PTS da especialidade | SUPERVISOR |
| Visualizar Próprios | `PTS_VISUALIZAR_PROPRIOS` | Ver PTS dos atendimentos próprios | OPERADOR, VISUALIZADOR |
| Criar | `PTS_CRIAR` | Criar novo PTS | ADMIN, SUPERVISOR, OPERADOR |
| Editar Todos | `PTS_EDITAR_TODOS` | Editar qualquer PTS | ADMIN |
| Editar Especialidade | `PTS_EDITAR_ESPECIALIDADE` | Editar PTS da especialidade | SUPERVISOR |
| Editar Próprios | `PTS_EDITAR_PROPRIOS` | Editar PTS que criou ou participa | OPERADOR |
| Deletar | `PTS_DELETAR` | Deletar/Cancelar PTS | ADMIN, SUPERVISOR |
| Gerar Relatório | `PTS_RELATORIO` | Gerar relatórios de PTS | ADMIN, SUPERVISOR, OPERADOR |

### Módulo: EXAMES
| Permissão | Código | Descrição | Perfis |
|---|---|---|---|
| Audiometria | `EXAMES_AUDIOMETRIA` | Criar/Editar audiometrias | OPERADOR (Fonoaudiólogo) |
| Imitanciometria | `EXAMES_IMITANCIOMETRIA` | Criar/Editar imitanciometrias | OPERADOR (Fonoaudiólogo) |
| Acesso Completo | `EXAMES_ACESSO_COMPLETO` | Visualizar todos os exames | ADMIN |

### Módulo: ADMIN
| Permissão | Código | Descrição | Perfis |
|---|---|---|---|
| Painel Admin | `ADMIN_PAINEL` | Acessar dashboard administrativo | ADMIN |
| Gerenciar Usuários | `ADMIN_USUARIOS` | Criar/Editar/Deletar usuários | ADMIN |
| Gerenciar Perfis | `ADMIN_PERFIS` | Criar/Editar perfis | ADMIN |
| Gerenciar Permissões | `ADMIN_PERMISSOES` | Associar permissões | ADMIN |
| Auditoria | `ADMIN_AUDITORIA` | Visualizar logs | ADMIN |

---

## 5. Identificação de Coordenadores por Especialidade

### Critérios de Identificação

Um usuário é coordenador se:
- Nome de usuário OU especialidade contém: "COORDENADOR", "GESTOR", "SUPERVISOR", "DIRETOR"
- OU cargo no campo `DS_ESPECIALIDADE` = "Coordenador [Especialidade]"
- OU tipo de prestador = "Coordenador [Especialidade]"

### Query de Identificação (executar primeiro)

```sql
-- Identifica potenciais coordenadores
SELECT 
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.NM_USUARIO,
    COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE) AS ESPECIALIDADE,
    CASE 
        WHEN UPPER(u.NM_USUARIO) LIKE '%COORD%' THEN 'Sim (Nome)'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%COORD%' THEN 'Sim (Especialidade)'
        WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%COORD%' THEN 'Sim (Tipo Prestador)'
        ELSE 'Não'
    END AS EH_COORDENADOR
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
WHERE u.FL_ATIVO = 1
ORDER BY EH_COORDENADOR DESC, ESPECIALIDADE;
```

---

## 6. Processo de Implementação

### Fase 1: Análise (EXECUTAR AGORA)

1. Execute Query 1: Ver todos os perfis existentes
2. Execute Query 2: Ver permissões por perfil
3. Execute Query 3: Ver usuários sem perfil atribuído
4. Execute Query 4: Ver coordenadores identificados
5. Execute Query 5: Ver visão consolidada com perfil sugerido
6. **VALIDAR** com gestor/administrador

### Fase 2: Ajustes nos Perfis

Se necessário:
- Criar novos perfis (ex: "SUPERVISOR_FISIO", "SUPERVISOR_PSICO")
- Remover perfis não utilizados
- Redefinir permissões de perfis existentes

### Fase 3: Atribuição Manual (após validação)

1. Identifique ADMINs → Atribua perfil ADMIN
2. Identifique COORDENADOREs → Atribua perfil SUPERVISOR
3. Profissionais assistenciais → Atribua OPERADOR ou VISUALIZADOR
4. **Para cada update:** Valide com o gestor

### Fase 4: Implementação Backend

- Modificar `dependencies.py` para usar perfis/permissões
- Validar acesso em endpoints (PTS, Exames, Admin)
- Implementar filtros de dados por perfil

### Fase 5: Testes

- Testar cada perfil em cada módulo
- Validar PTS por especialidade
- Validar exames auditivos

---

## 7. Scripts de Atualização (APÓS VALIDAÇÃO)

### Template: Atribuir ADMIN
```sql
UPDATE FAV_TB_SILA_USUARIOS
SET ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'ADMIN')
WHERE ID_USUARIO = :USER_ID; -- Substituir USER_ID
COMMIT;
```

### Template: Atribuir SUPERVISOR por Especialidade
```sql
UPDATE FAV_TB_SILA_USUARIOS u
SET u.ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'SUPERVISOR')
WHERE u.ID_USUARIO IN (
    SELECT u2.ID_USUARIO FROM FAV_TB_SILA_USUARIOS u2
    LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u2.ID_USUARIO = up.ID_USUARIO
    WHERE UPPER(COALESCE(up.NM_TIP_PRESTA, u2.DS_ESPECIALIDADE)) LIKE '%COORD%'
      AND u2.FL_ATIVO = 1
);
COMMIT;
```

### Template: Atribuir OPERADOR por Especialidade
```sql
UPDATE FAV_TB_SILA_USUARIOS u
SET u.ID_PERFIL = (
    CASE 
        WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%FONOAUDIO%' THEN 
            (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'OPERADOR')
        ELSE
            (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'OPERADOR')
    END
)
WHERE u.ID_USUARIO IN (
    SELECT u2.ID_USUARIO FROM FAV_TB_SILA_USUARIOS u2
    LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u2.ID_USUARIO = up.ID_USUARIO
    WHERE u2.ID_PERFIL IS NULL
      AND u2.FL_ATIVO = 1
      AND UPPER(up.NM_TIP_PRESTA) NOT LIKE '%COORD%'
);
COMMIT;
```

---

## 8. Estrutura Final do Menu

Todos os perfis verão **PTS no menu**, mas com filtros diferentes:

```
Menu Principal
├─ PTS
│  └─ [Acesso conforme perfil]
│     ├─ ADMIN: Ver todos
│     ├─ SUPERVISOR: Ver especialidade
│     ├─ OPERADOR: Ver próprios atendimentos
│     ├─ VISUALIZADOR: Ver próprios (read-only)
├─ Exames Auditivos
│  └─ [Apenas Fonoaudiólogos com OPERADOR ou ADMIN]
├─ Painel Admin
│  └─ [Apenas ADMIN]
└─ Relatórios
   └─ [Conforme especialidade]
```

---

## 9. Próximos Passos

1. **Hoje:** Executar as 5 queries de análise
2. **Hoje:** Revisar resultados com gestor
3. **Amanhã:** Definir lista exata de usuários → perfis
4. **Amanhã:** Executar updates validados
5. **Depois:** Implementar validações no backend
6. **Depois:** Testar cada perfil

---

## 10. Perguntas a Responder

Antes de prosseguir, confirme:

- [ ] Quem são os ADMINs do sistema?
- [ ] Quem são os COORDENADOREs por especialidade?
- [ ] Fonoaudiólogos devem ter acesso automático a exames auditivos?
- [ ] OPERADOR pode editar apenas PTS que criou ou participa?
- [ ] Pode haver SUPERVISOR sem especialidade (gestor geral)?
- [ ] VISUALIZADOR precisa ser criado ou todos são OPERADOR?

---

**Aguardando feedback para prosseguir com a análise!**
