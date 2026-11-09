-- =========================================================================
-- MÓDULO PSICOLOGIA — PAHB (Protocolo de Avaliação de Habilidades Básicas)
-- Instrumento Clínico de Mapeamento e Registro de Marcos Clínicos
--
-- Reutiliza a infraestrutura e sequências criadas no script
-- 016_psicologia_pafe.sql. Este script apenas registra um novo protocolo
-- (PAHB) e seus 26 itens na mesma infraestrutura.
--
-- Script IDEMPOTENTE: utiliza WHERE NOT EXISTS para evitar erro
-- ORA-00001 (restrição exclusiva UQ_PSI_PROTOCOLO / UQ_PSI_ITEM_PROT)
-- caso seja executado mais de uma vez.
--
-- Escala: 0 = Não Adquirido; 1 = Em Desenvolvimento; 2 = Adquirido
-- 5 domínios:
--   1. Habilidades de Atenção (3 itens = máx 6 pts)
--   2. Habilidades de Imitação (6 itens = máx 12 pts)
--   3. Linguagem Receptiva (6 itens = máx 12 pts)
--   4. Linguagem Expressiva (8 itens = máx 16 pts)
--   5. Cognitivo e Áreas de Interesse (3 itens = máx 6 pts)
-- Total = 26 itens (máximo global 52 pts).
-- =========================================================================

SET SQLBLANKLINES ON;

-- ---------------------------------------------------------------------
-- Protocolo PAHB v1.0 (sem faixa etária definida)
-- ---------------------------------------------------------------------
INSERT INTO FAV_TB_PSI_PROTOCOLO (
    ID_PROTOCOLO, DS_CODIGO, NR_VERSAO, DS_TITULO,
    NR_IDADE_MIN, NR_IDADE_MAX, DS_FAIXA_ETARIA, DS_ESCALA,
    DT_VIGENCIA, DS_SITUACAO
)
SELECT SEQ_PSI_PROTOCOLO.NEXTVAL, 'PAHB', '1.0',
       'Protocolo de Avaliação de Habilidades Básicas (PAHB)',
       NULL, NULL, NULL,
       '0 = Não Adquirido; 1 = Em Desenvolvimento; 2 = Adquirido',
       SYSDATE, 'ATIVO'
FROM DUAL
WHERE NOT EXISTS (
    SELECT 1 FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAHB' AND NR_VERSAO = '1.0'
);

-- ---------------------------------------------------------------------
-- Domínio 1: Habilidades de Atenção (AT-01..AT-03)
-- ---------------------------------------------------------------------
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'AT-01', 'Habilidades de Atenção', 1,
       'Sentar sob comando',
       'Permanece sentado por 2 minutos em atividade guiada.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'AT-01');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'AT-02', 'Habilidades de Atenção', 2,
       'Esperar',
       'Aguarda reforço ou instrução por até 30 segundos sem comportamento disruptivo.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'AT-02');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'AT-03', 'Habilidades de Atenção', 3,
       'Contato visual',
       'Mantém contato visual por pelo menos 3 segundos ao ser chamado.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'AT-03');

-- ---------------------------------------------------------------------
-- Domínio 2: Habilidades de Imitação (IM-01..IM-06)
-- ---------------------------------------------------------------------
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'IM-01', 'Habilidades de Imitação', 4,
       'Imitar movimentos motores grossos',
       'Imita bater palmas, erguer braços, etc.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'IM-01');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'IM-02', 'Habilidades de Imitação', 5,
       'Imitar ações com objetos',
       'Imita empurrar carrinho, bater martelo de brinquedo.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'IM-02');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'IM-03', 'Habilidades de Imitação', 6,
       'Imitar movimentos motores finos',
       'Imita pinça, apontar de dedo indicador.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'IM-03');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'IM-04', 'Habilidades de Imitação', 7,
       'Imitar movimentos fonoarticulatórios',
       'Imita abrir boca, estalar língua, bico.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'IM-04');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'IM-05', 'Habilidades de Imitação', 8,
       'Imitar movimentos grossos em pé',
       'Imita pular, dar um passo atrás, girar.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'IM-05');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'IM-06', 'Habilidades de Imitação', 9,
       'Imitar sequência de movimentos',
       'Imita sequência de 2 ações (bater palma e depois a mesa).'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'IM-06');

