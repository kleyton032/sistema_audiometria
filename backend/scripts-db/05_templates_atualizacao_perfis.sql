-- =========================================================================
-- TEMPLATES SQL PARA ATRIBUIÇÃO DE PERFIS
-- =========================================================================
-- ⚠️ USAR APENAS APÓS VALIDAÇÃO COM GESTOR
-- ⚠️ FAZER BACKUP ANTES DE EXECUTAR
-- =========================================================================

-- =========================================================================
-- TEMPLATE 1: ATRIBUIR ADMIN (INDIVIDUAL)
-- =========================================================================
-- Use este template para atribuir ADMIN a um usuário de cada vez
-- Substitua :USER_ID pelo ID do usuário (ex: 123)

/*
UPDATE FAV_TB_SILA_USUARIOS
SET ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'ADMIN')
WHERE ID_USUARIO = :USER_ID
  AND FL_ATIVO = 1;
COMMIT;
*/

-- Exemplo:
-- UPDATE FAV_TB_SILA_USUARIOS
-- SET ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'ADMIN')
-- WHERE ID_USUARIO = 1
--   AND FL_ATIVO = 1;
-- COMMIT;

-- =========================================================================
-- TEMPLATE 2: ATRIBUIR SUPERVISOR (PARA COORDENADORES)
-- =========================================================================
-- Atribui SUPERVISOR a todos os coordenadores identificados na QUERY 6

/*
UPDATE FAV_TB_SILA_USUARIOS u
SET u.ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'SUPERVISOR')
WHERE u.ID_USUARIO IN (
    SELECT u2.ID_USUARIO 
    FROM FAV_TB_SILA_USUARIOS u2
    LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u2.ID_USUARIO = up.ID_USUARIO
    WHERE u2.FL_ATIVO = 1
      AND (UPPER(u2.NM_USUARIO) LIKE '%COORD%'
           OR UPPER(u2.DS_ESPECIALIDADE) LIKE '%COORD%'
           OR UPPER(up.NM_TIP_PRESTA) LIKE '%COORD%'
           OR UPPER(u2.NM_USUARIO) LIKE '%GESTOR%'
           OR UPPER(u2.DS_ESPECIALIDADE) LIKE '%GESTOR%')
      AND u2.ID_PERFIL IS NULL
)
AND u.FL_ATIVO = 1;
COMMIT;
*/

-- =========================================================================
-- TEMPLATE 3: ATRIBUIR OPERADOR - POR ESPECIALIDADE
-- =========================================================================

-- 3.1: FISIOTERAPEUTAS
/*
UPDATE FAV_TB_SILA_USUARIOS u
SET u.ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'OPERADOR')
WHERE u.ID_USUARIO IN (
    SELECT u2.ID_USUARIO 
    FROM FAV_TB_SILA_USUARIOS u2
    LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u2.ID_USUARIO = up.ID_USUARIO
    WHERE u2.FL_ATIVO = 1
      AND u2.ID_PERFIL IS NULL
      AND UPPER(COALESCE(up.NM_TIP_PRESTA, u2.DS_ESPECIALIDADE)) LIKE '%FISIO%'
)
AND u.FL_ATIVO = 1;
COMMIT;
*/

-- 3.2: PSICÓLOGOS
/*
UPDATE FAV_TB_SILA_USUARIOS u
SET u.ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'OPERADOR')
WHERE u.ID_USUARIO IN (
    SELECT u2.ID_USUARIO 
    FROM FAV_TB_SILA_USUARIOS u2
    LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u2.ID_USUARIO = up.ID_USUARIO
    WHERE u2.FL_ATIVO = 1
      AND u2.ID_PERFIL IS NULL
      AND UPPER(COALESCE(up.NM_TIP_PRESTA, u2.DS_ESPECIALIDADE)) LIKE '%PSICO%'
)
AND u.FL_ATIVO = 1;
COMMIT;
*/

