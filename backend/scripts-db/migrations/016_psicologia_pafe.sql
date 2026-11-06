-- =========================================================================
-- MÓDULO PSICOLOGIA — PAFE (Protocolo de Avaliação de Funções Executivas)
-- Etapa 1: estrutura, catálogo e suporte à autorização por especialidade.
--
-- IMPORTANTE:
--   * O catálogo de itens (componente e critério) deve ser preenchido com a
--     redação OFICIAL do instrumento pela equipe clínica responsável. As
--     colunas DS_COMPONENTE e DS_CRITERIO são inseridas como NULL nesta
--     primeira carga e devem ser revisadas ANTES da homologação.
--   * A autorização usa o CD_TIP_PRESTA = 10 (psicólogo) sincronizado do MV.
-- =========================================================================

SET SQLBLANKLINES ON;

-- ---------------------------------------------------------------------
-- 1. Coluna canônica do tipo de prestador (necessária para autorização)
-- ---------------------------------------------------------------------
ALTER TABLE FAV_TB_USUARIO_PRESTADOR ADD (CD_TIP_PRESTA NUMBER(10));

-- ---------------------------------------------------------------------
-- 2. Sequências
-- ---------------------------------------------------------------------
CREATE SEQUENCE SEQ_PSI_PROTOCOLO START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_PSI_ITEM      START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_PSI_AVALIACAO START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_PSI_RESPOSTA  START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_PSI_RESULTADO START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE SEQ_PSI_EVENTO    START WITH 1 INCREMENT BY 1;

-- ---------------------------------------------------------------------
-- 3. Tabelas
-- ---------------------------------------------------------------------

CREATE TABLE FAV_TB_PSI_PROTOCOLO (
    ID_PROTOCOLO    NUMBER(10)    NOT NULL,
    DS_CODIGO       VARCHAR2(50)  NOT NULL,
    NR_VERSAO       VARCHAR2(20)  NOT NULL,
    DS_TITULO       VARCHAR2(200) NOT NULL,
    NR_IDADE_MIN    NUMBER(3),
    NR_IDADE_MAX    NUMBER(3),
    DS_FAIXA_ETARIA VARCHAR2(50),
    DS_ESCALA       VARCHAR2(4000),
    DT_VIGENCIA     DATE,
    DS_SITUACAO     VARCHAR2(20)  DEFAULT 'ATIVO' NOT NULL,
    CONSTRAINT PK_PSI_PROTOCOLO PRIMARY KEY (ID_PROTOCOLO),
    CONSTRAINT UQ_PSI_PROTOCOLO UNIQUE (DS_CODIGO, NR_VERSAO)
);

CREATE TABLE FAV_TB_PSI_ITEM (
    ID_ITEM       NUMBER(10)     NOT NULL,
    ID_PROTOCOLO  NUMBER(10)     NOT NULL,
    DS_CODIGO     VARCHAR2(20)   NOT NULL,
    DS_DOMINIO    VARCHAR2(100)  NOT NULL,
    NR_ORDEM      NUMBER(5)      NOT NULL,
    DS_COMPONENTE VARCHAR2(4000),
    DS_CRITERIO   CLOB,
    CONSTRAINT PK_PSI_ITEM PRIMARY KEY (ID_ITEM),
    CONSTRAINT UQ_PSI_ITEM_PROT UNIQUE (ID_PROTOCOLO, DS_CODIGO),
    CONSTRAINT FK_PSI_ITEM_PROT FOREIGN KEY (ID_PROTOCOLO)
        REFERENCES FAV_TB_PSI_PROTOCOLO (ID_PROTOCOLO)
);

