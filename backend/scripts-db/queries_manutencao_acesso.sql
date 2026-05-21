-- =========================================================================
-- QUERIES DE MANUTENÇÃO - CONTROLE DE ACESSO
-- =========================================================================
-- Arquivo com queries prontas para auditoria, manutenção e troubleshooting
-- do sistema de controle de acesso baseado em perfis e permissões
-- =========================================================================

-- =========================================================================
-- SEÇÃO 1: ANÁLISE E AUDITORIA DE USUÁRIOS
-- =========================================================================

-- 1.1 - Listar todos os usuários com seus perfis e permissões
SELECT * FROM VW_USUARIOS_PERMISSOES
ORDER BY NM_USUARIO;

-- 1.2 - Contar usuários por perfil
SELECT 
    COALESCE(p.DS_PERFIL, 'SEM PERFIL') AS PERFIL,
    COUNT(u.ID_USUARIO) AS TOTAL_USUARIOS
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
WHERE u.FL_ATIVO = 1
GROUP BY p.DS_PERFIL
ORDER BY TOTAL_USUARIOS DESC;

-- 1.3 - Usuários sem perfil definido (REQUER AÇÃO)
SELECT 
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.NM_USUARIO,
    u.DS_EMAIL,
    u.DS_ESPECIALIDADE,
    u.DT_CRIACAO,
    'SEM PERFIL DEFINIDO' AS STATUS
FROM FAV_TB_SILA_USUARIOS u
WHERE u.ID_PERFIL IS NULL 
  AND u.FL_ATIVO = 1
ORDER BY u.NM_USUARIO;

-- 1.4 - Usuários inativos com perfil (candidatos para limpeza)
SELECT 
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.NM_USUARIO,
    p.DS_PERFIL,
    u.DT_CRIACAO,
    'INATIVO' AS STATUS
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
WHERE u.FL_ATIVO = 0
ORDER BY u.NM_USUARIO;

-- 1.5 - Usuários agrupados por especialidade e perfil
SELECT 
    COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE, 'SEM ESPECIALIDADE') AS ESPECIALIDADE,
    COALESCE(p.DS_PERFIL, 'SEM PERFIL') AS PERFIL,
    COUNT(*) AS TOTAL,
    LISTAGG(u.NM_LOGIN, '; ') WITHIN GROUP (ORDER BY u.NM_LOGIN) AS USUARIOS
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
LEFT JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
WHERE u.FL_ATIVO = 1
GROUP BY COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE), p.DS_PERFIL
ORDER BY ESPECIALIDADE, PERFIL;

-- =========================================================================
-- SEÇÃO 2: VALIDAÇÃO DE PERMISSÕES
-- =========================================================================

-- 2.1 - Listar todas as permissões por módulo
SELECT 
    DS_MODULO,
    DS_TIPO,
    CD_PERMISSAO,
    DS_PERMISSAO,
    FL_ATIVO
FROM FAV_TB_PERMISSOES
ORDER BY DS_MODULO, DS_TIPO, CD_PERMISSAO;

-- 2.2 - Permissões de um perfil específico (ADMIN)
SELECT 
    p.DS_PERFIL,
    perm.DS_MODULO,
    perm.DS_TIPO,
    perm.CD_PERMISSAO,
    perm.DS_PERMISSAO
FROM FAV_TB_PERFIS p
INNER JOIN FAV_TB_PERFIS_PERMISSOES pp ON p.ID_PERFIL = pp.ID_PERFIL
INNER JOIN FAV_TB_PERMISSOES perm ON pp.ID_PERMISSAO = perm.ID_PERMISSAO
WHERE p.DS_PERFIL = 'ADMIN'
  AND perm.FL_ATIVO = 1
ORDER BY perm.DS_MODULO, perm.DS_TIPO;

-- 2.3 - Comparar permissões entre dois perfis
SELECT 
    CASE 
        WHEN pp1.ID_PERFIL IS NOT NULL AND pp2.ID_PERFIL IS NULL THEN 'SÓ EM OPERADOR'
        WHEN pp1.ID_PERFIL IS NULL AND pp2.ID_PERFIL IS NOT NULL THEN 'SÓ EM SUPERVISOR'
        ELSE 'EM AMBOS'
    END AS SITUACAO,
    perm.CD_PERMISSAO,
    perm.DS_PERMISSAO,
    perm.DS_MODULO
