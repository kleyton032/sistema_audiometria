-- =========================================================================
-- MÓDULO PSICOLOGIA — PASAC (Protocolo de Avaliação Socioemocional e
-- Ajuste Comportamental)
--
-- Reutiliza a estrutura e as sequências criadas no script
-- 15_psicologia_pafe.sql. Este script apenas registra um novo protocolo
-- (PASAC) e seus 20 itens na mesma infraestrutura.
--
-- Escala: 0 = Raramente/Inadequado; 1 = Em Desenvolvimento/Com Apoio;
--         2 = Frequente/Adequado
-- 4 domínios x 5 itens = 20 itens (máximo 10 pts/domínio e 40 global).
-- =========================================================================

SET SQLBLANKLINES ON;

-- ---------------------------------------------------------------------
-- Protocolo PASAC v1.0 (sem faixa etária definida)
-- ---------------------------------------------------------------------
INSERT INTO FAV_TB_PSI_PROTOCOLO (
    ID_PROTOCOLO, DS_CODIGO, NR_VERSAO, DS_TITULO,
    NR_IDADE_MIN, NR_IDADE_MAX, DS_FAIXA_ETARIA, DS_ESCALA,
    DT_VIGENCIA, DS_SITUACAO
) VALUES (
    SEQ_PSI_PROTOCOLO.NEXTVAL, 'PASAC', '1.0',
    'Protocolo de Avaliação Socioemocional e Ajuste Comportamental (PASAC)',
    NULL, NULL, NULL,
    '0 = Raramente/Inadequado; 1 = Em Desenvolvimento/Com Apoio; 2 = Frequente/Adequado',
    SYSDATE, 'ATIVO'
);

-- ---------------------------------------------------------------------
-- Domínio 1: Autorregulação e Ajuste Emocional (AR-01..AR-05)
-- ---------------------------------------------------------------------
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'AR-01', 'Autorregulação e Ajuste Emocional', 1,
       'Modulação de estados de alerta',
       'Consegue transitar de uma atividade de alta energia para uma calma sem desorganizar.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'AR-02', 'Autorregulação e Ajuste Emocional', 2,
       'Uso de estratégias de autoracalmamento',
       'Busca suporte ou utiliza estratégias reguladoras (respirar, afastar-se) quando sobrecarregado.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'AR-03', 'Autorregulação e Ajuste Emocional', 3,
       'Consciência/Identificação emocional',
       'Identifica ou expressa de forma funcional seu estado interno (ex: diz que está cansado/bravo).'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'AR-04', 'Autorregulação e Ajuste Emocional', 4,
       'Tolerância à transição de rotina',
       'Aceita a mudança de atividades estruturadas ou fim de preferências sem reações disruptivas.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'AR-05', 'Autorregulação e Ajuste Emocional', 5,
       'Tempo de latência para autorregulação',
       'Retorna ao estado basal de equilíbrio em tempo clinicamente aceitável após uma crise leve.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';

-- ---------------------------------------------------------------------
-- Domínio 2: Brincar Social e Interação Direta (BS-01..BS-05)
-- ---------------------------------------------------------------------
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'BS-01', 'Brincar Social e Interação Direta', 6,
       'Engajamento em brincadeiras compartilhadas',
       'Participa de jogos de regras simples ou brincadeiras com pares de forma interativa.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'BS-02', 'Brincar Social e Interação Direta', 7,
       'Comportamento de alternância de turnos',
       'Aguarda sua vez em jogos coletivos ou trocas comunicativas sem interceptar o outro.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'BS-03', 'Brincar Social e Interação Direta', 8,
       'Atenção conjunta no brincar',
       'Compartilha o foco de interesse do brinquedo com o parceiro, estabelecendo trocas de olhares.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'BS-04', 'Brincar Social e Interação Direta', 9,
       'Iniciação de interação social',
       'Busca o outro de forma funcional (vocal, gestual ou verbal) para propor ou estender o brincar.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'BS-05', 'Brincar Social e Interação Direta', 10,
       'Resposta a iniciativas sociais de pares',
       'Aceita abordagens de outras pessoas ou crianças, respondendo de forma coordenada e adaptativa.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';

-- ---------------------------------------------------------------------
-- Domínio 3: Indicadores Clínicos de Ansiedade (AN-01..AN-05)
-- ---------------------------------------------------------------------
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'AN-01', 'Indicadores Clínicos de Ansiedade', 11,
       'Ausência de manifestações somáticas de ansiedade',
       'Pontua 2 se NÃO apresenta sudorese, tremores, taquicardia ou inquietação motora excessiva sob demanda.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'AN-02', 'Indicadores Clínicos de Ansiedade', 12,
       'Flexibilidade cognitiva e aceitação do novo',
       'Adapta-se a novos materiais, terapeutas ou tarefas sem exibir rigidez ou recusa por insegurança.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'AN-03', 'Indicadores Clínicos de Ansiedade', 13,
       'Segurança na separação de figuras de apego',
       'Engaja-se no ambiente clínico de mesa sem busca hipervigilante ou choro pelo responsável.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'AN-04', 'Indicadores Clínicos de Ansiedade', 14,
       'Padrão de fala e estabilidade motora',
       'Mantém fluxo de fala e tônus muscular relaxado/funcional diante de perguntas ou testes.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'AN-05', 'Indicadores Clínicos de Ansiedade', 15,
       'Estabilidade comportamental / Tolerância ao erro',
       'Continua a tarefa mesmo se errar uma etapa, sem antecipar punições ou demonstrar medo excessivo.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';

-- ---------------------------------------------------------------------
-- Domínio 4: Resposta ao Baixo Limiar de Frustração (FR-01..FR-05)
-- ---------------------------------------------------------------------
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'FR-01', 'Resposta ao Baixo Limiar de Frustração', 16,
       'Tolerância à negativa / Resposta ao ''Não''',
       'Aceita limites impostos pelo avaliador sem manifestar episódios de oposição ou agressividade.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'FR-02', 'Resposta ao Baixo Limiar de Frustração', 17,
       'Persistência frente a tarefas difíceis',
       'Mantém o esforço em atividades desafiadoras em vez de abandonar imediatamente ou rasgar materiais.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'FR-03', 'Resposta ao Baixo Limiar de Frustração', 18,
       'Inibição de respostas impulsivas eruptivas',
       'Consegue conter reações físicas (bater, arremessar objetos) ao perder um jogo ou falhar em um teste.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'FR-04', 'Resposta ao Baixo Limiar de Frustração', 19,
       'Aceitação de ajuda profissional sob falha',
       'Permite que o avaliador dê dicas ou auxílio físico para corrigir o erro em vez de isolar-se.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'FR-05', 'Resposta ao Baixo Limiar de Frustração', 20,
       'Resiliência a perdas estruturadas',
       'Lida com situações em que o outro ganha a brincadeira mantendo o comportamento social neutro ou positivo.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PASAC' AND p.NR_VERSAO = '1.0';

COMMIT;
