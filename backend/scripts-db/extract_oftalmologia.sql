-- Script para extrair diagnósticos de OFTALMOLOGIA da tabela antiga
-- Execute isso em seu banco de dados Oracle

-- 1. Ver diagnósticos antigos de OFTALMOLOGIA que precisam ser adicionados
SELECT 
  c.grupo CODIGO, 
  TRIM(c.diag) DESCRICAO,
  'N' STATUS
FROM 
  fav_diag_cer4 c
WHERE 
  (c.area IN('E','O') OR c.seq = 9999)
  AND c.grupo = 'OFTALMOLOGIA'
ORDER BY c.diag;

-- 2. Ver diagnósticos já existentes na nova tabela para OFTALMOLOGIA
SELECT 
  DS_DIAGNOSTICO
FROM 
  TB_FAV_DIAGNOSTICO_CERIV
WHERE 
  ID_ESPECIALIDADE = 14
ORDER BY DS_DIAGNOSTICO;

-- 3. Ver diagnósticos da tabela antiga que NÃO estão na nova
SELECT 
  TRIM(c.diag) DESCRICAO
FROM 
  fav_diag_cer4 c
WHERE 
  (c.area IN('E','O') OR c.seq = 9999)
  AND c.grupo = 'OFTALMOLOGIA'
  AND TRIM(UPPER(c.diag)) NOT IN (
    SELECT UPPER(DS_DIAGNOSTICO) 
    FROM TB_FAV_DIAGNOSTICO_CERIV 
    WHERE ID_ESPECIALIDADE = 14
  )
ORDER BY c.diag;
