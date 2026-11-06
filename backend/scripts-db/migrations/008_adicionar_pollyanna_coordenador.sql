-- ============================================================================
-- Script: 06_adicionar_pollyanna_coordenador.sql
-- Propósito: Adicionar POLLYANNA (ID 13) ao perfil COORDENADOR
-- Especialidade: FONOAUDIOLOGIA
-- ============================================================================

BEGIN
    -- ============================================================================
    -- SEÇÃO 1: ATUALIZAR POLLYANNA PARA PERFIL COORDENADOR
    -- ============================================================================
    UPDATE FAV_TB_SILA_USUARIOS
    SET ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'COORDENADOR')
    WHERE ID_USUARIO = 13;
    
    COMMIT;
    
    -- ============================================================================
    -- SEÇÃO 2: VINCULAR POLLYANNA À ESPECIALIDADE FONOAUDIOLOGIA
    -- ============================================================================
    INSERT INTO FAV_TB_COORD_ESP
        (ID_USUARIO, DS_ESPECIALIDADE, DS_TIPO_PRESTA, FL_ATIVO)
    VALUES (13, 'FONOAUDIOLOGIA', 'FONOAUDIÓLOGO(A)', 1);
    
    COMMIT;
    
    DBMS_OUTPUT.PUT_LINE('✓ POLLYANNA (ID 13) adicionada ao perfil COORDENADOR');
    DBMS_OUTPUT.PUT_LINE('✓ Especialidade: FONOAUDIOLOGIA');
    
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('✗ ERRO: ' || SQLERRM);
END;
/

-- ============================================================================
-- SEÇÃO 3: VERIFICAR POLLYANNA
-- ============================================================================
SELECT 
    u.ID_USUARIO,
    u.NM_USUARIO,
    p.DS_PERFIL,
    ce.DS_ESPECIALIDADE,
    ce.DS_TIPO_PRESTA,
    ce.FL_ATIVO
FROM FAV_TB_SILA_USUARIOS u
JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
LEFT JOIN FAV_TB_COORD_ESP ce ON u.ID_USUARIO = ce.ID_USUARIO
WHERE u.ID_USUARIO = 13;

-- Verificar todos os COORDENADORES incluindo POLLYANNA
SELECT 
    u.ID_USUARIO,
    u.NM_USUARIO,
    p.DS_PERFIL,
    ce.DS_ESPECIALIDADE,
    ce.DS_TIPO_PRESTA
FROM FAV_TB_SILA_USUARIOS u
JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
LEFT JOIN FAV_TB_COORD_ESP ce ON u.ID_USUARIO = ce.ID_USUARIO
WHERE p.DS_PERFIL = 'COORDENADOR'
ORDER BY u.ID_USUARIO;
