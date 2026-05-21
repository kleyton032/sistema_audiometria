-- =========================================================================
-- ANÁLISE DE CONTROLE DE ACESSO - SISTEMA DE PTS
-- =========================================================================
-- Script para análise ANTES de qualquer atualização em massa
-- Data: 21 de maio de 2026
-- Objetivo: Entender situação atual e validar estratégia de acesso
-- =========================================================================

-- =========================================================================
-- QUERY 1: PERFIS CADASTRADOS E SUAS PERMISSÕES
-- =========================================================================
PROMPT ========================================
PROMPT QUERY 1: PERFIS CADASTRADOS
PROMPT ========================================

SELECT 
    p.ID_PERFIL,
    p.DS_PERFIL,
    p.DS_DESCRICAO,
    p.FL_ATIVO,
    COUNT(DISTINCT pp.ID_PERMISSAO) AS TOTAL_PERMISSOES,
    LISTAGG(perm.CD_PERMISSAO, ', ') WITHIN GROUP (ORDER BY perm.CD_PERMISSAO) AS PERMISSOES
FROM FAV_TB_PERFIS p
LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp ON p.ID_PERFIL = pp.ID_PERFIL
LEFT JOIN FAV_TB_PERMISSOES perm ON pp.ID_PERMISSAO = perm.ID_PERMISSAO
WHERE p.FL_ATIVO = 1
GROUP BY p.ID_PERFIL, p.DS_PERFIL, p.DS_DESCRICAO, p.FL_ATIVO
ORDER BY p.ID_PERFIL;

-- =========================================================================
-- QUERY 2: PERMISSÕES POR MÓDULO
-- =========================================================================
PROMPT ========================================
PROMPT QUERY 2: PERMISSÕES POR MÓDULO
PROMPT ========================================

SELECT 
    DS_MODULO,
    DS_TIPO,
    CD_PERMISSAO,
    DS_PERMISSAO,
    COUNT(*) AS VEZES_USADA,
    LISTAGG(DISTINCT p.DS_PERFIL, ', ') WITHIN GROUP (ORDER BY p.DS_PERFIL) AS PERFIS_ASSOCIADOS
FROM FAV_TB_PERMISSOES perm
LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp ON perm.ID_PERMISSAO = pp.ID_PERMISSAO
LEFT JOIN FAV_TB_PERFIS p ON pp.ID_PERFIL = p.ID_PERFIL
WHERE perm.FL_ATIVO = 1
GROUP BY DS_MODULO, DS_TIPO, CD_PERMISSAO, DS_PERMISSAO
ORDER BY DS_MODULO, DS_TIPO, CD_PERMISSAO;

-- =========================================================================
-- QUERY 3: MENUS E SUAS PERMISSÕES ASSOCIADAS
-- =========================================================================
PROMPT ========================================
PROMPT QUERY 3: MENUS POR MÓDULO
-- =========================================================================

SELECT 
    m.ID_MENU,
    m.NM_MENU,
    m.DS_MENU,
    m.CD_ROTA,
    perm.CD_PERMISSAO,
    perm.DS_PERMISSAO,
    perm.DS_MODULO,
    m.FL_ATIVO,
    LISTAGG(DISTINCT p.DS_PERFIL, ', ') WITHIN GROUP (ORDER BY p.DS_PERFIL) AS PERFIS_COM_ACESSO
FROM FAV_TB_MENUS m
LEFT JOIN FAV_TB_PERMISSOES perm ON m.ID_PERMISSAO = perm.ID_PERMISSAO
LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp ON perm.ID_PERMISSAO = pp.ID_PERMISSAO
LEFT JOIN FAV_TB_PERFIS p ON pp.ID_PERFIL = p.ID_PERFIL
WHERE m.FL_ATIVO = 1
ORDER BY m.NR_ORDEM, m.NM_MENU;

-- =========================================================================
-- QUERY 4: USUÁRIOS ATIVOS - SITUAÇÃO ATUAL
-- =========================================================================
PROMPT ========================================
PROMPT QUERY 4: USUÁRIOS ATIVOS E SUAS ESPECIALIDADES
-- =========================================================================

SELECT 
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.NM_USUARIO,
    u.DS_EMAIL,
    COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE, 'NÃO IDENTIFICADO') AS ESPECIALIDADE,
    COALESCE(up.DS_CONSELHO, 'N/A') AS CONSELHO,
    CASE WHEN u.ID_PERFIL IS NULL THEN 'SEM PERFIL' ELSE p.DS_PERFIL END AS PERFIL_ATUAL,
    u.FL_ATIVO,
    u.DT_CRIACAO
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
LEFT JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
WHERE u.FL_ATIVO = 1
ORDER BY ESPECIALIDADE, u.NM_USUARIO;

