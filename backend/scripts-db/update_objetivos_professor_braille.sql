-- ============================================================================
-- SCRIPT PARA ATUALIZAR OBJETIVOS DE PROFESSOR DE BRAILLE
-- Tabela: FAV_TB_OBJETIVO_CERIV
-- Especialidade: (Professor de Braille)
-- ============================================================================

DECLARE
    v_max_id NUMBER;
    v_count NUMBER := 0;
    v_id_especialidade NUMBER;
BEGIN
    -- 0. Descobrir ou criar a Especialidade "PROFESSOR DE BRAILLE" dinamicamente
    BEGIN
        SELECT ID_ESPECIALIDADE INTO v_id_especialidade
        FROM FAV_TB_ESP_OBJETIVO_CERIV
        WHERE UPPER(DS_ESPECIALIDADE) = 'PROFESSOR DE BRAILLE'
        AND ROWNUM = 1;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            SELECT NVL(MAX(ID_ESPECIALIDADE), 0) + 1 INTO v_id_especialidade 
            FROM FAV_TB_ESP_OBJETIVO_CERIV;
            
            INSERT INTO FAV_TB_ESP_OBJETIVO_CERIV (ID_ESPECIALIDADE, DS_ESPECIALIDADE)
            VALUES (v_id_especialidade, 'PROFESSOR DE BRAILLE');
    END;

    -- 1. Inativar os objetivos antigos dessa especialidade
    UPDATE FAV_TB_OBJETIVO_CERIV
    SET IC_ATIVO = 'N'
    WHERE ID_ESPECIALIDADE = v_id_especialidade;

    -- 2. Descobrir o ID máximo para continuar a sequência
    SELECT NVL(MAX(ID_OBJETIVO), 0) INTO v_max_id FROM FAV_TB_OBJETIVO_CERIV;
    
    -- 3. Inserir a nova lista de objetivos
    FOR rec IN (
        SELECT 'Aprender a utilizar lupa do smartphone.' AS objetivo FROM DUAL UNION ALL
        SELECT 'Aprender a utilizar lupa do computador.' FROM DUAL UNION ALL
        SELECT 'Aprender a configurar ampliação de tela, tamanho de fonte, contraste e cores.' FROM DUAL UNION ALL
        SELECT 'Aprender a utilizar lupa eletrônica.' FROM DUAL UNION ALL
        SELECT 'Aprender a utilizar recursos ópticos prescritos.' FROM DUAL UNION ALL
        SELECT 'Aprender a utilizar recursos não ópticos para leitura e escrita.' FROM DUAL UNION ALL
        SELECT 'Aprender a adaptar documentos digitais para leitura.' FROM DUAL UNION ALL
        SELECT 'Aprender a utilizar recursos de inteligência artificial para descrição e leitura de conteúdos.' FROM DUAL UNION ALL
        SELECT 'Comandos básicos do TalkBack.' FROM DUAL UNION ALL
        SELECT 'Comandos básicos do Voice Over.' FROM DUAL UNION ALL
        SELECT 'Comandos básicos do NVDA.' FROM DUAL UNION ALL
        SELECT 'Comandos básicos do Dosvox.' FROM DUAL UNION ALL
        SELECT 'Aprender a usar o Assistente de voz ou o Gemini.' FROM DUAL UNION ALL
        SELECT 'Aprender a usar a Siri.' FROM DUAL UNION ALL
        SELECT 'Atender e encerrar chamadas.' FROM DUAL UNION ALL
        SELECT 'Aprender a usar o WhatsApp.' FROM DUAL UNION ALL
        SELECT 'Aprender a usar o WhatsApp Web.' FROM DUAL UNION ALL
        SELECT 'Teste de teclado com NVDA.' FROM DUAL UNION ALL
        SELECT 'Teste de teclado com Dosvox.' FROM DUAL UNION ALL
        SELECT 'Aprender a usar o teclado de discagem.' FROM DUAL UNION ALL
        SELECT 'Aprender a digitação por voz.' FROM DUAL UNION ALL
        SELECT 'Aprender a digitação de textos com o teclado Gboard ou iOS.' FROM DUAL UNION ALL
        SELECT 'Aprender as configurações do TalkBack.' FROM DUAL UNION ALL
        SELECT 'Aprender as configurações do Voice Over.' FROM DUAL UNION ALL
        SELECT 'Aprender as configurações do Dosvox.' FROM DUAL UNION ALL
        SELECT 'Aprender a usar aplicativos de reconhecimento de textos e imagens.' FROM DUAL UNION ALL
        SELECT 'Aprender a usar leitor de documentos.' FROM DUAL UNION ALL
        SELECT 'Aprender a usar GPS.' FROM DUAL UNION ALL
        SELECT 'Aprender a solicitar viagens por aplicativo de mobilidade urbana.' FROM DUAL UNION ALL
        SELECT 'Aprender a fazer PIX.' FROM DUAL UNION ALL
        SELECT 'Aprender a usar aplicativos bancários para gerenciar contas.' FROM DUAL UNION ALL
        SELECT 'Aprender a usar aplicativos bancários para gerenciar cartão de crédito.' FROM DUAL UNION ALL
        SELECT 'Aprender a criar textos com o Word.' FROM DUAL UNION ALL
        SELECT 'Aprender a criar textos com o Google Docs.' FROM DUAL UNION ALL
        SELECT 'Aprender a criar planilhas com o Excel.' FROM DUAL UNION ALL
        SELECT 'Aprender a criar planilhas com o Google Sheets.' FROM DUAL UNION ALL
        SELECT 'Aprender a criar apresentações com o PowerPoint.' FROM DUAL UNION ALL
        SELECT 'Aprender a criar apresentações com o Google Apresentações.' FROM DUAL UNION ALL
        SELECT 'Aprender a usar Microsoft Teams.' FROM DUAL UNION ALL
        SELECT 'Aprender a usar Google Meet.' FROM DUAL UNION ALL
        SELECT 'Aprender a usar blocos de notas.' FROM DUAL UNION ALL
        SELECT 'Aprender edição de textos com leitores de telas.' FROM DUAL UNION ALL
        SELECT 'Aprender a gerenciar arquivos em nuvem.' FROM DUAL UNION ALL
        SELECT 'Aprender a instalar aplicativos a partir da loja oficial de apps.' FROM DUAL UNION ALL
        SELECT 'Aprender a instalar aplicativos a partir do site oficial do desenvolvedor.' FROM DUAL UNION ALL
        SELECT 'Aprender a desinstalar aplicativos.' FROM DUAL UNION ALL
        SELECT 'Aprender configurações básicas do aparelho.' FROM DUAL UNION ALL
        SELECT 'Desenvolver a percepção de diferentes texturas e tamanhos.' FROM DUAL UNION ALL
        SELECT 'Desenvolver a percepção de perto e longe.' FROM DUAL UNION ALL
        SELECT 'Aprender a distinguir formas, tamanhos e texturas.' FROM DUAL UNION ALL
        SELECT 'Desenvolver coordenação fina.' FROM DUAL UNION ALL
        SELECT 'Desenvolver a orientation espacial no seguimento de linha.' FROM DUAL UNION ALL
        SELECT 'Aprender a localização dos pontos Braille.' FROM DUAL UNION ALL
        SELECT 'Compreender a orientação espacial na sela e na régua Braille.' FROM DUAL UNION ALL
        SELECT 'Aprender alfabeto Braille usando diferentes selas Braille.' FROM DUAL UNION ALL
        SELECT 'Iniciar leitura do alfabeto em Braille com letras separadas.' FROM DUAL UNION ALL
        SELECT 'Leitura de palavras com letras juntas e linhas separadas.' FROM DUAL UNION ALL
        SELECT 'Leitura de frases com letras juntas e linhas separadas.' FROM DUAL UNION ALL
        SELECT 'Leitura de frases com letras e linhas juntas.' FROM DUAL UNION ALL
        SELECT 'Aprender letras com acento.' FROM DUAL UNION ALL
        SELECT 'Aprender números em Braille.' FROM DUAL UNION ALL
        SELECT 'Aprender sinal de Maiúscula e caixa alta.' FROM DUAL UNION ALL
        SELECT 'Aprender pontuação.' FROM DUAL UNION ALL
        SELECT 'Aprender sinais matemáticos.' FROM DUAL UNION ALL
        SELECT 'Aprender sinais informáticos.' FROM DUAL UNION ALL
        SELECT 'Aprender sinais específicos do Braille.' FROM DUAL UNION ALL
        SELECT 'Aprender uso de parêntese.' FROM DUAL UNION ALL
        SELECT 'Aprender uso de Colchetes e chaves.' FROM DUAL UNION ALL
        SELECT 'Aprender uso de aspas.' FROM DUAL UNION ALL
        SELECT 'Aprender uso dos parágrafos.' FROM DUAL UNION ALL
        SELECT 'Aprender a aplicar o recuo de dois em diversos tipos de formatação.' FROM DUAL UNION ALL
        SELECT 'Melhorar fluência de leitura.' FROM DUAL UNION ALL
        SELECT 'Melhorar reconhecimento de letras e símbolos do sistema Braille.' FROM DUAL UNION ALL
        SELECT 'Melhorar compreensão de palavras ou frases lidas.' FROM DUAL UNION ALL
        SELECT 'Aprender a usar Reglete e punção, fazendo seguimento de linhas.' FROM DUAL UNION ALL
        SELECT 'Iniciar escrita Braille na reglete.' FROM DUAL UNION ALL
        SELECT 'Melhorar escrita.' FROM DUAL
    ) LOOP
        v_count := v_count + 1;
        INSERT INTO FAV_TB_OBJETIVO_CERIV (ID_OBJETIVO, ID_ESPECIALIDADE, DS_OBJETIVO, IC_ATIVO)
        VALUES (v_max_id + v_count, v_id_especialidade, rec.objetivo, 'S');
    END LOOP;

    DBMS_OUTPUT.PUT_LINE('Inseridos ' || v_count || ' novos objetivos para Professor de Braille.');
END;
/
COMMIT;
