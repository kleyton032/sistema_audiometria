-- ============================================================================
-- Script: 08_adicionar_pollyanna_supervisor.sql
-- Propósito: Adicionar POLLYANNA (ID 13) ao perfil SUPERVISOR
-- ============================================================================

BEGIN
    -- ============================================================================
    -- SEÇÃO 1: ATUALIZAR POLLYANNA PARA PERFIL SUPERVISOR
    -- ============================================================================
    UPDATE FAV_TB_SILA_USUARIOS
    SET ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'SUPERVISOR')
    WHERE ID_USUARIO = 13;
    
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('✓ POLLYANNA (ID 13) adicionada ao perfil SUPERVISOR');
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('✗ ERRO: ' || SQLERRM);
END;
/

-- ============================================================================
-- SEÇÃO 2: VERIFICAR POLLYANNA
-- ============================================================================
SELECT 
    u.ID_USUARIO,
    u.NM_USUARIO,
    p.DS_PERFIL
FROM FAV_TB_SILA_USUARIOS u
JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
WHERE u.ID_USUARIO = 13;