FROM FAV_TB_PERMISSOES perm
LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp1 ON perm.ID_PERMISSAO = pp1.ID_PERMISSAO 
    AND pp1.ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'OPERADOR')
LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp2 ON perm.ID_PERMISSAO = pp2.ID_PERMISSAO 
    AND pp2.ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'SUPERVISOR')
WHERE perm.FL_ATIVO = 1
ORDER BY SITUACAO, perm.DS_MODULO;

-- 2.4 - Permissões orfãs (não atribuídas a nenhum perfil)
SELECT 
    perm.ID_PERMISSAO,
    perm.CD_PERMISSAO,
    perm.DS_PERMISSAO,
    perm.DS_MODULO,
    'ORFÃ - SEM PERFIL ASSOCIADO' AS STATUS
FROM FAV_TB_PERMISSOES perm
WHERE NOT EXISTS (
    SELECT 1 FROM FAV_TB_PERFIS_PERMISSOES pp 
    WHERE pp.ID_PERMISSAO = perm.ID_PERMISSAO
)
AND perm.FL_ATIVO = 1;

-- =========================================================================
-- SEÇÃO 3: ANÁLISE DE MENUS
-- =========================================================================

-- 3.1 - Ver todos os menus com permissões associadas
SELECT * FROM VW_MENUS_PERMISSOES
ORDER BY NR_ORDEM, NM_MENU;

-- 3.2 - Menus que requerem permissão específica
SELECT 
    m.NM_MENU,
    m.CD_ROTA,
    perm.CD_PERMISSAO,
    perm.DS_PERMISSAO,
    m.FL_ATIVO
FROM FAV_TB_MENUS m
LEFT JOIN FAV_TB_PERMISSOES perm ON m.ID_PERMISSAO = perm.ID_PERMISSAO
WHERE m.ID_PERMISSAO IS NOT NULL
ORDER BY m.NR_ORDEM;

-- 3.3 - Menus sem permissão (públicos)
SELECT 
    m.ID_MENU,
    m.NM_MENU,
    m.CD_ROTA,
    m.NR_ORDEM,
    'PÚBLICO - SEM RESTRIÇÃO' AS ACESSO
FROM FAV_TB_MENUS m
WHERE m.ID_PERMISSAO IS NULL
  AND m.FL_ATIVO = 1
ORDER BY m.NR_ORDEM;

-- 3.4 - Hierarquia de menus (pais e filhos)
SELECT 
    pai.NM_MENU AS MENU_PAI,
    filho.NM_MENU AS SUBMENU,
    filho.CD_ROTA,
    COALESCE(perm.CD_PERMISSAO, 'PÚBLICO') AS PERMISSAO_REQUERIDA,
    filho.FL_ATIVO
FROM FAV_TB_MENUS pai
FULL OUTER JOIN FAV_TB_MENUS filho ON pai.ID_MENU = filho.ID_MENU_PAI
LEFT JOIN FAV_TB_PERMISSOES perm ON filho.ID_PERMISSAO = perm.ID_PERMISSAO
WHERE pai.ID_MENU_PAI IS NULL 
  OR filho.ID_MENU IS NOT NULL
ORDER BY COALESCE(pai.NR_ORDEM, 999), filho.NR_ORDEM;

-- =========================================================================
-- SEÇÃO 4: OPERAÇÕES DE MANUTENÇÃO - ATRIBUIÇÃO DE PERFIS
-- =========================================================================

-- 4.1 - Atribuir perfil OPERADOR a todos os usuários de uma especialidade
-- EXEMPLO: Fisioterapeutas
-- Descomente e customize antes de executar:
/*
UPDATE FAV_TB_SILA_USUARIOS u
SET u.ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'OPERADOR')
WHERE u.ID_USUARIO IN (
    SELECT u2.ID_USUARIO 
    FROM FAV_TB_SILA_USUARIOS u2
    LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u2.ID_USUARIO = up.ID_USUARIO
    WHERE u2.ID_PERFIL IS NULL 
      AND u2.FL_ATIVO = 1
      AND UPPER(up.NM_TIP_PRESTA) LIKE '%FISIO%'
)
AND u.FL_ATIVO = 1;
COMMIT;
*/

-- 4.2 - Atribuir perfil SUPERVISOR a um coordenador específico
-- EXEMPLO: Coordenador ID 123
-- Descomente e customize antes de executar:
/*
UPDATE FAV_TB_SILA_USUARIOS
SET ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'SUPERVISOR')
WHERE ID_USUARIO = 123;
COMMIT;
*/