CREATE TABLE FAV_TB_PSI_AVALIACAO (
    ID_AVALIACAO             NUMBER(10)     NOT NULL,
    CD_PACIENTE              VARCHAR2(20)   NOT NULL,
    CD_ATENDIMENTO           VARCHAR2(20),
    ID_USUARIO               NUMBER(10)     NOT NULL,
    CD_PRESTADOR             NUMBER(10),
    DT_CLINICA               DATE           NOT NULL,
    NR_IDADE_APLICACAO       NUMBER(3),
    ID_PROTOCOLO             NUMBER(10)     NOT NULL,
    DS_SITUACAO              VARCHAR2(20)   DEFAULT 'RASCUNHO' NOT NULL,
    DS_OBSERVACOES           CLOB,
    DS_EVOLUCAO              CLOB,
    DS_CONDUTA               CLOB,
    ID_PTS                   NUMBER(10),
    NR_REVISAO               NUMBER(10)     DEFAULT 0 NOT NULL,
    ID_AVALIACAO_RETIFICADA  NUMBER(10),
    DT_FINALIZACAO           DATE,
    DT_CANCELAMENTO          DATE,
    DS_MOTIVO_CANCELAMENTO   VARCHAR2(200),
    DT_CRIACAO               DATE           DEFAULT SYSDATE NOT NULL,
    DT_ATUALIZACAO           DATE,
    CONSTRAINT PK_PSI_AVALIACAO PRIMARY KEY (ID_AVALIACAO),
    CONSTRAINT FK_PSI_AVAL_USUARIO FOREIGN KEY (ID_USUARIO)
        REFERENCES FAV_TB_SILA_USUARIOS (ID_USUARIO),
    CONSTRAINT FK_PSI_AVAL_PROTOCOLO FOREIGN KEY (ID_PROTOCOLO)
        REFERENCES FAV_TB_PSI_PROTOCOLO (ID_PROTOCOLO)
);

CREATE TABLE FAV_TB_PSI_RESPOSTA (
    ID_RESPOSTA   NUMBER(10)   NOT NULL,
    ID_AVALIACAO  NUMBER(10)   NOT NULL,
    ID_ITEM       NUMBER(10)   NOT NULL,
    NR_VALOR      NUMBER(1)    NOT NULL,
    DS_OBSERVACAO CLOB,
    CONSTRAINT PK_PSI_RESPOSTA PRIMARY KEY (ID_RESPOSTA),
    CONSTRAINT UQ_PSI_RESPOSTA UNIQUE (ID_AVALIACAO, ID_ITEM),
    CONSTRAINT FK_PSI_RESP_AVAL FOREIGN KEY (ID_AVALIACAO)
        REFERENCES FAV_TB_PSI_AVALIACAO (ID_AVALIACAO) ON DELETE CASCADE,
    CONSTRAINT FK_PSI_RESP_ITEM FOREIGN KEY (ID_ITEM)
        REFERENCES FAV_TB_PSI_ITEM (ID_ITEM),
    CONSTRAINT CK_PSI_RESPOSTA_VALOR CHECK (NR_VALOR IN (0, 1, 2))
);

CREATE TABLE FAV_TB_PSI_RESULTADO (
    ID_RESULTADO NUMBER(10)    NOT NULL,
    ID_AVALIACAO NUMBER(10)    NOT NULL,
    DS_DOMINIO   VARCHAR2(100) NOT NULL,
    NR_SUBTOTAL  NUMBER(3)     NOT NULL,
    NR_MAXIMO    NUMBER(3)     NOT NULL,
    CONSTRAINT PK_PSI_RESULTADO PRIMARY KEY (ID_RESULTADO),
    CONSTRAINT UQ_PSI_RESULTADO UNIQUE (ID_AVALIACAO, DS_DOMINIO),
    CONSTRAINT FK_PSI_RES_AVAL FOREIGN KEY (ID_AVALIACAO)
        REFERENCES FAV_TB_PSI_AVALIACAO (ID_AVALIACAO) ON DELETE CASCADE
);

