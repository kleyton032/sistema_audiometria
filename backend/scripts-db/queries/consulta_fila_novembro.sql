-- =============================================================================
-- CONSULTA: Terapias indicadas via PTS na Fila de Espera - Novembro
-- =============================================================================


-- ---------------------------------------------------------------
-- DIAGNÓSTICO 1: Ver quais CD_DOCUMENTO existem e quantos registros
-- Execute isso primeiro para saber qual código usa para PTS
-- ---------------------------------------------------------------
SELECT
    le.CD_DOCUMENTO,
    COUNT(*)                AS total_registros,
    MIN(le.DT_LANCA_LISTA) AS data_mais_antiga,
    MAX(le.DT_LANCA_LISTA) AS data_mais_recente
FROM DBAMV.FAV_LISTA_ESPERA le
WHERE le.CER_TOT_SES IS NOT NULL   -- Só registros que parecem ser de PTS (têm sessões CER)
GROUP BY le.CD_DOCUMENTO
ORDER BY total_registros DESC;


-- ---------------------------------------------------------------
-- DIAGNÓSTICO 2: Ver quantos registros existem por mês/ano
-- Execute para confirmar se novembro 2025 ou 2024 tem dados
-- ---------------------------------------------------------------
SELECT
    TO_CHAR(le.DT_LANCA_LISTA, 'MM/YYYY')  AS mes_ano,
    le.CD_DOCUMENTO,
    COUNT(*)                                 AS total
FROM DBAMV.FAV_LISTA_ESPERA le
WHERE le.CER_TOT_SES IS NOT NULL
GROUP BY TO_CHAR(le.DT_LANCA_LISTA, 'MM/YYYY'), le.CD_DOCUMENTO
ORDER BY mes_ano DESC, total DESC;


-- ---------------------------------------------------------------
-- DIAGNÓSTICO 3: Amostra sem filtros para ver a estrutura real
-- ---------------------------------------------------------------
SELECT le.*
FROM DBAMV.FAV_LISTA_ESPERA le
WHERE le.CER_TOT_SES IS NOT NULL
  AND ROWNUM <= 5;


-- ---------------------------------------------------------------
-- PARTE 1: Detalhe por sessão
-- ---------------------------------------------------------------
SELECT
    -- Identificação
    le.CD_ATENDIMENTO,
    le.CD_PACIENTE,
    p.NM_PACIENTE,

    -- Terapia indicada
    le.CD_IT_AGEND                              AS cd_terapia,
    ia.DS_ITEM_AGENDAMENTO                      AS ds_terapia,

    -- Prestador que indicou
    le.CD_PRESTADOR,
    pr.NM_PRESTADOR,

    -- Datas
    le.DT_LANCA_LISTA,
    le.DT_ATENDIMENTO                           AS dt_atendimento_origem,

    -- Sessões
    le.CER_TOT_SES                              AS total_sessoes,
    le.CER_SESSAO                               AS nr_sessao,

    -- Situação
    le.TP_SITUACAO,
    CASE le.TP_SITUACAO
        WHEN 'S' THEN 'SOLICITADO'
        WHEN 'G' THEN 'AGENDADO'
        WHEN 'M' THEN 'EM ESPERA'
        WHEN 'T' THEN 'ATENDIDO'
        WHEN 'R' THEN 'REALIZADO'
        WHEN 'C' THEN 'CANCELADO'
        ELSE le.TP_SITUACAO
    END                                         AS ds_situacao,

    le.OBSERV

FROM DBAMV.FAV_LISTA_ESPERA le

LEFT JOIN DBAMV.PACIENTE p
    ON p.CD_PACIENTE = le.CD_PACIENTE

LEFT JOIN DBAMV.ITEM_AGENDAMENTO ia
    ON ia.CD_ITEM_AGENDAMENTO = le.CD_IT_AGEND

LEFT JOIN DBAMV.PRESTADOR pr
    ON pr.CD_PRESTADOR = le.CD_PRESTADOR

WHERE le.CD_DOCUMENTO = 701
  AND TO_CHAR(le.DT_LANCA_LISTA, 'MM')   = '11'    -- Mês: Novembro
  AND TO_CHAR(le.DT_LANCA_LISTA, 'YYYY') = '2025'  -- Ano: troque para '2025' se necessário

ORDER BY
    p.NM_PACIENTE,
    ia.DS_ITEM_AGENDAMENTO,
    le.CER_SESSAO;


-- ---------------------------------------------------------------
-- PARTE 2: Resumo por Paciente e Terapia
-- ---------------------------------------------------------------
SELECT
    le.CD_PACIENTE,
    p.NM_PACIENTE,
    ia.DS_ITEM_AGENDAMENTO                  AS ds_terapia,
    pr.NM_PRESTADOR,
    MIN(le.DT_LANCA_LISTA)                  AS dt_solicitacao,
    MAX(le.CER_TOT_SES)                     AS total_sessoes_autorizadas,

    COUNT(CASE WHEN le.TP_SITUACAO IN ('S', 'G', 'M') THEN 1 END)  AS sessoes_em_aberto,
    COUNT(CASE WHEN le.TP_SITUACAO IN ('T', 'R')       THEN 1 END)  AS sessoes_realizadas,
    COUNT(CASE WHEN le.TP_SITUACAO = 'C'               THEN 1 END)  AS sessoes_canceladas,

    CASE
        WHEN COUNT(CASE WHEN le.TP_SITUACAO IN ('S', 'G', 'M') THEN 1 END) > 0
            THEN 'PENDENTE'
        WHEN COUNT(CASE WHEN le.TP_SITUACAO = 'C' THEN 1 END) = COUNT(*)
            THEN 'CANCELADO'
        ELSE 'CONCLUÍDO'
    END                                     AS status_geral

FROM DBAMV.FAV_LISTA_ESPERA le

LEFT JOIN DBAMV.PACIENTE p
    ON p.CD_PACIENTE = le.CD_PACIENTE

LEFT JOIN DBAMV.ITEM_AGENDAMENTO ia
    ON ia.CD_ITEM_AGENDAMENTO = le.CD_IT_AGEND

LEFT JOIN DBAMV.PRESTADOR pr
    ON pr.CD_PRESTADOR = le.CD_PRESTADOR

WHERE le.CD_DOCUMENTO = 701
  AND TRUNC(le.DT_LANCA_LISTA, 'MM')
      = TRUNC(TO_DATE('01/11/2025', 'DD/MM/YYYY'), 'MM')

GROUP BY
    le.CD_PACIENTE,
    p.NM_PACIENTE,
    ia.DS_ITEM_AGENDAMENTO,
    pr.NM_PRESTADOR

ORDER BY
    p.NM_PACIENTE,
    ia.DS_ITEM_AGENDAMENTO;