-- 4.3 - Atribuir perfil ADMIN a um administrador específico
-- EXEMPLO: Admin ID 456
-- Descomente e customize antes de executar:
/*
UPDATE FAV_TB_SILA_USUARIOS
SET ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'ADMIN')
WHERE ID_USUARIO = 456;
COMMIT;
*/

-- =========================================================================
-- SEÇÃO 5: AUDITORIA - RASTREAMENTO DE MUDANÇAS
-- =========================================================================

-- 5.1 - Ver quando perfis foram criados
SELECT 
    ID_PERFIL,
    DS_PERFIL,
    DS_DESCRICAO,
    FL_ATIVO,
    DT_CRIACAO
FROM FAV_TB_PERFIS
ORDER BY DT_CRIACAO DESC;

-- 5.2 - Ver quando permissões foram criadas
SELECT 
    ID_PERMISSAO,
    CD_PERMISSAO,
    DS_PERMISSAO,
    DS_MODULO,
    FL_ATIVO,
    DT_CRIACAO
FROM FAV_TB_PERMISSOES
ORDER BY DT_CRIACAO DESC;

-- 5.3 - Ver quando usuários receberam perfis (aproximado, pela DT_CRIACAO do usuário)
SELECT 
    u.ID_USUARIO,
    u.NM_LOGIN,
    p.DS_PERFIL,
    u.DT_CRIACAO,
    COUNT(pp.ID_PERFIL_PERMISSAO) AS TOTAL_PERMISSOES
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp ON p.ID_PERFIL = pp.ID_PERFIL
WHERE u.FL_ATIVO = 1 AND u.ID_PERFIL IS NOT NULL
GROUP BY u.ID_USUARIO, u.NM_LOGIN, p.DS_PERFIL, u.DT_CRIACAO
ORDER BY u.DT_CRIACAO DESC;

-- =========================================================================
-- SEÇÃO 6: TROUBLESHOOTING
-- =========================================================================

-- 6.1 - Validar integridade referencial
-- Usuários com ID_PERFIL inválido
SELECT 
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.ID_PERFIL,
    'ERRO: PERFIL NÃO EXISTE' AS ERRO
FROM FAV_TB_SILA_USUARIOS u
WHERE u.ID_PERFIL IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PERFIS p WHERE p.ID_PERFIL = u.ID_PERFIL)
  AND u.FL_ATIVO = 1;

-- 6.2 - Validar menus com permissões inválidas
SELECT 
    m.ID_MENU,
    m.NM_MENU,
    m.ID_PERMISSAO,
    'ERRO: PERMISSÃO NÃO EXISTE' AS ERRO
FROM FAV_TB_MENUS m
WHERE m.ID_PERMISSAO IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PERMISSOES p WHERE p.ID_PERMISSAO = m.ID_PERMISSAO)
  AND m.FL_ATIVO = 1;

-- 6.3 - Usuários com múltiplos registros (duplicatas)
SELECT 
    u.NM_LOGIN,
    COUNT(*) AS TOTAL_REGISTROS,
    LISTAGG(u.ID_USUARIO, ', ') WITHIN GROUP (ORDER BY u.ID_USUARIO) AS IDS
FROM FAV_TB_SILA_USUARIOS u
WHERE u.FL_ATIVO = 1
GROUP BY u.NM_LOGIN
HAVING COUNT(*) > 1;

-- 6.4 - Status geral do sistema de permissões
SELECT 
    'Total de Perfis' AS METRICA,
    COUNT(*) AS VALOR
FROM FAV_TB_PERFIS
WHERE FL_ATIVO = 1
UNION ALL
SELECT 'Total de Permissões', COUNT(*)
FROM FAV_TB_PERMISSOES
WHERE FL_ATIVO = 1
UNION ALL
SELECT 'Total de Menus', COUNT(*)
FROM FAV_TB_MENUS
WHERE FL_ATIVO = 1
UNION ALL
SELECT 'Usuários com Perfil', COUNT(*)
FROM FAV_TB_SILA_USUARIOS
WHERE FL_ATIVO = 1 AND ID_PERFIL IS NOT NULL
UNION ALL
SELECT 'Usuários sem Perfil', COUNT(*)
FROM FAV_TB_SILA_USUARIOS
WHERE FL_ATIVO = 1 AND ID_PERFIL IS NULL
UNION ALL
SELECT 'Usuários Inativos', COUNT(*)
FROM FAV_TB_SILA_USUARIOS
WHERE FL_ATIVO = 0;