CREATE TABLE FAV_TB_PSI_EVENTO (
    ID_EVENTO    NUMBER(10)    NOT NULL,
    ID_AVALIACAO NUMBER(10)    NOT NULL,
    ID_USUARIO   NUMBER(10)    NOT NULL,
    DS_ACAO      VARCHAR2(50)  NOT NULL,
    DT_EVENTO    DATE          DEFAULT SYSDATE NOT NULL,
    DS_MOTIVO    VARCHAR2(4000),
    CONSTRAINT PK_PSI_EVENTO PRIMARY KEY (ID_EVENTO),
    CONSTRAINT FK_PSI_EVT_AVAL FOREIGN KEY (ID_AVALIACAO)
        REFERENCES FAV_TB_PSI_AVALIACAO (ID_AVALIACAO) ON DELETE CASCADE,
    CONSTRAINT FK_PSI_EVT_USUARIO FOREIGN KEY (ID_USUARIO)
        REFERENCES FAV_TB_SILA_USUARIOS (ID_USUARIO)
);

-- ---------------------------------------------------------------------
-- 4. Índices
-- ---------------------------------------------------------------------
CREATE INDEX IX_PSI_AVAL_PAC_DATA  ON FAV_TB_PSI_AVALIACAO (CD_PACIENTE, DT_CLINICA);
CREATE INDEX IX_PSI_AVAL_AUTOR_ST  ON FAV_TB_PSI_AVALIACAO (ID_USUARIO, DS_SITUACAO);
CREATE INDEX IX_PSI_AVAL_ATEND     ON FAV_TB_PSI_AVALIACAO (CD_ATENDIMENTO);
CREATE INDEX IX_PSI_RESPOSTA_AVAL  ON FAV_TB_PSI_RESPOSTA  (ID_AVALIACAO);
CREATE INDEX IX_PSI_RESULTADO_AVAL ON FAV_TB_PSI_RESULTADO (ID_AVALIACAO);
CREATE INDEX IX_PSI_EVENTO_AVAL    ON FAV_TB_PSI_EVENTO    (ID_AVALIACAO);

-- ---------------------------------------------------------------------
-- 5. Catálogo — Protocolo PAFE v1.0 (10 a 17 anos)
--    Componente Executivo Alvo + Critério de Observação Prática por item,
--    conforme instrumento oficial (redação extraída da planilha de origem).
-- ---------------------------------------------------------------------
INSERT INTO FAV_TB_PSI_PROTOCOLO (
    ID_PROTOCOLO, DS_CODIGO, NR_VERSAO, DS_TITULO,
    NR_IDADE_MIN, NR_IDADE_MAX, DS_FAIXA_ETARIA, DS_ESCALA,
    DT_VIGENCIA, DS_SITUACAO
) VALUES (
    SEQ_PSI_PROTOCOLO.NEXTVAL, 'PAFE', '1.0',
    'Protocolo de Avaliação de Funções Executivas',
    10, 17, '10 a 17 anos',
    '0 = Déficit Evidente; 1 = Executa com Pistas/Instável; 2 = Autônomo/Consolidado',
    SYSDATE, 'ATIVO'
);

-- Domínio 1: Memória de Trabalho (MT-01..MT-05)
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'MT-01', 'Memória de Trabalho', 1,
       'Retenção de Comandos Longos',
       'Consegue reter e executar instruções verbais complexas com 3 ou mais etapas (ex: "Abra o livro na página 42, faça o exercício 3 e depois resuma o parágrafo no caderno") sem se perder.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'MT-02', 'Memória de Trabalho', 2,
       'Manipulação Mental de Informações',
       'Realiza raciocínios cruzados sem suporte visual (ex: argumentar contrapondo dois pontos de vista, sintetizar um texto recém-lido ou resolver cálculos mentais de cabeça).'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'MT-03', 'Memória de Trabalho', 3,
       'Atualização de Conteúdo Dinâmico',
       'Adapta-se rapidamente quando as regras de um jogo de estratégia, esporte ou dinâmica de grupo mudam no meio da atividade, aplicando a nova regra imediatamente.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'MT-04', 'Memória de Trabalho', 4,
       'Manutenção do Foco Operacional',
       'Retoma a tarefa principal exatamente de onde parou após uma interrupção (ex: o celular vibra, um colega fala com ele ou o clínico faz uma pergunta) sem sofrer "esquecimento de intenção".'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'MT-05', 'Memória de Trabalho', 5,
       'Resgate de Informações Recentes',
       'Mantém ativas na mente as regras do ambiente, do teste ou de um combinado prévio sem que o avaliador precise ficar relembrando o que pode ou não fazer.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';

