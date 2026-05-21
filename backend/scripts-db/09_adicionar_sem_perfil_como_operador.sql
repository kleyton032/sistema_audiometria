-- ============================================================================
-- Script: 09_adicionar_sem_perfil_como_operador.sql
-- Propósito: Adicionar todos os usuários SEM PERFIL ao perfil OPERADOR
-- Total: 34 usuários
-- ============================================================================

BEGIN
    -- ============================================================================
    -- SEÇÃO 1: ATUALIZAR TODOS USUÁRIOS SEM PERFIL PARA OPERADOR
    -- ============================================================================
    UPDATE FAV_TB_SILA_USUARIOS
    SET ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'OPERADOR')
    WHERE ID_PERFIL IS NULL;
    
    DBMS_OUTPUT.PUT_LINE('✓ Usuários migrados para perfil OPERADOR: ' || SQL%ROWCOUNT);
    COMMIT;
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('✗ ERRO: ' || SQLERRM);
END;
/

-- ============================================================================
-- SEÇÃO 2: VERIFICAR USUÁRIOS MIGRADOS
-- ============================================================================
SELECT 
    u.ID_USUARIO,
    u.NM_USUARIO,
    u.NM_LOGIN,
    p.DS_PERFIL
FROM FAV_TB_SILA_USUARIOS u
JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
WHERE p.DS_PERFIL = 'OPERADOR'
ORDER BY u.ID_USUARIO DESC;

-- ============================================================================
-- SEÇÃO 3: CONTAR POR PERFIL
-- ============================================================================
SELECT 
    p.DS_PERFIL,
    COUNT(u.ID_USUARIO) as QTD_USUARIOS
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
GROUP BY p.DS_PERFIL, p.ID_PERFIL
ORDER BY QTD_USUARIOS DESC;