-- =========================================================================
-- QUERY 5: USUÁRIOS SEM PERFIL ATRIBUÍDO
-- =========================================================================
PROMPT ========================================
PROMPT QUERY 5: USUÁRIOS AINDA SEM PERFIL
-- =========================================================================

SELECT 
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.NM_USUARIO,
    u.DS_EMAIL,
    COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE, 'NÃO IDENTIFICADO') AS ESPECIALIDADE,
    COALESCE(up.DS_CONSELHO, 'N/A') AS CONSELHO,
    u.DT_CRIACAO
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
WHERE u.ID_PERFIL IS NULL
  AND u.FL_ATIVO = 1
ORDER BY ESPECIALIDADE, u.NM_USUARIO;

-- =========================================================================
-- QUERY 6: IDENTIFICAÇÃO DE COORDENADORES
-- =========================================================================
PROMPT ========================================
PROMPT QUERY 6: POTENCIAIS COORDENADORES (para PERFIL SUPERVISOR)
-- =========================================================================

SELECT 
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.NM_USUARIO,
    COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE) AS ESPECIALIDADE,
    CASE 
        WHEN UPPER(u.NM_USUARIO) LIKE '%COORD%' THEN 'Sim (Nome)'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%COORD%' THEN 'Sim (Especialidade)'
        WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%COORD%' THEN 'Sim (Tipo Prestador)'
        WHEN UPPER(u.NM_USUARIO) LIKE '%GESTOR%' THEN 'Sim (Gestor no Nome)'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%GESTOR%' THEN 'Sim (Gestor na Especialidade)'
        ELSE 'Não'
    END AS EH_COORDENADOR,
    CASE 
        WHEN u.ID_PERFIL IS NULL THEN 'SEM PERFIL'
        ELSE (SELECT DS_PERFIL FROM FAV_TB_PERFIS WHERE ID_PERFIL = u.ID_PERFIL)
    END AS PERFIL_ATUAL,
    u.DT_CRIACAO
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
WHERE u.FL_ATIVO = 1
ORDER BY EH_COORDENADOR DESC, ESPECIALIDADE, u.NM_USUARIO;

-- =========================================================================
-- QUERY 7: FONOAUDIÓLOGOS (para ACESSO A EXAMES)
-- =========================================================================
PROMPT ========================================
PROMPT QUERY 7: FONOAUDIÓLOGOS (terão acesso a EXAMES_AUDIOMETRIA)
-- =========================================================================

SELECT 
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.NM_USUARIO,
    up.NM_TIP_PRESTA AS ESPECIALIDADE,
    CASE 
        WHEN u.ID_PERFIL IS NULL THEN 'SEM PERFIL'
        ELSE (SELECT DS_PERFIL FROM FAV_TB_PERFIS WHERE ID_PERFIL = u.ID_PERFIL)
    END AS PERFIL_ATUAL,
    u.DT_CRIACAO
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
WHERE u.FL_ATIVO = 1
  AND UPPER(COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE)) LIKE '%FONOAUDIO%'
ORDER BY u.NM_USUARIO;

-- =========================================================================
-- QUERY 8: VISÃO CONSOLIDADA COM PERFIL SUGERIDO (ANÁLISE)
-- =========================================================================
PROMPT ========================================
PROMPT QUERY 8: ANÁLISE CONSOLIDADA - PERFIL SUGERIDO
-- =========================================================================

SELECT 
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.NM_USUARIO,
    u.DS_EMAIL,
    COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE, 'NÃO IDENTIFICADO') AS ESPECIALIDADE,
    COALESCE(up.DS_CONSELHO, '-') AS CONSELHO,
    CASE 
        WHEN u.ID_PERFIL IS NULL THEN 'SEM PERFIL'
        ELSE (SELECT DS_PERFIL FROM FAV_TB_PERFIS WHERE ID_PERFIL = u.ID_PERFIL)
    END AS PERFIL_ATUAL,
    CASE 
        WHEN UPPER(u.NM_USUARIO) LIKE '%ADMIN%' THEN 'ADMIN'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%ADMIN%' THEN 'ADMIN'
        WHEN UPPER(u.NM_USUARIO) LIKE '%DIRETOR%' THEN 'ADMIN'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%DIRETOR%' THEN 'ADMIN'
        WHEN UPPER(u.NM_USUARIO) LIKE '%COORD%' THEN 'SUPERVISOR'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%COORD%' THEN 'SUPERVISOR'
        WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%COORD%' THEN 'SUPERVISOR'
        WHEN UPPER(u.NM_USUARIO) LIKE '%GESTOR%' THEN 'SUPERVISOR'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%GESTOR%' THEN 'SUPERVISOR'
        WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%FONOAUDIO%' THEN 'OPERADOR'
        WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%FISIO%' THEN 'OPERADOR'
        WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%PSICO%' THEN 'OPERADOR'
        WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%OFTALMOLOG%' THEN 'OPERADOR'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%EDUCAD%' THEN 'OPERADOR'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%PEDAGOG%' THEN 'OPERADOR'
        ELSE 'OPERADOR'
    END AS PERFIL_SUGERIDO,
    CASE 
        WHEN UPPER(u.NM_USUARIO) LIKE '%ADMIN%' OR UPPER(u.DS_ESPECIALIDADE) LIKE '%ADMIN%' OR UPPER(u.NM_USUARIO) LIKE '%DIRETOR%' THEN 'Sim'
        WHEN UPPER(u.NM_USUARIO) LIKE '%COORD%' OR UPPER(u.DS_ESPECIALIDADE) LIKE '%COORD%' OR UPPER(u.NM_USUARIO) LIKE '%GESTOR%' THEN 'Coordenador'
        ELSE 'Não'
    END AS COORDENADOR,
    CASE 
        WHEN UPPER(COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE)) LIKE '%FONOAUDIO%' THEN 'Sim'
        ELSE 'Não'
    END AS ACESSO_EXAMES,
    u.FL_ATIVO,
    u.DT_CRIACAO
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
WHERE u.FL_ATIVO = 1
ORDER BY 
    CASE 
        WHEN UPPER(u.NM_USUARIO) LIKE '%ADMIN%' THEN 1
        WHEN UPPER(u.NM_USUARIO) LIKE '%COORD%' THEN 2
        ELSE 3
    END,
    ESPECIALIDADE,
    u.NM_USUARIO;

