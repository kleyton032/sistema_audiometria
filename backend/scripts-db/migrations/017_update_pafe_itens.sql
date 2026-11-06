-- =========================================================================
-- ATUALIZAÇÃO IDEMPOTENTE — PAFE: preenche Componente Executivo Alvo e
-- Critério de Observação Prática dos 25 itens.
--
-- Use este script SE o `15_psicologia_pafe.sql` já foi executado (tabelas e
-- itens já existem) e os itens ficaram com DS_COMPONENTE/DS_CRITERIO vazios.
-- Pode ser executado mais de uma vez sem erro.
-- =========================================================================

SET SQLBLANKLINES ON;

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Retenção de Comandos Longos',
    i.DS_CRITERIO   = 'Consegue reter e executar instruções verbais complexas com 3 ou mais etapas (ex: "Abra o livro na página 42, faça o exercício 3 e depois resuma o parágrafo no caderno") sem se perder.'
WHERE i.DS_CODIGO = 'MT-01'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Manipulação Mental de Informações',
    i.DS_CRITERIO   = 'Realiza raciocínios cruzados sem suporte visual (ex: argumentar contrapondo dois pontos de vista, sintetizar um texto recém-lido ou resolver cálculos mentais de cabeça).'
WHERE i.DS_CODIGO = 'MT-02'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Atualização de Conteúdo Dinâmico',
    i.DS_CRITERIO   = 'Adapta-se rapidamente quando as regras de um jogo de estratégia, esporte ou dinâmica de grupo mudam no meio da atividade, aplicando a nova regra imediatamente.'
WHERE i.DS_CODIGO = 'MT-03'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Manutenção do Foco Operacional',
    i.DS_CRITERIO   = 'Retoma a tarefa principal exatamente de onde parou após uma interrupção (ex: o celular vibra, um colega fala com ele ou o clínico faz uma pergunta) sem sofrer "esquecimento de intenção".'
WHERE i.DS_CODIGO = 'MT-04'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Resgate de Informações Recentes',
    i.DS_CRITERIO   = 'Mantém ativas na mente as regras do ambiente, do teste ou de um combinado prévio sem que o avaliador precise ficar relembrando o que pode ou não fazer.'
WHERE i.DS_CODIGO = 'MT-05'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Supressão de Respostas Automáticas',
    i.DS_CRITERIO   = 'Inibe a tendência de responder afoitamente ("chutar" alternativas, dar respostas impulsivas ou assinalar a primeira opção que vê) antes de ler a questão inteira.'
WHERE i.DS_CODIGO = 'CI-01'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Resistência à Distração (Foco Sustentado)',
    i.DS_CRITERIO   = 'Mantém-se engajado na atividade ignorando distratores do ambiente (barulho na rua, abas abertas no navegador, notificações de redes sociais ou pensamentos intrusivos).'
WHERE i.DS_CODIGO = 'CI-02'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Inibição de Impulsos Verbais e Sociais',
    i.DS_CRITERIO   = 'Aguarda a sua vez de falar, não interrompe a fala do clínico ou de colegas de forma ansiosa e tolera ouvir opiniões diferentes da sua sem reagir com agressividade.'
WHERE i.DS_CODIGO = 'CI-03'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Tolerância ao Atraso da Gratificação',
    i.DS_CRITERIO   = 'Suporta adiar o prazer imediato (como checar o celular, jogar ou comer um doce) em prol da conclusão de uma meta terapêutica ou tarefa escolar obrigatória.'
WHERE i.DS_CODIGO = 'CI-04'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Controle de Inquietação Motora e Vigor',
    i.DS_CRITERIO   = 'Monitora o próprio corpo, mantendo a postura sentada, o foco visual e o nível de energia necessários para tarefas de longa duração, sem precisar levantar ou se mexer o tempo todo.'
WHERE i.DS_CODIGO = 'CI-05'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Mudança de Critério Adaptativa',
    i.DS_CRITERIO   = 'Transita entre diferentes lógicas de raciocínio com facilidade (ex: sair da lógica estratégica e focada de um jogo eletrônico/tabuleiro e mudar imediatamente para uma dinâmica de adivinhações ou piadas.'
WHERE i.DS_CODIGO = 'FC-01'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Resiliência ao Erro (Abandono de Estratégia)',
    i.DS_CRITERIO   = 'Abandona uma estratégia ineficaz rapidamente quando percebe que ela não está funcionando. Não fica "preso" ou insistindo na mesma resposta errada por teimosia ou rigidez.'