-- Domínio 2: Controle Inibitório e Volição (CI-01..CI-05)
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'CI-01', 'Controle Inibitório e Volição', 6,
       'Supressão de Respostas Automáticas',
       'Inibe a tendência de responder afoitamente ("chutar" alternativas, dar respostas impulsivas ou assinalar a primeira opção que vê) antes de ler a questão inteira.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'CI-02', 'Controle Inibitório e Volição', 7,
       'Resistência à Distração (Foco Sustentado)',
       'Mantém-se engajado na atividade ignorando distratores do ambiente (barulho na rua, abas abertas no navegador, notificações de redes sociais ou pensamentos intrusivos).'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'CI-03', 'Controle Inibitório e Volição', 8,
       'Inibição de Impulsos Verbais e Sociais',
       'Aguarda a sua vez de falar, não interrompe a fala do clínico ou de colegas de forma ansiosa e tolera ouvir opiniões diferentes da sua sem reagir com agressividade.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'CI-04', 'Controle Inibitório e Volição', 9,
       'Tolerância ao Atraso da Gratificação',
       'Suporta adiar o prazer imediato (como checar o celular, jogar ou comer um doce) em prol da conclusão de uma meta terapêutica ou tarefa escolar obrigatória.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'CI-05', 'Controle Inibitório e Volição', 10,
       'Controle de Inquietação Motora e Vigor',
       'Monitora o próprio corpo, mantendo a postura sentada, o foco visual e o nível de energia necessários para tarefas de longa duração, sem precisar levantar ou se mexer o tempo todo.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';

-- Domínio 3: Flexibilidade Cognitiva (FC-01..FC-05)
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'FC-01', 'Flexibilidade Cognitiva', 11,
       'Mudança de Critério Adaptativa',
       'Transita entre diferentes lógicas de raciocínio com facilidade (ex: sair da lógica estratégica e focada de um jogo eletrônico/tabuleiro e mudar imediatamente para uma dinâmica de adivinhações ou piadas.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'FC-02', 'Flexibilidade Cognitiva', 12,
       'Resiliência ao Erro (Abandono de Estratégia)',
       'Abandona uma estratégia ineficaz rapidamente quando percebe que ela não está funcionando. Não fica "preso" ou insistindo na mesma resposta errada por teimosia ou rigidez.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'FC-03', 'Flexibilidade Cognitiva', 13,
       'Geração de Alternativas (Fluência Divergente)',
       'Apresenta caminhos alternativos, saídas criativas ou soluções diferentes quando o plano A falha ou quando é desafiado por um enigma/problema social. Ex: Identifica sarcasmo ou ironias.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'FC-04', 'Flexibilidade Cognitiva', 14,
       'Adaptação a Imprevistos e Quebras de Rotina',
       'Lida com mudanças súbitas (queda da internet, falta de um material, alteração no horário da sessão) sem apresentar desorganização emocional, choro, ironia ou recusa em continuar.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'FC-05', 'Flexibilidade Cognitiva', 15,
       'Modulação Comportamental pelo Feedback',
       'Ajusta o tom de voz, a velocidade de execução ou a atitude ao captar pistas sutis e feedbacks do terapeuta (sejam verbais ou expressões faciais de desaprovação/alerta).'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';

