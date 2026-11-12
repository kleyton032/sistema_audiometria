# Scripts de Banco de Dados (`backend/scripts-db/`)

Conjunto de scripts SQL do projeto, organizados por finalidade.

## Estrutura

- **`migrations/`** — Migrações de schema (DDL/DML estrutural). Devem ser executadas **uma única vez**, na ordem numérica.
- **`seeds/`** — Cargas de dados de catálogo (diagnósticos, objetivos, etc.), agrupadas por área.
- **`fixes/`** — Correções pontuais já aplicadas (histórico).
- **`queries/`** — Consultas utilitárias/manuais (somente leitura).

## Convenção

- Nome de migração: `NNN_descricao.sql` (3 dígitos, sequencial).
- Novos scripts de dados/carga vão em `seeds/<area>/`.
- Correções one-off vão em `fixes/`.
- Consultas manuais vão em `queries/`.

## Ordem de execução das migrações

1. `001_schema_and_data.sql`
2. `002_add_nr_per_freq.sql`
3. `003_controle_acesso.sql`
4. `004_adicionar_pts_cancelar.sql`
5. `005_analise_acesso_pts.sql`
6. `006_criar_perfil_coordenador.sql`
7. `007_templates_atualizacao_perfis.sql`
8. `008_adicionar_pollyanna_coordenador.sql`
9. `009_reverter_pollyanna.sql`
10. `010_adicionar_pollyanna_supervisor.sql`
11. `011_adicionar_sem_perfil_como_operador.sql`
12. `012_fix_uq_pts_cancelado.sql`
13. `013_remove_ds_perfil_check_constraint.sql`
14. `014_add_750_1500_hz.sql`
15. `015_add_perfil_consulta.sql`
16. `016_psicologia_pafe.sql`
17. `017_update_pafe_itens.sql`
18. `018_psicologia_pasac.sql`
19. `019_psicologia_pahb.sql`
20. `020_psicopedagogia_pape_pahb.sql`

> Observação: o script `10_tabelas_auditoria_logs.sql` citado no painel Admin ainda não foi adicionado a este repositório.
