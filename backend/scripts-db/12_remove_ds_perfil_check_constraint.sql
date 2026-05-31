-- ============================================================================
-- Script: 12_remove_ds_perfil_check_constraint.sql
-- Propósito: Remover a constraint de check legada na coluna DS_PERFIL da tabela 
--            FAV_TB_SILA_USUARIOS, permitindo novos perfis (SUPERVISOR, COORDENADOR, etc.)
-- ============================================================================

DECLARE
    v_constraint_name VARCHAR2(100);
    v_condition VARCHAR2(4000);
BEGIN
    -- Busca a constraint de CHECK na coluna DS_PERFIL que restringe os valores permitidos
    FOR r IN (
        SELECT constraint_name, search_condition
        FROM user_constraints
        WHERE table_name = 'FAV_TB_SILA_USUARIOS' 
          AND constraint_type = 'C'
    ) LOOP
        -- search_condition é LONG, então convertemos para VARCHAR2 na verificação
        v_condition := r.search_condition;
        IF v_condition LIKE '%DS_PERFIL%' AND v_condition LIKE '%IN%' THEN
            v_constraint_name := r.constraint_name;
            EXECUTE IMMEDIATE 'ALTER TABLE FAV_TB_SILA_USUARIOS DROP CONSTRAINT ' || v_constraint_name;
            DBMS_OUTPUT.PUT_LINE('✓ Constraint ' || v_constraint_name || ' removida com sucesso!');
        END IF;
    END LOOP;
    
    IF v_constraint_name IS NULL THEN
        DBMS_OUTPUT.PUT_LINE('⚠ Nenhuma constraint de check restritiva para DS_PERFIL encontrada (pode já ter sido removida).');
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('✗ Erro ao remover a constraint: ' || SQLERRM);
        RAISE;
END;
/