-- 3.3: FONOAUDIÓLOGOS
/*
UPDATE FAV_TB_SILA_USUARIOS u
SET u.ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'OPERADOR')
WHERE u.ID_USUARIO IN (
    SELECT u2.ID_USUARIO 
    FROM FAV_TB_SILA_USUARIOS u2
    LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u2.ID_USUARIO = up.ID_USUARIO
    WHERE u2.FL_ATIVO = 1
      AND u2.ID_PERFIL IS NULL
      AND UPPER(COALESCE(up.NM_TIP_PRESTA, u2.DS_ESPECIALIDADE)) LIKE '%FONOAUDIO%'
)
AND u.FL_ATIVO = 1;
COMMIT;
*/

-- 3.4: OFTALMOLOGISTAS
/*
UPDATE FAV_TB_SILA_USUARIOS u
SET u.ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'OPERADOR')
WHERE u.ID_USUARIO IN (
    SELECT u2.ID_USUARIO 
    FROM FAV_TB_SILA_USUARIOS u2
    LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u2.ID_USUARIO = up.ID_USUARIO
    WHERE u2.FL_ATIVO = 1
      AND u2.ID_PERFIL IS NULL
      AND UPPER(COALESCE(up.NM_TIP_PRESTA, u2.DS_ESPECIALIDADE)) LIKE '%OFTALMOLOG%'
)
AND u.FL_ATIVO = 1;
COMMIT;
*/

-- 3.5: EDUCADORES / PEDAGOGOS
/*
UPDATE FAV_TB_SILA_USUARIOS u
SET u.ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'OPERADOR')
WHERE u.ID_USUARIO IN (
    SELECT u2.ID_USUARIO 
    FROM FAV_TB_SILA_USUARIOS u2
    LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u2.ID_USUARIO = up.ID_USUARIO
    WHERE u2.FL_ATIVO = 1
      AND u2.ID_PERFIL IS NULL
      AND (UPPER(COALESCE(up.NM_TIP_PRESTA, u2.DS_ESPECIALIDADE)) LIKE '%EDUCAD%'
           OR UPPER(COALESCE(up.NM_TIP_PRESTA, u2.DS_ESPECIALIDADE)) LIKE '%PEDAGOG%')
)
AND u.FL_ATIVO = 1;
COMMIT;
*/

-- 3.6: OUTROS (Catch-all para restantes)
/*
UPDATE FAV_TB_SILA_USUARIOS u
SET u.ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'OPERADOR')
WHERE u.ID_USUARIO IN (
    SELECT u2.ID_USUARIO 
    FROM FAV_TB_SILA_USUARIOS u2
    WHERE u2.FL_ATIVO = 1
      AND u2.ID_PERFIL IS NULL
      AND u2.ID_USUARIO NOT IN (
          SELECT u3.ID_USUARIO 
          FROM FAV_TB_SILA_USUARIOS u3
          LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u3.ID_USUARIO = up.ID_USUARIO
          WHERE u3.FL_ATIVO = 1
            AND (UPPER(COALESCE(up.NM_TIP_PRESTA, u3.DS_ESPECIALIDADE)) LIKE '%COORD%'
                 OR UPPER(u3.NM_USUARIO) LIKE '%GESTOR%')
      )
)
AND u.FL_ATIVO = 1;
COMMIT;
*/

-- =========================================================================
-- TEMPLATE 4: ATRIBUIR VISUALIZADOR (se necessário)
-- =========================================================================
-- Use este template APENAS se houver usuários que precisam apenas ler PTS

/*
UPDATE FAV_TB_SILA_USUARIOS
SET ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'VISUALIZADOR')
WHERE ID_USUARIO IN (:ID1, :ID2, :ID3)  -- Substituir pelos IDs
  AND FL_ATIVO = 1;
COMMIT;
*/

-- =========================================================================
-- TEMPLATE 5: ATRIBUIR PERFIL A USUÁRIO ESPECÍFICO
-- =========================================================================
-- Use quando quiser atribuir um perfil específico a um usuário específico