-- Domínio 4: Planejamento e Organização (PO-01..PO-05)
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'PO-01', 'Planejamento e Organização', 16,
       'Análise de Metas e Escalonamento',
       'Decompõe uma tarefa grande ou complexa (ex: estudar para uma prova bimestral ou montar um projeto) em etapas menores e cronológicas antes de começar a executar.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'PO-02', 'Planejamento e Organização', 17,
       'Uso Eficiente do Tempo (Gestão de Prazos)',
       'Estima e cumpre o tempo de forma realista. Conclui as atividades dentro do prazo estipulado, sem se perder em detalhes irrelevantes (perfeccionismo paralisante) ou fazer correndo. Ex: Se preparar para uma feira de conhecimentos da escola.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'PO-03', 'Planejamento e Organização', 18,
       'Estratégia de Seleção de Recursos',
       'Separa, organiza e checa todas as ferramentas, materiais, cadernos ou links necessários antes de dar início à execução da tarefa.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'PO-04', 'Planejamento e Organização', 19,
       'Categorização e Agrupamento Abstrato',
       'Organiza pensamentos, objetos ou dados usando critérios sofisticados e abstratos (ex: hierarquizar prioridades de estudo, agrupar conceitos por afinidade semântica).'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'PO-05', 'Planejamento e Organização', 20,
       'Antecipação de Consequências (Causa e Efeito)',
       'Prevê o impacto de suas ações a médio prazo antes de executá-las (ex: "Se eu gastar todo o tempo nessa primeira folha, não vai dar tempo de terminar o resto do teste").'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';

-- Domínio 5: Tomada de Decisão e Monitoramento / Metacognição (VP-01..VP-05)
-- Preserva os códigos VP da referência (sigla legada).
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'VP-01', 'Tomada de Decisão e Monitoramento / Metacognição', 21,
       'Automonitoramento Operacional (Checagem)',
       'Revisa e confere o próprio trabalho espontaneamente durante o processo ou logo após finalizar, buscando identificar erros antes de fazer a entrega definitiva.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'VP-02', 'Tomada de Decisão e Monitoramento / Metacognição', 22,
       'Decisão Baseada em Evidências',
       'Analisa criticamente os fatos e dados disponíveis antes de fazer uma escolha, em vez de decidir com base no "achismo", palpites puramente aleatórios ou pressão do momento.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'VP-03', 'Tomada de Decisão e Monitoramento / Metacognição', 23,
       'Metacognição (Reconhecimento de Limites)',
       'Demonstra consciência clara sobre o que sabe e o que não sabe; solicita ajuda de forma assertiva e funcional quando a complexidade do desafio supera seu repertório atual.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'VP-04', 'Tomada de Decisão e Monitoramento / Metacognição', 24,
       'Correção Autônoma de Rumos',
       'Ajusta o comportamento ou corrige uma palavra/cálculo no exato momento em que percebe o erro, sem a necessidade de que o terapeuta aponte ou dê um alerta.'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';
INSERT INTO FAV_TB_PSI_ITEM (ID_ITEM, ID_PROTOCOLO, DS_CODIGO, DS_DOMINIO, NR_ORDEM, DS_COMPONENTE, DS_CRITERIO)
SELECT SEQ_PSI_ITEM.NEXTVAL, p.ID_PROTOCOLO, 'VP-05', 'Tomada de Decisão e Monitoramento / Metacognição', 25,
       'Autoavaliação Realista de Desempenho',
       'Ao término da sessão ou tarefa, consegue expressar uma estimativa fidedigna e equilibrada sobre o seu rendimento (sem se subestimar e sem otimismo ingênuo).'
FROM FAV_TB_PSI_PROTOCOLO p WHERE p.DS_CODIGO = 'PAFE' AND p.NR_VERSAO = '1.0';

COMMIT;
