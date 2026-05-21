# ✅ Implementação RBAC - Checklist de Progresso

## 📅 Situação Atual: 21 de maio de 2026

---

## 🔧 FASE 1: Preparação Técnica

### Criação de Artefatos
- [x] Script SQL revisado: `03_controle_acesso.sql`
  - [x] Tabelas RBAC criadas (Perfis, Permissões, Menus, etc.)
  - [x] Perfis padrão definidos (4 tipos)
  - [x] Permissões granulares criadas (20+)
  - [x] Relacionamentos configurados
  - [x] ❌ Atualização em massa REMOVIDA
  - [x] ✅ Queries de análise ADICIONADAS

### Documentação Técnica
- [x] `PROCESSO_ATRIBUICAO_PERFIS.md` (criado)
  - [x] Regras de negócio documentadas
  - [x] Matriz de classificação incluída
  - [x] Troubleshooting completo
  - [x] Exemplos de UPDATE seguro

- [x] `queries_manutencao_acesso.sql` (criado)
  - [x] 40+ queries prontas
  - [x] 8 seções temáticas
  - [x] Templates de UPDATE
  - [x] Relatórios e auditoria

- [x] `PROXIMOS_PASSOS.md` (criado)
  - [x] 8 passos práticos
  - [x] Estimativas de tempo
  - [x] Checklists por fase
  - [x] Plano de rollback

- [x] `RBAC_SUMARIO_EXECUTIVO.md` (criado)
  - [x] Visão geral para decisores
  - [x] Regras de negócio resumidas
  - [x] Como começar agora

---

## 📊 FASE 2: Análise de Dados (PENDENTE)

### Levantamento
- [ ] Executar script `03_controle_acesso.sql` no Oracle
- [ ] Verificar criação de tabelas (4 perfis, 20 permissões, 7 menus)
- [ ] Executar Query 1 (todos os usuários com especialidades)
- [ ] Exportar resultado em Excel

### Exploração
- [ ] Executar Query 2 (usuários sem perfil - prioritários)
- [ ] Executar Query 3 (agrupamento por especialidade)
- [ ] Executar Query 4 (sugestão de perfis)
- [ ] Analisar padrões e exceções

### Documentação
- [ ] Criar arquivo `levantamento_usuarios_[DATA].xlsx` com dados exportados
- [ ] Documentar especialidades identificadas
- [ ] Listar possíveis coordenadores
- [ ] Anotar exceções/casos especiais

---

## 👥 FASE 3: Análise com Gestor (PENDENTE)

### Reunião de Alinhamento
- [ ] Apresentar dados levantados ao gestor
- [ ] Discutir distribuição de perfis por especialidade
- [ ] Identificar coordenadores por especialidade
- [ ] Validar casos especiais/exceções