WHERE i.DS_CODIGO = 'FC-02'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Geração de Alternativas (Fluência Divergente)',
    i.DS_CRITERIO   = 'Apresenta caminhos alternativos, saídas criativas ou soluções diferentes quando o plano A falha ou quando é desafiado por um enigma/problema social. Ex: Identifica sarcasmo ou ironias.'
WHERE i.DS_CODIGO = 'FC-03'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Adaptação a Imprevistos e Quebras de Rotina',
    i.DS_CRITERIO   = 'Lida com mudanças súbitas (queda da internet, falta de um material, alteração no horário da sessão) sem apresentar desorganização emocional, choro, ironia ou recusa em continuar.'
WHERE i.DS_CODIGO = 'FC-04'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Modulação Comportamental pelo Feedback',
    i.DS_CRITERIO   = 'Ajusta o tom de voz, a velocidade de execução ou a atitude ao captar pistas sutis e feedbacks do terapeuta (sejam verbais ou expressões faciais de desaprovação/alerta).'
WHERE i.DS_CODIGO = 'FC-05'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Análise de Metas e Escalonamento',
    i.DS_CRITERIO   = 'Decompõe uma tarefa grande ou complexa (ex: estudar para uma prova bimestral ou montar um projeto) em etapas menores e cronológicas antes de começar a executar.'
WHERE i.DS_CODIGO = 'PO-01'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Uso Eficiente do Tempo (Gestão de Prazos)',
    i.DS_CRITERIO   = 'Estima e cumpre o tempo de forma realista. Conclui as atividades dentro do prazo estipulado, sem se perder em detalhes irrelevantes (perfeccionismo paralisante) ou fazer correndo. Ex: Se preparar para uma feira de conhecimentos da escola.'
WHERE i.DS_CODIGO = 'PO-02'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Estratégia de Seleção de Recursos',
    i.DS_CRITERIO   = 'Separa, organiza e checa todas as ferramentas, materiais, cadernos ou links necessários antes de dar início à execução da tarefa.'
WHERE i.DS_CODIGO = 'PO-03'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Categorização e Agrupamento Abstrato',
    i.DS_CRITERIO   = 'Organiza pensamentos, objetos ou dados usando critérios sofisticados e abstratos (ex: hierarquizar prioridades de estudo, agrupar conceitos por afinidade semântica).'
WHERE i.DS_CODIGO = 'PO-04'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Antecipação de Consequências (Causa e Efeito)',
    i.DS_CRITERIO   = 'Prevê o impacto de suas ações a médio prazo antes de executá-las (ex: "Se eu gastar todo o tempo nessa primeira folha, não vai dar tempo de terminar o resto do teste").'
WHERE i.DS_CODIGO = 'PO-05'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Automonitoramento Operacional (Checagem)',
    i.DS_CRITERIO   = 'Revisa e confere o próprio trabalho espontaneamente durante o processo ou logo após finalizar, buscando identificar erros antes de fazer a entrega definitiva.'
WHERE i.DS_CODIGO = 'VP-01'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Decisão Baseada em Evidências',
    i.DS_CRITERIO   = 'Analisa criticamente os fatos e dados disponíveis antes de fazer uma escolha, em vez de decidir com base no "achismo", palpites puramente aleatórios ou pressão do momento.'
WHERE i.DS_CODIGO = 'VP-02'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Metacognição (Reconhecimento de Limites)',
    i.DS_CRITERIO   = 'Demonstra consciência clara sobre o que sabe e o que não sabe; solicita ajuda de forma assertiva e funcional quando a complexidade do desafio supera seu repertório atual.'
WHERE i.DS_CODIGO = 'VP-03'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Correção Autônoma de Rumos',
    i.DS_CRITERIO   = 'Ajusta o comportamento ou corrige uma palavra/cálculo no exato momento em que percebe o erro, sem a necessidade de que o terapeuta aponte ou dê um alerta.'
WHERE i.DS_CODIGO = 'VP-04'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

UPDATE FAV_TB_PSI_ITEM i
SET i.DS_COMPONENTE = 'Autoavaliação Realista de Desempenho',
    i.DS_CRITERIO   = 'Ao término da sessão ou tarefa, consegue expressar uma estimativa fidedigna e equilibrada sobre o seu rendimento (sem se subestimar e sem otimismo ingênuo).'
WHERE i.DS_CODIGO = 'VP-05'
  AND i.ID_PROTOCOLO = (SELECT ID_PROTOCOLO FROM FAV_TB_PSI_PROTOCOLO WHERE DS_CODIGO = 'PAFE' AND NR_VERSAO = '1.0' AND ROWNUM = 1);

COMMIT;
