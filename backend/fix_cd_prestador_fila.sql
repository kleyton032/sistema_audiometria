-- =============================================================================
-- SCRIPT DE CORREÇÃO: Preenche CD_PRESTADOR em branco na FAV_LISTA_ESPERA
-- 
-- Lógica: Para cada registro na fila de espera sem CD_PRESTADOR,
-- busca o prestador a partir do CD_ATENDIMENTO → FAV_TB_PTS → ID_USUARIO 
-- → FAV_TB_USUARIO_PRESTADOR → CD_PRESTADOR
-- =============================================================================

-- 1) Visualizar os registros que serão corrigidos (execute para conferir antes)
SELECT 
    le.CD_ID_FILA,
    le.CD_ATENDIMENTO,
    le.CD_PACIENTE,
    le.CD_PRESTADOR         AS cd_prestador_atual,
    up.CD_PRESTADOR         AS cd_prestador_correto,
    u.NM_USUARIO
FROM FAV_LISTA_ESPERA le
JOIN FAV_TB_PTS p 
    ON TO_NUMBER(p.NR_ATENDIMENTO) = le.CD_ATENDIMENTO
    AND le.CD_DOCUMENTO = 701
JOIN FAV_TB_SILA_USUARIOS u 
    ON u.ID_USUARIO = p.ID_USUARIO
JOIN FAV_TB_USUARIO_PRESTADOR up 
    ON up.ID_USUARIO = p.ID_USUARIO
WHERE (le.CD_PRESTADOR IS NULL OR le.CD_PRESTADOR = 0)
  AND le.TP_SITUACAO = 'S';


-- 2) Aplicar a correção
UPDATE FAV_LISTA_ESPERA le
SET le.CD_PRESTADOR = (
    SELECT up.CD_PRESTADOR
    FROM FAV_TB_PTS p
    JOIN FAV_TB_USUARIO_PRESTADOR up 
        ON up.ID_USUARIO = p.ID_USUARIO
    WHERE TO_NUMBER(p.NR_ATENDIMENTO) = le.CD_ATENDIMENTO
      AND le.CD_DOCUMENTO = 701
      AND ROWNUM = 1
)
WHERE (le.CD_PRESTADOR IS NULL OR le.CD_PRESTADOR = 0)
  AND le.CD_DOCUMENTO = 701
  AND le.TP_SITUACAO = 'S';

COMMIT;

-- 3) Confirmar que não há mais registros sem CD_PRESTADOR
SELECT COUNT(*) AS registros_sem_prestador
FROM FAV_LISTA_ESPERA
WHERE (CD_PRESTADOR IS NULL OR CD_PRESTADOR = 0)
  AND CD_DOCUMENTO = 701
  AND TP_SITUACAO = 'S';
