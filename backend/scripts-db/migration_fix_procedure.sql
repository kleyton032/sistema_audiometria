-- =============================================================================
-- MIGRATION: Atualiza a procedure PRC_FAV_PTS_INSERE_FILA no banco de produção
-- 
-- Problema anterior: A procedure buscava o CD_PRESTADOR na tabela USUARIOS do MV
-- usando o nm_login do usuário, o que falhava silenciosamente quando o usuário
-- não estava cadastrado nessa tabela, deixando CD_PRESTADOR em branco na fila.
--
-- Correção: A procedure agora recebe o CD_PRESTADOR diretamente como parâmetro,
-- eliminando a dependência da busca na tabela USUARIOS.
-- =============================================================================

CREATE OR REPLACE PROCEDURE PRC_FAV_PTS_INSERE_FILA (
    p_id_pts       IN FAV_TB_PTS.ID_PTS%TYPE,
    p_cd_prestador IN NUMBER
)
AS
    v_nr_atendimento  FAV_TB_PTS.NR_ATENDIMENTO%TYPE;
    v_cd_atendimento  NUMBER;
    v_cd_documento    CONSTANT NUMBER := 701;

    v_qtde_loop  NUMBER;
    v_qt_total   NUMBER;
    v_existe     NUMBER;

    CURSOR c_terapias IS
        SELECT t.CD_TERAPIA,
               t.DS_TERAPIA,
               t.CD_TIPO_ATENDIMENTO,
               t.DS_TIPO_ATENDIMENTO,
               t.DS_PERIODICIDADE,
               t.NR_QTDE_SESSOES
          FROM FAV_TB_PTS_TERAPIA t
         WHERE t.ID_PTS = p_id_pts
           AND t.CD_TERAPIA IS NOT NULL
           AND t.NR_QTDE_SESSOES > 0;

BEGIN
    SELECT NR_ATENDIMENTO
      INTO v_nr_atendimento
      FROM FAV_TB_PTS
     WHERE ID_PTS = p_id_pts;

    v_cd_atendimento := TO_NUMBER(v_nr_atendimento);

    FOR r IN c_terapias LOOP

        UPDATE FAV_LISTA_ESPERA le
           SET le.TP_SITUACAO = 'C',
               le.OBSERV      = 'Cancelado automático - Renovação PTS '
                                || TO_CHAR(SYSDATE, 'DD/MM/YYYY HH24:MI')
                                || NVL2(le.OBSERV, ' | Obs anterior: ' || le.OBSERV, '')
         WHERE le.CD_PACIENTE  = (SELECT a.CD_PACIENTE
                                    FROM ATENDIME a
                                   WHERE a.CD_ATENDIMENTO = v_cd_atendimento)
           AND le.CD_IT_AGEND  = TO_NUMBER(r.CD_TERAPIA)
           AND le.CD_DOCUMENTO = v_cd_documento
           AND le.TP_SITUACAO IN ('S', 'G', 'M');

        SELECT COUNT(*)
          INTO v_existe
          FROM FAV_LISTA_ESPERA le
         WHERE le.CD_DOCUMENTO = v_cd_documento
           AND le.CD_PACIENTE  = (SELECT a.CD_PACIENTE
                                    FROM ATENDIME a
                                   WHERE a.CD_ATENDIMENTO = v_cd_atendimento)
           AND le.CD_IT_AGEND  = TO_NUMBER(r.CD_TERAPIA)
           AND le.TP_SITUACAO  = 'S';

        IF v_existe <= 0 THEN

            v_qtde_loop := r.NR_QTDE_SESSOES;
            v_qt_total  := r.NR_QTDE_SESSOES;

            WHILE v_qtde_loop > 0 LOOP

                INSERT INTO FAV_LISTA_ESPERA (
                    CD_ID_FILA,
                    CD_ATENDIMENTO,
                    CD_PACIENTE,
                    CD_PROCEDIMENTO,
                    DT_ATENDIMENTO,
                    CD_PRESTADOR,
                    CD_ORI_ATE,
                    CD_CONVENIO,
                    CD_MULTI_EMPRESA,
                    OLHO,
                    CD_IT_AGEND,
                    TP_SITUACAO,
                    OBSERV,
                    DT_LANCA_LISTA,
                    CD_LISTA_ESPERA,
                    CD_DOCUMENTO,
                    CD_PERG_OD,
                    CD_PERG_OE,
                    DT_RETORNO,
                    SN_COTA,
                    RESPOSTA_RETORNO,
                    CER_PERIODIC,
                    CER_TP_GRUP,
                    CER_QT_GRUP,
                    CER_TOT_SES,
                    CER_SESSAO
                ) VALUES (
                    SEQ_FILA_ESP.NEXTVAL,
                    v_cd_atendimento,
                    (SELECT a.CD_PACIENTE      FROM ATENDIME a  WHERE a.CD_ATENDIMENTO = v_cd_atendimento),
                    (SELECT CASE ia.TP_ITEM
                                WHEN 'A' THEN ia.CD_PROCEDIMENTO_SIA
                                WHEN 'I' THEN (SELECT er.CD_PROCEDIMENTO_SIA FROM EXA_RX  er WHERE er.CD_EXA_RX  = ia.CD_EXA_RX)
                                WHEN 'L' THEN (SELECT el.CD_PROCEDIMENTO_SIA FROM EXA_LAB el WHERE el.CD_EXA_LAB = ia.CD_EXA_LAB)
                             END
                       FROM ITEM_AGENDAMENTO ia
                      WHERE ia.CD_ITEM_AGENDAMENTO = TO_NUMBER(r.CD_TERAPIA)),
                    (SELECT a.DT_ATENDIMENTO   FROM ATENDIME a  WHERE a.CD_ATENDIMENTO = v_cd_atendimento),
                    p_cd_prestador,
                    (SELECT a.CD_ORI_ATE       FROM ATENDIME a  WHERE a.CD_ATENDIMENTO = v_cd_atendimento),
                    (SELECT a.CD_CONVENIO      FROM ATENDIME a  WHERE a.CD_ATENDIMENTO = v_cd_atendimento),
                    (SELECT a.CD_MULTI_EMPRESA FROM ATENDIME a  WHERE a.CD_ATENDIMENTO = v_cd_atendimento),
                    NULL,
                    TO_NUMBER(r.CD_TERAPIA),
                    'S',
                    NULL,
                    SYSDATE,
                    SEQ_FAV_LISTA_ESPERA.NEXTVAL,
                    v_cd_documento,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    NULL,
                    r.DS_PERIODICIDADE,
                    r.DS_TIPO_ATENDIMENTO,
                    r.CD_TIPO_ATENDIMENTO,
                    v_qt_total,
                    v_qtde_loop
                );

                v_qtde_loop := v_qtde_loop - 1;
            END LOOP;

        END IF;
    END LOOP;

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END PRC_FAV_PTS_INSERE_FILA;
/

