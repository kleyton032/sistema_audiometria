-- =========================================================================
-- MÓDULO PSICOPEDAGOGIA — PAPE e PAHB
--   1. PAPE: Protocolo de Avaliação Psicopedagógica Específica (16 itens, máx 32 pts)
--   2. PAHB: Protocolo de Avaliação de Habilidades Básicas (26 itens, máx 52 pts)
--            já cadastrado em 019_psicologia_pahb.sql; aqui é habilitado também
--            para o módulo PSICOPEDAGOGIA.
--
-- Autorização: CD_TIP_PRESTA = 16 (PSICOPEDAGOGA) no MV.
-- Script IDEMPOTENTE: pode ser executado mais de uma vez sem erro.
-- =========================================================================

SET SQLBLANKLINES ON;

-- ---------------------------------------------------------------------
-- 1. Coluna DS_MODULO em FAV_TB_PSI_PROTOCOLO (para segmentar protocolos)
-- ---------------------------------------------------------------------
DECLARE
    v_cnt NUMBER := 0;
BEGIN
    SELECT COUNT(*)
      INTO v_cnt
      FROM USER_TAB_COLUMNS
     WHERE TABLE_NAME  = 'FAV_TB_PSI_PROTOCOLO'
       AND COLUMN_NAME = 'DS_MODULO';

    IF v_cnt = 0 THEN
        EXECUTE IMMEDIATE 'ALTER TABLE FAV_TB_PSI_PROTOCOLO ADD (DS_MODULO VARCHAR2(60) DEFAULT ''PSICOLOGIA'' NOT NULL)';
    END IF;
END;
/

-- Garante a segmentação dos protocolos existentes
UPDATE FAV_TB_PSI_PROTOCOLO
   SET DS_MODULO = 'PSICOLOGIA'
 WHERE DS_CODIGO IN ('PAFE', 'PASAC')
   AND DS_MODULO <> 'PSICOLOGIA';

UPDATE FAV_TB_PSI_PROTOCOLO
   SET DS_MODULO = 'PSICOLOGIA,PSICOPEDAGOGIA'
 WHERE DS_CODIGO = 'PAHB'
   AND DS_MODULO <> 'PSICOLOGIA,PSICOPEDAGOGIA';

-- Backfill de CD_TIP_PRESTA para prestadores já cadastrados sem o código
UPDATE FAV_TB_USUARIO_PRESTADOR p
   SET p.CD_TIP_PRESTA = (
       SELECT m.CD_TIP_PRESTA
         FROM DBAMV.PRESTADOR m
        WHERE m.CD_PRESTADOR = p.CD_PRESTADOR
   )
 WHERE p.CD_TIP_PRESTA IS NULL
   AND EXISTS (
       SELECT 1
         FROM DBAMV.PRESTADOR m
        WHERE m.CD_PRESTADOR = p.CD_PRESTADOR
          AND m.CD_TIP_PRESTA IS NOT NULL
   );

-- ---------------------------------------------------------------------
-- 2. Protocolo PAPE v1.0 (exclusivo PSICOPEDAGOGIA)
-- ---------------------------------------------------------------------
INSERT INTO FAV_TB_PSI_PROTOCOLO (
    ID_PROTOCOLO, DS_CODIGO, NR_VERSAO, DS_TITULO,
    NR_IDADE_MIN, NR_IDADE_MAX, DS_FAIXA_ETARIA, DS_ESCALA,
    DT_VIGENCIA, DS_SITUACAO, DS_MODULO
)
SELECT SEQ_PSI_PROTOCOLO.NEXTVAL, 'PAPE', '1.0',
       'Protocolo de Avaliação Psicopedagógica Específica (PAPE)',
       NULL, NULL, NULL,
       '0 = Não Adquirido; 1 = Em Desenvolvimento; 2 = Adquirido',
       SYSDATE, 'ATIVO', 'PSICOPEDAGOGIA'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAPE' AND NR_VERSAO = '1.0'
);

-- ---------------------------------------------------------------------
-- Domínio 1: Percepção Visual (HA-01..HA-05)
-- ---------------------------------------------------------------------
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'HA-01', 'Percepção Visual', 1,
       'Identificação de cores primárias',
       'Vermelho, Azul e Amarelo.'
FROM FAV_TB_PSI_PROTOCOLO p
WHERE p.DS_CODIGO = 'PAPE' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'HA-01');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'HA-02', 'Percepção Visual', 2,
       'Identificação de cores secundárias',
       'Verde, Laranja e Roxo.'