/*
UPDATE FAV_TB_SILA_USUARIOS
SET ID_PERFIL = (
    SELECT ID_PERFIL 
    FROM FAV_TB_PERFIS 
    WHERE DS_PERFIL = :PERFIL_NAME  -- Ex: 'ADMIN', 'SUPERVISOR', 'OPERADOR'
)
WHERE ID_USUARIO = :USER_ID  -- Ex: 123
  AND FL_ATIVO = 1;
COMMIT;
*/

-- =========================================================================
-- VALIDATION QUERIES (Verificar resultados após updates)
-- =========================================================================

-- Query: Ver quantos usuários têm perfil agora
SELECT 
    COUNT(*) AS TOTAL,
    SUM(CASE WHEN ID_PERFIL IS NULL THEN 1 ELSE 0 END) AS SEM_PERFIL,
    SUM(CASE WHEN ID_PERFIL IS NOT NULL THEN 1 ELSE 0 END) AS COM_PERFIL
FROM FAV_TB_SILA_USUARIOS
WHERE FL_ATIVO = 1;

-- Query: Ver distribuição de perfis
SELECT 
    p.DS_PERFIL,
    COUNT(u.ID_USUARIO) AS TOTAL_USUARIOS
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
WHERE u.FL_ATIVO = 1
GROUP BY p.DS_PERFIL
ORDER BY TOTAL_USUARIOS DESC;

-- Query: Ver usuários por perfil e especialidade
SELECT 
    p.DS_PERFIL,
    COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE, 'NÃO IDENTIFICADO') AS ESPECIALIDADE,
    COUNT(u.ID_USUARIO) AS TOTAL
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
WHERE u.FL_ATIVO = 1
GROUP BY p.DS_PERFIL, COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE, 'NÃO IDENTIFICADO')
ORDER BY p.DS_PERFIL, ESPECIALIDADE;

-- Query: Ver se ainda há usuários sem perfil
SELECT 
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.NM_USUARIO,
    COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE, 'NÃO IDENTIFICADO') AS ESPECIALIDADE
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
WHERE u.FL_ATIVO = 1
  AND u.ID_PERFIL IS NULL
ORDER BY ESPECIALIDADE, u.NM_USUARIO;

-- =========================================================================
-- ROLLBACK (Se precisar desfazer tudo)
-- =========================================================================

-- ⚠️ CUIDADO: Esta query REMOVE todos os perfis atribuídos!
-- Use APENAS se algo deu errado

/*
UPDATE FAV_TB_SILA_USUARIOS
SET ID_PERFIL = NULL
WHERE FL_ATIVO = 1;
COMMIT;

-- Depois, execute as queries de análise novamente:
-- SELECT * FROM VW_USUARIOS_ANALISE_ACESSO;
*/

-- =========================================================================
-- DICAS IMPORTANTES
-- =========================================================================

/*
1. SEMPRE faça backup antes de UPDATE em massa:
   - Exporte com: SELECT * FROM FAV_TB_SILA_USUARIOS
   - Guarde em arquivo CSV/XLS

2. SEMPRE valide com QUERY após UPDATE:
   - Execute validation queries acima
   - Verifique se números fazem sentido

3. SEMPRE teste em DEV antes de PROD:
   - Crie script em DEV
   - Valide resultados
   - Depois execute em PROD

4. SEMPRE rastreie quem fez quê:
   - Adicione coluna DT_ULTIMA_ATUALIZACAO
   - Registre ID_USUARIO_ATUALIZOU
   - Para auditoria depois

5. COMUNICAR mudanças:
   - Avise usuários sobre novo menu/permissões
   - Explique restrições
   - Forneça suporte

6. Dúvidas sobre IDs:
   - Execute: SELECT ID_PERFIL, DS_PERFIL FROM FAV_TB_PERFIS;
   - Use IDs corretos nas queries

7. Se tudo der errado:
   - Restaure do backup
   - Execute ROLLBACK (comentado acima)
   - Contate o time de DBA
*/

-- =========================================================================
-- FIM DOS TEMPLATES
-- =========================================================================
