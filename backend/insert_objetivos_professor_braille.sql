-- Inserir especialidade PROFESSOR DE BRAILLE se não existir
BEGIN
    INSERT INTO FAV_TB_ESP_OBJETIVO_CERIV (ID_ESPECIALIDADE, DS_ESPECIALIDADE)
    SELECT 8, 'PROFESSOR DE BRAILLE'
    FROM DUAL
    WHERE NOT EXISTS (SELECT 1 FROM FAV_TB_ESP_OBJETIVO_CERIV WHERE ID_ESPECIALIDADE = 8);
    COMMIT;
END;
/

-- Inserir objetivos para PROFESSOR DE BRAILLE (ID_ESPECIALIDADE = 8)
-- Migração da tabela antiga FAV_OBJ_CER4 onde area = 'V'

DECLARE
    v_max_id NUMBER;
    v_count NUMBER := 0;
BEGIN
    SELECT NVL(MAX(ID_OBJETIVO), 0) INTO v_max_id FROM FAV_TB_OBJETIVO_CERIV;
    
    FOR rec IN (
        SELECT DISTINCT objetivo FROM fav_obj_cer4 c
        WHERE c.area = 'V'
        ORDER BY c.objetivo
    ) LOOP
        v_count := v_count + 1;
        INSERT INTO FAV_TB_OBJETIVO_CERIV (ID_OBJETIVO, ID_ESPECIALIDADE, DS_OBJETIVO)
        VALUES (v_max_id + v_count, 8, rec.objetivo);
    END LOOP;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Inseridos ' || v_count || ' objetivos');
END;
/