-- =========================================================================
-- QUERY 9: ESTATÍSTICAS GERAIS
-- =========================================================================
PROMPT ========================================
PROMPT QUERY 9: ESTATÍSTICAS GERAIS
-- =========================================================================

SELECT 
    'Total de Usuários Ativos' AS METRICA,
    COUNT(*) AS VALOR
FROM FAV_TB_SILA_USUARIOS
WHERE FL_ATIVO = 1
UNION ALL
SELECT 
    'Total com Perfil Atribuído',
    COUNT(*)
FROM FAV_TB_SILA_USUARIOS
WHERE FL_ATIVO = 1 AND ID_PERFIL IS NOT NULL
UNION ALL
SELECT 
    'Total SEM Perfil',
    COUNT(*)
FROM FAV_TB_SILA_USUARIOS
WHERE FL_ATIVO = 1 AND ID_PERFIL IS NULL
UNION ALL
SELECT 
    'Total de Coordenadores',
    COUNT(*)
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
WHERE u.FL_ATIVO = 1
  AND (UPPER(u.NM_USUARIO) LIKE '%COORD%' 
       OR UPPER(u.DS_ESPECIALIDADE) LIKE '%COORD%' 
       OR UPPER(up.NM_TIP_PRESTA) LIKE '%COORD%'
       OR UPPER(u.NM_USUARIO) LIKE '%GESTOR%')
UNION ALL
SELECT 
    'Total de Fonoaudiólogos',
    COUNT(*)
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
WHERE u.FL_ATIVO = 1
  AND UPPER(COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE)) LIKE '%FONOAUDIO%'
UNION ALL
SELECT 
    'Total de Perfis',
    COUNT(*)
FROM FAV_TB_PERFIS
WHERE FL_ATIVO = 1
UNION ALL
SELECT 
    'Total de Permissões',
    COUNT(*)
FROM FAV_TB_PERMISSOES
WHERE FL_ATIVO = 1
UNION ALL
SELECT 
    'Total de Menus',
    COUNT(*)
FROM FAV_TB_MENUS
WHERE FL_ATIVO = 1;

-- =========================================================================
-- QUERY 10: DISTRIBUIÇÃO DE USUÁRIOS POR ESPECIALIDADE
-- =========================================================================
PROMPT ========================================
PROMPT QUERY 10: DISTRIBUIÇÃO POR ESPECIALIDADE
-- =========================================================================

SELECT 
    COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE, 'NÃO IDENTIFICADO') AS ESPECIALIDADE,
    COUNT(*) AS TOTAL_USUARIOS,
    SUM(CASE WHEN u.ID_PERFIL IS NULL THEN 1 ELSE 0 END) AS SEM_PERFIL,
    SUM(CASE WHEN u.ID_PERFIL IS NOT NULL THEN 1 ELSE 0 END) AS COM_PERFIL
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
WHERE u.FL_ATIVO = 1
GROUP BY COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE, 'NÃO IDENTIFICADO')
ORDER BY TOTAL_USUARIOS DESC;

-- =========================================================================
-- FIM DA ANÁLISE
-- =========================================================================
PROMPT ========================================
PROMPT ANÁLISE COMPLETA
PROMPT Execute as queries acima para validar dados
PROMPT Depois consulte: ESTRATEGIA_ACESSO_PTS.md
-- =========================================================================
COMMIT;