-- ---------------------------------------------------------------------
-- Domínio 3: Linguagem Receptiva (LR-01..LR-06)
-- ---------------------------------------------------------------------
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'LR-01', 'Linguagem Receptiva', 10,
       'Seguir instruções de um passo',
       'Ex: ''Pegue o bloco'', ''Abra a porta''.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'LR-01');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'LR-02', 'Linguagem Receptiva', 11,
       'Seguir instruções de dois passos',
       'Ex: ''Pegue o bloco e coloque na caixa''.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'LR-02');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'LR-03', 'Linguagem Receptiva', 12,
       'Identificar partes do corpo',
       'Aponta pelo menos 3 partes do corpo em si.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'LR-03');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'LR-04', 'Linguagem Receptiva', 13,
       'Identificar pessoas e familiares',
       'Aponta para a mãe/foto quando perguntado.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'LR-04');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'LR-05', 'Linguagem Receptiva', 14,
       'Identificar objetos',
       'Seleciona objeto alvo em um group de 3 distractores.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'LR-05');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'LR-06', 'Linguagem Receptiva', 15,
       'Identificar figuras',
       'Aponta para a imagem correta em um livro de gravuras.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'LR-06');

-- ---------------------------------------------------------------------
-- Domínio 4: Linguagem Expressiva (LE-01..LE-08)
-- ---------------------------------------------------------------------
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'LE-01', 'Linguagem Expressiva', 16,
       'Apontar em direção a itens desejados',
       'Usa o apontar para realizar solicitações.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'LE-01');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'LE-02', 'Linguagem Expressiva', 17,
       'Produzir sons com função comunicativa',
       'Vocalizações direcionadas para pedir ou responder.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'LE-02');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'LE-03', 'Linguagem Expressiva', 18,
       'Imitar sons',
       'Ecoa fonemas ou palavras curtas apresentadas como modelo.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'LE-03');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'LE-04', 'Linguagem Expressiva', 19,
       'Aumentar pedidos vocais',
       'Faz uso ativo de palavras funcionais (''dá'', ''quero'', ''mais'').'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'LE-04');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'LE-05', 'Linguagem Expressiva', 20,
       'Nomear pessoas da família',
       'Diz o nome/termo correto (''mamãe'', ''papai'') ao ver a pessoa.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'LE-05');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'LE-06', 'Linguagem Expressiva', 21,
       'Nomear objetos',
       'Nomeia objetos do uso comum sob demanda.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'LE-06');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'LE-07', 'Linguagem Expressiva', 22,
       'Nomear figuras',
       'Diz o nome do elemento ao ver o flashcard.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'LE-07');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'LE-08', 'Linguagem Expressiva', 23,
       'Expressar desejos / sentimentos / dor',
       'Usa comunicação verbal para relatar estados internos.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'LE-08');

-- ---------------------------------------------------------------------
-- Domínio 5: Cognitivo e Áreas de Interesse (CG-01..CG-03)
-- ---------------------------------------------------------------------
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'CG-01', 'Cognitivo e Áreas de Interesse', 24,
       'Reconhece cores e formas',
       'Emparelha ou nomeia de forma consistente.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'CG-01');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'CG-02', 'Cognitivo e Áreas de Interesse', 25,
       'Reconhece letras e números',
       'Identifica grafemas ou numerais básicos.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'CG-02');

INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'CG-03', 'Cognitivo e Áreas de Interesse', 26,
       'Interesse por livros de histórias',
       'Engajamento ativo com materiais de leitura.'
FROM FAV_TB_PSI_PROTOCOLO p 
WHERE p.DS_CODIGO = 'PAHB' AND p.NR_VERSAO = '1.0'
  AND NOT EXISTS (SELECT 1 FROM FAV_TB_PSI_ITEM i WHERE i.ID_PROTOCOLO = p.ID_PROTOCOLO AND i.DS_CODIGO = 'CG-03');

COMMIT;