-- =========================================================================
-- SEÇÃO 7: LIMPEZA E MANUTENÇÃO
-- =========================================================================

-- 7.1 - Listar perfis inativos que podem ser removidos
SELECT 
    ID_PERFIL,
    DS_PERFIL,
    DS_DESCRICAO,
    FL_ATIVO,
    (SELECT COUNT(*) FROM FAV_TB_SILA_USUARIOS 
     WHERE ID_PERFIL = FAV_TB_PERFIS.ID_PERFIL) AS USUARIOS_ASSOCIADOS
FROM FAV_TB_PERFIS
WHERE FL_ATIVO = 0;

-- 7.2 - Desativar permissões não utilizadas
-- (Executar após validar se realmente não será usada)
/*
UPDATE FAV_TB_PERMISSOES
SET FL_ATIVO = 0
WHERE CD_PERMISSAO = 'PERMISSAO_A_DESATIVAR';
COMMIT;
*/

-- 7.3 - Remover relacionamento perfil-permissão
-- (Remover uma permissão específica de um perfil)
/*
DELETE FROM FAV_TB_PERFIS_PERMISSOES
WHERE ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'OPERADOR')
  AND ID_PERMISSAO = (SELECT ID_PERMISSAO FROM FAV_TB_PERMISSOES 
                       WHERE CD_PERMISSAO = 'AUDIOMETRIA_DELETAR');
COMMIT;
*/

-- =========================================================================
-- SEÇÃO 8: RELATÓRIOS GERENCIAIS
-- =========================================================================

-- 8.1 - Relatório de cobertura: % de usuários com perfil atribuído
SELECT 
    ROUND(
        (SUM(CASE WHEN u.ID_PERFIL IS NOT NULL THEN 1 ELSE 0 END) * 100.0) / 
        COUNT(*), 2
    ) AS PERCENTUAL_COM_PERFIL,
    SUM(CASE WHEN u.ID_PERFIL IS NOT NULL THEN 1 ELSE 0 END) AS USUARIOS_COM_PERFIL,
    COUNT(*) AS TOTAL_USUARIOS_ATIVOS
FROM FAV_TB_SILA_USUARIOS u
WHERE u.FL_ATIVO = 1;

-- 8.2 - Distribuição de perfis por especialidade
SELECT 
    COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE, 'INDEFINIDA') AS ESPECIALIDADE,
    COALESCE(p.DS_PERFIL, 'SEM PERFIL') AS PERFIL,
    COUNT(*) AS TOTAL,
    ROUND((COUNT(*) * 100.0) / 
        SUM(COUNT(*)) OVER (PARTITION BY COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE)), 2) AS PERCENTUAL
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
LEFT JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
WHERE u.FL_ATIVO = 1
GROUP BY COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE), p.DS_PERFIL
ORDER BY ESPECIALIDADE, TOTAL DESC;

-- 8.3 - Permissões mais utilizadas (quantos perfis as possuem)
SELECT 
    perm.CD_PERMISSAO,
    perm.DS_PERMISSAO,
    perm.DS_MODULO,
    COUNT(pp.ID_PERFIL) AS PERFIS_ASSOCIADOS,
    COUNT(DISTINCT u.ID_USUARIO) AS USUARIOS_COM_PERMISSAO
FROM FAV_TB_PERMISSOES perm
LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp ON perm.ID_PERMISSAO = pp.ID_PERMISSAO
LEFT JOIN FAV_TB_PERFIS p ON pp.ID_PERFIL = p.ID_PERFIL
LEFT JOIN FAV_TB_SILA_USUARIOS u ON p.ID_PERFIL = u.ID_PERFIL AND u.FL_ATIVO = 1
WHERE perm.FL_ATIVO = 1
GROUP BY perm.ID_PERMISSAO, perm.CD_PERMISSAO, perm.DS_PERMISSAO, perm.DS_MODULO
ORDER BY USUARIOS_COM_PERMISSAO DESC;

-- =========================================================================
-- FIM DO ARQUIVO
-- =========================================================================
-- Última atualização: 21 de maio de 2026
-- Para usar: Copie e cole cada query individualmente no Oracle
