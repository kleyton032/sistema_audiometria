-- ============================================================================
-- Script: 07_reverter_pollyanna.sql
-- Propósito: Reverter todas as mudanças de POLLYANNA (ID 13)
-- ============================================================================

BEGIN
    -- ============================================================================
    -- SEÇÃO 1: REMOVER POLLYANNA DA TABELA FAV_TB_COORD_ESP
    -- ============================================================================
    DELETE FROM FAV_TB_COORD_ESP
    WHERE ID_USUARIO = 13;
    
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('✓ Removido de FAV_TB_COORD_ESP');
    
    -- ============================================================================
    -- SEÇÃO 2: RESTAURAR POLLYANNA PARA "SEM PERFIL"
    -- ============================================================================
    UPDATE FAV_TB_SILA_USUARIOS
    SET ID_PERFIL = NULL
    WHERE ID_USUARIO = 13;
    
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('✓ Perfil restaurado para SEM PERFIL');
    DBMS_OUTPUT.PUT_LINE('✓ POLLYANNA (ID 13) revertida com sucesso');
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('✗ ERRO: ' || SQLERRM);
END;
/

-- ============================================================================
-- SEÇÃO 3: VERIFICAR REVERTIDA
-- ============================================================================
SELECT 
    ID_USUARIO,
    NM_USUARIO,
    ID_PERFIL,
    (SELECT DS_PERFIL FROM FAV_TB_PERFIS p WHERE p.ID_PERFIL = u.ID_PERFIL) AS PERFIL
FROM FAV_TB_SILA_USUARIOS u
WHERE ID_USUARIO = 13;

-- Verificar que não existe mais em COORD_ESP
SELECT COUNT(*) as REGISTROS_COORD_ESP_POLLYANNA
FROM FAV_TB_COORD_ESP
WHERE ID_USUARIO = 13;
