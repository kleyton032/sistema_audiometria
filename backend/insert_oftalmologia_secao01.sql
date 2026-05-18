-- ============================================================================
-- SCRIPT PARA ADICIONAR DIAGNÓSTICOS DE OFTALMOLOGIA NA SEÇÃO 01 DO PTS
-- ============================================================================
-- 
-- TABELA: TB_FAV_DIAGNOSTICO_CERIV
-- COLUNAS: id_especialidade (NUMBER), ds_diagnostico (VARCHAR2(255))
-- 
-- A seção 01 (Diagnóstico Médico Principal) utiliza id_especialidade = 1
--
-- ============================================================================

-- 1. VISUALIZAR DIAGNÓSTICOS PRINCIPAIS ATUAIS (id_especialidade = 1)
-- Descomente a linha abaixo para ver os diagnósticos atuais
-- SELECT ds_diagnostico FROM TB_FAV_DIAGNOSTICO_CERIV WHERE id_especialidade = 1 ORDER BY ds_diagnostico;


-- 2. QUERY PARA IDENTIFICAR DIAGNÓSTICOS QUE FALTAM
-- Esta query compara os diagnósticos antigos com os novos e lista os que faltam
/*
SELECT 
  TRIM(c.diag) DESCRICAO
FROM 
  fav_diag_cer4 c
WHERE 
  (c.area IN('E','O') OR c.seq = 9999)
  AND c.grupo = 'OFTALMOLOGIA'
  AND TRIM(UPPER(c.diag)) NOT IN (
    SELECT UPPER(ds_diagnostico) 
    FROM TB_FAV_DIAGNOSTICO_CERIV 
    WHERE id_especialidade = 1
  )
ORDER BY c.diag;
*/


-- 3. INSERTAR OS DIAGNÓSTICOS DE OFTALMOLOGIA QUE FALTAM
-- Após executar a query acima para identificar quais faltam, execute os INSERTs abaixo
-- (Deixe apenas os diagnósticos que não existem na tabela nova)

BEGIN
  INSERT INTO TB_FAV_DIAGNOSTICO_CERIV (id_especialidade, ds_diagnostico) 
    SELECT 1, TRIM(c.diag)
    FROM fav_diag_cer4 c
    WHERE (c.area IN('E','O') OR c.seq = 9999)
      AND c.grupo = 'OFTALMOLOGIA'
      AND TRIM(UPPER(c.diag)) NOT IN (
        SELECT UPPER(ds_diagnostico) 
        FROM TB_FAV_DIAGNOSTICO_CERIV 
        WHERE id_especialidade = 1
      );
  COMMIT;
  DBMS_OUTPUT.PUT_LINE('Diagnósticos de oftalmologia adicionados com sucesso!');
EXCEPTION
  WHEN OTHERS THEN
    DBMS_OUTPUT.PUT_LINE('Erro: ' || SQLERRM);
    ROLLBACK;
END;
/


-- 4. VALIDAR: VER TODOS OS DIAGNÓSTICOS PRINCIPAIS APÓS A INSERÇÃO
-- Descomente a linha abaixo para validar
-- SELECT COUNT(*) as total_diagnosticos FROM TB_FAV_DIAGNOSTICO_CERIV WHERE id_especialidade = 1;
-- SELECT ds_diagnostico FROM TB_FAV_DIAGNOSTICO_CERIV WHERE id_especialidade = 1 ORDER BY ds_diagnostico;