-- Confirmar compilação sem erros
SELECT object_name, status
  FROM user_objects
 WHERE object_name = 'PRC_FAV_PTS_INSERE_FILA'
   AND object_type = 'PROCEDURE';


-- =============================================================================
-- CORREÇÃO 2: Procedure PRC_FAV_PTS_CANCELA_FILA
--
-- Problema: No banco de produção o END estava com nome errado:
--   "END FAV_PRC_PTS_CANCELA_FILA" ao invés de "END PRC_FAV_PTS_CANCELA_FILA"
-- Isso causava erro PLS-00113 ao compilar.
-- =============================================================================

CREATE OR REPLACE PROCEDURE PRC_FAV_PTS_CANCELA_FILA (
    p_id_pts  IN FAV_TB_PTS.ID_PTS%TYPE,
    p_motivo  IN VARCHAR2 DEFAULT 'Cancelado via PTS'
)
AS
    v_cd_atendimento NUMBER;
    v_cd_documento   CONSTANT NUMBER := 701;

BEGIN
    SELECT TO_NUMBER(NR_ATENDIMENTO)
      INTO v_cd_atendimento
      FROM FAV_TB_PTS
     WHERE ID_PTS = p_id_pts;

    UPDATE FAV_LISTA_ESPERA le
       SET le.TP_SITUACAO = 'C',
           le.OBSERV      = p_motivo
                            || ' - ' || TO_CHAR(SYSDATE, 'DD/MM/YYYY HH24:MI')
                            || NVL2(le.OBSERV, ' - ' || le.OBSERV, '')
     WHERE le.CD_DOCUMENTO   = v_cd_documento
       AND le.CD_ATENDIMENTO = v_cd_atendimento
       AND le.CD_IT_AGEND IN (
               SELECT TO_NUMBER(t.CD_TERAPIA)
                 FROM FAV_TB_PTS_TERAPIA t
                WHERE t.ID_PTS = p_id_pts
                  AND t.CD_TERAPIA IS NOT NULL
           )
       AND le.TP_SITUACAO IN ('S', 'G', 'M');

    UPDATE FAV_TB_PTS
       SET FL_ATIVO       = 0,
           DT_ATUALIZACAO = SYSDATE
     WHERE ID_PTS = p_id_pts;

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END PRC_FAV_PTS_CANCELA_FILA;
/

-- Confirmar compilação de ambas as procedures
SELECT object_name, status
  FROM user_objects
 WHERE object_name IN ('PRC_FAV_PTS_INSERE_FILA', 'PRC_FAV_PTS_CANCELA_FILA')
   AND object_type = 'PROCEDURE'
 ORDER BY object_name;