### Validação de Regras
- [ ] Confirmar que PTS está acessível para todos (regra #1)
- [ ] Confirmar que Audiometria é só para fonoaudiólogos (regra #2)
- [ ] Confirmar restrição do Admin a admins/gestores (regra #3)
- [ ] Confirmar filtro por especialidade para coordenadores (regra #4)

### Aprovação
- [ ] [ ] Obter aprovação do gestor escrita/verbal
- [ ] [ ] Documentar decisões tomadas
- [ ] [ ] Preparar matriz final de atribuição de perfis

---

## 🛠️ FASE 4: Preparação de Scripts (PENDENTE)

### Testes Locais
- [ ] Criar arquivo `updates_fonoaudios.sql` (template do seu banco)
- [ ] Criar arquivo `updates_fisios.sql`
- [ ] Criar arquivo `updates_psicos.sql`
- [ ] Criar arquivo `updates_coordenadores.sql`
- [ ] Criar arquivo `updates_admins.sql`

### Validação de Scripts
- [ ] Revisar cada script com colega
- [ ] Testar Query de validação ANTES em cada script
- [ ] Testar Query de validação DEPOIS em cada script
- [ ] Documentar e-mail de aprovação

### Plano de Rollback
- [ ] Documentar comando de rollback para cada grupo
- [ ] Testar rollback em ambiente de dev (se disponível)
- [ ] Preparar lista de contatos para emergência

---

## 🧪 FASE 5: Testes em Desenvolvimento (PENDENTE)

### Teste de Ambiente
- [ ] Conectar ao banco de dev/teste
- [ ] Executar `03_controle_acesso.sql` (se ainda não feito)
- [ ] Verificar criação de tabelas e dados

### Teste de Scripts de Update
- [ ] Executar script de FONOAUDIÓLOGOS
- [ ] Validar com Query de contagem
- [ ] Verificar se perfis foram atribuídos corretamente
- [ ] Rollback se houver problema

- [ ] Executar script de FISIOTERAPEUTAS
- [ ] Validar com Query de contagem
- [ ] Verificar se perfis foram atribuídos corretamente
- [ ] Rollback se houver problema

- [ ] Executar script de PSICÓLOGOS
- [ ] Validar com Query de contagem
- [ ] Verificar se perfis foram atribuídos corretamente
- [ ] Rollback se houver problema

- [ ] Executar script de COORDENADORES
- [ ] Validar com Query de contagem
- [ ] Verificar se perfis foram atribuídos corretamente
- [ ] Rollback se houver problema

- [ ] Executar script de ADMINS
- [ ] Validar com Query de contagem
- [ ] Verificar se perfis foram atribuídos corretamente
- [ ] Rollback se houver problema

### Validação Final de Teste
- [ ] Executar Query de "Status Geral do Sistema"
- [ ] Verificar % de usuários com perfil
- [ ] Verificar distribuição por especialidade
- [ ] Documentar resultados

---

## ✅ FASE 6: Aprovação Final (PENDENTE)

### Checklist de Go/No-Go
- [ ] Testes em dev foram bem-sucedidos
- [ ] Scripts foram revisados e aprovados
- [ ] Gestor aprovou a implementação
- [ ] Plano de rollback está pronto
- [ ] Data/hora de execução definida
- [ ] Comunicação aos usuários preparada
- [ ] Responsável técnico identificado

### Comunicação
- [ ] Enviar e-mail de aviso aos usuários (24h antes)
- [ ] Preparar FAQ para dúvidas
- [ ] Definir canal de suporte para problema
- [ ] Ter backup recente confirmado

---

## 🚀 FASE 7: Implementação em Produção (PENDENTE)

### Preparação
- [ ] Confirmar backup de produção realizado
- [ ] Confirmar horário de menor uso
- [ ] Ter todos os scripts preparados
- [ ] Ter terminal/SQL Developer aberto e testado

### Execução Faseada

#### Fase 7.1: Fonoaudiólogos (OPERADOR)
- [ ] Executar script
- [ ] Validar com Query ANTES
- [ ] Validar com Query DEPOIS
- [ ] Confirmar sucesso no log

#### Fase 7.2: Fisioterapeutas (OPERADOR)
- [ ] Executar script
- [ ] Validar com Query ANTES
- [ ] Validar com Query DEPOIS
- [ ] Confirmar sucesso no log

#### Fase 7.3: Psicólogos (OPERADOR)
- [ ] Executar script
- [ ] Validar com Query ANTES
- [ ] Validar com Query DEPOIS
- [ ] Confirmar sucesso no log

#### Fase 7.4: Coordenadores (SUPERVISOR)
- [ ] Executar script
- [ ] Validar com Query ANTES
- [ ] Validar com Query DEPOIS
- [ ] Confirmar sucesso no log

#### Fase 7.5: Administradores (ADMIN)
- [ ] Executar script
- [ ] Validar com Query ANTES
- [ ] Validar com Query DEPOIS
- [ ] Confirmar sucesso no log

### Monitoramento Pós-Execução
- [ ] Verificar logs do banco
- [ ] Receber feedback de usuários
- [ ] Ter responsável monitorando por 1 hora
- [ ] Documentar qualquer anomalia

---

## 📋 FASE 8: Validação Pós-Implantação (PENDENTE)

### Testes de Acesso com Usuários Reais
- [ ] [ ] Fonoaudiólogo consegue acessar Audiometria: **✅ Esperado**
- [ ] [ ] Fonoaudiólogo consegue acessar Imitanciometria: **✅ Esperado**
- [ ] [ ] Fisioterapeuta consegue acessar PTS: **✅ Esperado**
- [ ] [ ] Fisioterapeuta NÃO consegue acessar Audiometria: **✅ Esperado**
- [ ] [ ] Coordenador consegue acessar Admin: **✅ Esperado**
- [ ] [ ] Operador NÃO consegue acessar Admin: **✅ Esperado**
- [ ] [ ] Visualizador consegue ver mas não editar: **✅ Esperado**

### Queries de Validação
- [ ] Executar Query de "Distribuição de Perfis"
- [ ] Executar Query de "Usuários sem Perfil" (deve estar vazia)
- [ ] Executar Query de "Status Geral do Sistema"
- [ ] Exportar relatório em PDF/Excel

### Documentação Final
- [ ] [ ] Resumir resultados em documento
- [ ] [ ] Listar usuários que ainda precisam de ajustes
- [ ] [ ] Documentar tempo total de implementação
- [ ] [ ] Arquivar logs de execução

---

## 📊 Resumo de Progresso

```
FASE 1 - Preparação Técnica ........................ ✅ 100% CONCLUÍDO
FASE 2 - Análise de Dados ......................... ⏳ 0% PENDENTE
FASE 3 - Análise com Gestor ....................... ⏳ 0% PENDENTE
FASE 4 - Preparação de Scripts .................... ⏳ 0% PENDENTE
FASE 5 - Testes em Desenvolvimento ............... ⏳ 0% PENDENTE
FASE 6 - Aprovação Final .......................... ⏳ 0% PENDENTE
FASE 7 - Implementação em Produção ............... ⏳ 0% PENDENTE
FASE 8 - Validação Pós-Implantação .............. ⏳ 0% PENDENTE

TOTAL GERAL: 12,5% CONCLUÍDO
```

---

## ⏱️ Estimativa de Tempo Restante

| Fase | Tempo | Categoria |
|------|-------|-----------|
| Fase 2 | 45 min | Técnico |
| Fase 3 | 2 horas | Decisão |
| Fase 4 | 30 min | Técnico |
| Fase 5 | 1 hora | Testes |
| Fase 6 | 15 min | Decisão |
| Fase 7 | 45 min | Execução |
| Fase 8 | 30 min | Validação |
| **TOTAL** | **5h 15min** | **Prazo Total** |

---

## 🎯 Próximo Checkpoint

### Data Alvo: 
**[ ] Definir com gestor**

### O que precisa estar pronto antes:
1. [ ] Levantamento de dados completo (Fase 2)
2. [ ] Análise com gestor concluída (Fase 3)
3. [ ] Scripts de update preparados e revisados (Fase 4)
4. [ ] Testes em dev bem-sucedidos (Fase 5)

---

## 📞 Contatos e Responsáveis

| Função | Nome | Telefone | E-mail |
|--------|------|----------|--------|
| Responsável Técnico | [ ] | [ ] | [ ] |
| Gestor/Aprovador | [ ] | [ ] | [ ] |
| Suporte em Emergência | [ ] | [ ] | [ ] |
| Backup/Recovery | [ ] | [ ] | [ ] |

---

## 🆘 Plano de Rollback Rápido

```sql
-- SE ALGO DER ERRADO, EXECUTE:
UPDATE FAV_TB_SILA_USUARIOS
SET ID_PERFIL = NULL
WHERE ID_PERFIL IS NOT NULL;
COMMIT;

-- Isso remove TODOS os perfis atribuídos
-- Você pode reaplicar corretamente depois
```

---

## 📝 Notas e Anotações

```
[ ] Espaço para anotações durante a implementação


[ ]

[ ]

[ ]

[ ]
```

---

**Versão:** 1.0  
**Última atualização:** 21 de maio de 2026  
**Próxima revisão:** Após Fase 2 (Análise de Dados)

---

### 🎓 Dica Final

**Imprima este checklist** e mantenha com você durante a implementação. Marque cada item conforme progride. Isso ajuda a:
- ✅ Não esquecer nenhuma etapa
- ✅ Rastrear progresso
- ✅ Ter registro de o que foi feito
- ✅ Facilitar troubleshooting se necessário

**Boa sorte! 🚀**