FROM FAV_TB_PSI_PROTOCOLO p
WHERE p.DS_CODIGO = 'PAPE' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'HA-02');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'HA-03', 'Percepção Visual', 3,
       'Identifica partes do corpo',
       NULL
FROM FAV_TB_PSI_PROTOCOLO p
WHERE p.DS_CODIGO = 'PAPE' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'HA-03');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'HA-04', 'Percepção Visual', 4,
       'Associação de Figuras e Sombras',
       'Emparelhamento visual.'
FROM FAV_TB_PSI_PROTOCOLO p
WHERE p.DS_CODIGO = 'PAPE' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'HA-04');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'HA-05', 'Percepção Visual', 5,
       'Identificação de formas geométricas',
       NULL
FROM FAV_TB_PSI_PROTOCOLO p
WHERE p.DS_CODIGO = 'PAPE' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'HA-05');

-- ---------------------------------------------------------------------
-- Domínio 2: Atenção & Concentração (HA-06..HA-07)
-- ---------------------------------------------------------------------
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'HA-06', 'Atenção & Concentração', 6,
       'Atenção focada em tarefa de mesa',
       NULL
FROM FAV_TB_PSI_PROTOCOLO p
WHERE p.DS_CODIGO = 'PAPE' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'HA-06');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'HA-07', 'Atenção & Concentração', 7,
       'Identificação de objetos comuns',
       NULL
FROM FAV_TB_PSI_PROTOCOLO p
WHERE p.DS_CODIGO = 'PAPE' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'HA-07');

-- ---------------------------------------------------------------------
-- Domínio 3: Leitura e Escrita (HA-08..HA-10)
-- ---------------------------------------------------------------------
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'HA-08', 'Leitura e Escrita', 8,
       'Reconhecimento de vocábulos simples',
       'Palavras familiares.'
FROM FAV_TB_PSI_PROTOCOLO p
WHERE p.DS_CODIGO = 'PAPE' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'HA-08');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'HA-09', 'Leitura e Escrita', 9,
       'Junções silábicas',
       'Formação e leitura de sílabas simples.'
FROM FAV_TB_PSI_PROTOCOLO p
WHERE p.DS_CODIGO = 'PAPE' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'HA-09');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'HA-10', 'Leitura e Escrita', 10,
       'Escrita espontânea e cópia',
       'Palavras e frases curtas.'
FROM FAV_TB_PSI_PROTOCOLO p
WHERE p.DS_CODIGO = 'PAPE' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'HA-10');

-- ---------------------------------------------------------------------
-- Domínio 4: Psicomotricidade (HA-11..HA-13)
-- ---------------------------------------------------------------------
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'HA-11', 'Psicomotricidade', 11,
       'Realiza desenhos livres ou dirigidos',
       NULL
FROM FAV_TB_PSI_PROTOCOLO p
WHERE p.DS_CODIGO = 'PAPE' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'HA-11');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'HA-12', 'Psicomotricidade', 12,
       'Preensão do lápis',
       'Evolução do padrão palmar para digital/trípode.'
FROM FAV_TB_PSI_PROTOCOLO p
WHERE p.DS_CODIGO = 'PAPE' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'HA-12');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'HA-13', 'Psicomotricidade', 13,
       'Coordenação olho-mão',
       'Alinhamento, recorte e precisão gráfica.'
FROM FAV_TB_PSI_PROTOCOLO p
WHERE p.DS_CODIGO = 'PAPE' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'HA-13');

-- ---------------------------------------------------------------------
-- Domínio 5: Raciocínio Lógico (HA-14..HA-16)
-- ---------------------------------------------------------------------
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'HA-14', 'Raciocínio Lógico', 14,
       'Noção de quantidade e seriação lógica',
       NULL
FROM FAV_TB_PSI_PROTOCOLO p
WHERE p.DS_CODIGO = 'PAPE' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'HA-14');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'HA-15', 'Raciocínio Lógico', 15,
       'Operações matemáticas simples — Adição',
       'Adição simples até 10.'
FROM FAV_TB_PSI_PROTOCOLO p
WHERE p.DS_CODIGO = 'PAPE' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'HA-15');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'HA-16', 'Raciocínio Lógico', 16,
       'Operações matemáticas simples — Subtração',
       'Subtração simples até 10.'
FROM FAV_TB_PSI_PROTOCOLO p
WHERE p.DS_CODIGO = 'PAPE' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'HA-16');

COMMIT;

