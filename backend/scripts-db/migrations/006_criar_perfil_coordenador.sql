-- =========================================================================
-- SCRIPT: Criar Perfil COORDENADOR com Acesso por Especialidade
-- =========================================================================
-- Propósito: Criar novo perfil COORDENADOR que visualiza PTS de sua especialidade
-- Data: 21 de maio de 2026
-- =========================================================================

-- =========================================================================
-- 1. INSERIR NOVO PERFIL COORDENADOR
-- =========================================================================
BEGIN
    INSERT INTO FAV_TB_PERFIS (DS_PERFIL, DS_DESCRICAO, FL_ATIVO)
    VALUES ('COORDENADOR', 'Coordenador de especialidade - acesso a todos os PTS da sua área', 1);
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('✓ Perfil COORDENADOR criado com sucesso');
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        DBMS_OUTPUT.PUT_LINE('✓ Perfil COORDENADOR já existe');
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('✗ Erro ao criar perfil: ' || SQLERRM);
        ROLLBACK;
END;
/

-- =========================================================================
-- 2. ATRIBUIR PERMISSÕES AO COORDENADOR (similar ao SUPERVISOR)
-- =========================================================================
-- Coordenador tem acesso a PTS, Audiometria, Imitanciometria (como OPERADOR)
-- MAS com visualização expandida por especialidade

BEGIN
    INSERT INTO FAV_TB_PERFIS_PERMISSOES (ID_PERFIL, ID_PERMISSAO)
    SELECT 
        (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'COORDENADOR'),
        ID_PERMISSAO
    FROM FAV_TB_PERMISSOES 
    WHERE FL_ATIVO = 1 
      AND (
        CD_PERMISSAO = 'PTS_VISUALIZAR' OR
        CD_PERMISSAO = 'PTS_CRIAR' OR
        CD_PERMISSAO = 'PTS_EDITAR' OR
        CD_PERMISSAO = 'PTS_FINALIZAR' OR
        CD_PERMISSAO = 'PTS_IMPRIMIR' OR
        CD_PERMISSAO = 'PTS_DASHBOARD' OR
        CD_PERMISSAO = 'PTS_CANCELAR' OR
        CD_PERMISSAO = 'AUDIOMETRIA_VISUALIZAR' OR
        CD_PERMISSAO = 'AUDIOMETRIA_CRIAR' OR
        CD_PERMISSAO = 'AUDIOMETRIA_EDITAR' OR
        CD_PERMISSAO = 'IMITANCIOMETRIA_VISUALIZAR' OR
        CD_PERMISSAO = 'IMITANCIOMETRIA_CRIAR' OR
        CD_PERMISSAO = 'IMITANCIOMETRIA_EDITAR' OR
        CD_PERMISSAO = 'AUDITORIA_VISUALIZAR'
      )
      AND NOT EXISTS (
        SELECT 1
        FROM FAV_TB_PERFIS_PERMISSOES pp
        WHERE pp.ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'COORDENADOR')
          AND pp.ID_PERMISSAO = FAV_TB_PERMISSOES.ID_PERMISSAO
      );
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('✓ Permissões atribuídas ao COORDENADOR');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('✗ Erro ao atribuir permissões: ' || SQLERRM);
        ROLLBACK;
END;
/

-- =========================================================================
-- 3. CRIAR TABELA DE RELACIONAMENTO: COORDENADORES X ESPECIALIDADES
-- =========================================================================
-- Esta tabela vincula um COORDENADOR (usuário) à(s) especialidade(s) que coordena
-- Nome reduzido para FAV_TB_COORD_ESP (30 chars max no Oracle)

BEGIN
    EXECUTE IMMEDIATE '
    CREATE TABLE FAV_TB_COORD_ESP (
        ID_COORD_ESP NUMBER(10) PRIMARY KEY,
        ID_USUARIO NUMBER(10) NOT NULL,
        DS_ESPECIALIDADE VARCHAR2(100) NOT NULL,
        DS_TIPO_PRESTA VARCHAR2(100),
        CD_ESPECIALIDADE VARCHAR2(20),
        DT_INICIO DATE DEFAULT SYSDATE NOT NULL,
        DT_FIM DATE,
        FL_ATIVO NUMBER(1) DEFAULT 1 NOT NULL,
        CONSTRAINT FK_COORD_ESP_USUARIO FOREIGN KEY (ID_USUARIO)
            REFERENCES FAV_TB_SILA_USUARIOS (ID_USUARIO) ON DELETE CASCADE
    )';
    
    DBMS_OUTPUT.PUT_LINE('✓ Tabela FAV_TB_COORD_ESP criada');
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE = -955 THEN
            DBMS_OUTPUT.PUT_LINE('✓ Tabela FAV_TB_COORD_ESP já existe');
        ELSE
            DBMS_OUTPUT.PUT_LINE('✗ Erro ao criar tabela: ' || SQLERRM);
        END IF;
END;
/

-- =========================================================================
-- 4. CRIAR SEQUÊNCIA PARA A TABELA
-- =========================================================================
BEGIN
    EXECUTE IMMEDIATE 'CREATE SEQUENCE SEQ_COORD_ESP START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE';
    DBMS_OUTPUT.PUT_LINE('✓ Sequência SEQ_COORD_ESP criada');
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE = -955 THEN
            DBMS_OUTPUT.PUT_LINE('✓ Sequência SEQ_COORD_ESP já existe');
        ELSE
            DBMS_OUTPUT.PUT_LINE('✗ Erro ao criar sequência: ' || SQLERRM);
        END IF;
END;
/

-- =========================================================================
-- 5. CRIAR TRIGGER DE AUTO-INCREMENTO
-- =========================================================================
BEGIN
    EXECUTE IMMEDIATE '
    CREATE OR REPLACE TRIGGER TRG_COORD_ESP_BI
    BEFORE INSERT ON FAV_TB_COORD_ESP FOR EACH ROW
    BEGIN
        IF :NEW.ID_COORD_ESP IS NULL THEN
            SELECT SEQ_COORD_ESP.NEXTVAL INTO :NEW.ID_COORD_ESP FROM DUAL;
        END IF;
        :NEW.DT_INICIO := SYSDATE;
    END';
    DBMS_OUTPUT.PUT_LINE('✓ Trigger TRG_COORD_ESP_BI criada');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('✗ Erro ao criar trigger: ' || SQLERRM);
END;
/

-- =========================================================================
-- 6. ATUALIZAR USUÁRIOS PARA PERFIL COORDENADOR
-- =========================================================================
-- Os 4 coordenadores mencionados:
-- ID 8  — WAGNER HENRIQUE DOS SANTOS (FISIOTERAPIA)
-- ID 3  — MONICA FRANCISCA M DOS SANTOS DOURADO (FONOAUDIOLOGIA)
-- ID 11 — CLAUDIA MARQUES DA SILVA (PSICOLOGIA)
-- ID 10 — JHONATAS DE OLIVEIRA SOARES DA SILVA (PSICOPEDAGOGIA)

BEGIN
    UPDATE FAV_TB_SILA_USUARIOS
    SET ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'COORDENADOR')
    WHERE ID_USUARIO IN (3, 8, 10, 11) AND FL_ATIVO = 1;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('✓ Usuários atualizados para perfil COORDENADOR: ' || SQL%ROWCOUNT || ' linhas');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('✗ Erro ao atualizar usuários: ' || SQLERRM);
        ROLLBACK;
END;
/

-- =========================================================================
-- 7. VINCULAR COORDENADORES ÀS SUAS ESPECIALIDADES
-- =========================================================================

BEGIN
    -- ID 8: WAGNER - FISIOTERAPIA
    INSERT INTO FAV_TB_COORD_ESP 
        (ID_USUARIO, DS_ESPECIALIDADE, DS_TIPO_PRESTA, FL_ATIVO)
    VALUES (8, 'FISIOTERAPIA', 'FISIOTERAPEUTA', 1);
    
    -- ID 3: MONICA - FONOAUDIOLOGIA
    INSERT INTO FAV_TB_COORD_ESP 
        (ID_USUARIO, DS_ESPECIALIDADE, DS_TIPO_PRESTA, FL_ATIVO)
    VALUES (3, 'FONOAUDIOLOGIA', 'FONOAUDIÓLOGO(A)', 1);
    
    -- ID 11: CLAUDIA - PSICOLOGIA
    INSERT INTO FAV_TB_COORD_ESP 
        (ID_USUARIO, DS_ESPECIALIDADE, DS_TIPO_PRESTA, FL_ATIVO)
    VALUES (11, 'PSICOLOGIA', 'PSICÓLOGO(A)', 1);
    
    -- ID 10: JHONATAS - PSICOPEDAGOGIA
    INSERT INTO FAV_TB_COORD_ESP 
        (ID_USUARIO, DS_ESPECIALIDADE, DS_TIPO_PRESTA, FL_ATIVO)
    VALUES (10, 'PSICOPEDAGOGIA', 'PSICOPEDAGOGO(A)', 1);
    
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('✓ Coordenadores vinculados às suas especialidades');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('✗ Erro ao vincular coordenadores: ' || SQLERRM);
        ROLLBACK;
END;
/

-- =========================================================================
-- 8. CRIAR FUNÇÃO DE VALIDAÇÃO: COORDENADOR PODE VER ESSA ESPECIALIDADE?
-- =========================================================================

CREATE OR REPLACE FUNCTION FN_COORDENADOR_ESPECIALIDADE(
    p_id_usuario IN NUMBER,
    p_especialidade IN VARCHAR2
) RETURN NUMBER IS
    v_count NUMBER := 0;
BEGIN
    -- Verifica se o usuário é COORDENADOR e se tem vínculo com essa especialidade
    SELECT COUNT(*) INTO v_count
    FROM FAV_TB_SILA_USUARIOS u
    JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
    LEFT JOIN FAV_TB_COORD_ESP ce ON u.ID_USUARIO = ce.ID_USUARIO
    WHERE u.ID_USUARIO = p_id_usuario
      AND u.FL_ATIVO = 1
      AND (
        -- Se for ADMIN, sempre retorna 1
        p.DS_PERFIL = 'ADMIN'
        -- Se for COORDENADOR, verifica vínculo com especialidade
        OR (p.DS_PERFIL = 'COORDENADOR' 
            AND ce.FL_ATIVO = 1 
            AND UPPER(ce.DS_ESPECIALIDADE) = UPPER(p_especialidade))
      );
    
    RETURN CASE WHEN v_count > 0 THEN 1 ELSE 0 END;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END FN_COORDENADOR_ESPECIALIDADE;
/

-- =========================================================================
-- 9. CRIAR VIEW: COORDENADORES E SUAS ESPECIALIDADES
-- =========================================================================

CREATE OR REPLACE VIEW VW_COORDENADORES AS
SELECT 
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.NM_USUARIO,
    u.DS_EMAIL,
    p.DS_PERFIL AS PERFIL,
    ce.DS_ESPECIALIDADE AS ESPECIALIDADE_COORDENADA,
    ce.DS_TIPO_PRESTA,
    ce.DT_INICIO,
    ce.DT_FIM,
    ce.FL_ATIVO,
    u.FL_ATIVO AS USUARIO_ATIVO
FROM FAV_TB_SILA_USUARIOS u
JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
LEFT JOIN FAV_TB_COORD_ESP ce ON u.ID_USUARIO = ce.ID_USUARIO
WHERE p.DS_PERFIL = 'COORDENADOR'
  AND u.FL_ATIVO = 1
ORDER BY ce.DS_ESPECIALIDADE, u.NM_USUARIO;

-- =========================================================================
-- 10. VALIDAÇÕES E QUERIES DE VERIFICAÇÃO
-- =========================================================================

-- Query: Ver todos os coordenadores e suas especialidades
PROMPT
PROMPT =========================================================================
PROMPT RESULTADO: COORDENADORES CRIADOS
PROMPT =========================================================================

SELECT * FROM VW_COORDENADORES;

-- Query: Validar que 4 coordenadores estão ativos
PROMPT
PROMPT =========================================================================
PROMPT VERIFICAÇÃO: Coordenadores por Especialidade
PROMPT =========================================================================

SELECT 
    DS_ESPECIALIDADE AS ESPECIALIDADE,
    COUNT(*) AS TOTAL_COORDENADORES,
    LISTAGG(NM_USUARIO, ', ') WITHIN GROUP (ORDER BY NM_USUARIO) AS COORDENADORES,
    CASE WHEN COUNT(*) > 0 THEN '✓ OK' ELSE '✗ VAZIO' END AS STATUS
FROM VW_COORDENADORES
GROUP BY DS_ESPECIALIDADE
ORDER BY DS_ESPECIALIDADE;

-- Query: Comparar perfis antes e depois
PROMPT
PROMPT =========================================================================
PROMPT VERIFICAÇÃO: Perfis dos 4 Coordenadores (IDs 3, 8, 10, 11)
PROMPT =========================================================================

SELECT 
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.NM_USUARIO,
    COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE) AS ESPECIALIDADE,
    p.DS_PERFIL AS PERFIL_ATUAL,
    ce.DS_ESPECIALIDADE AS COORDENA_ESPECIALIDADE,
    u.FL_ATIVO
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
LEFT JOIN FAV_TB_COORD_ESP ce ON u.ID_USUARIO = ce.ID_USUARIO
WHERE u.ID_USUARIO IN (3, 8, 10, 11)
ORDER BY u.ID_USUARIO;

-- Query: Testar função de validação
PROMPT
PROMPT =========================================================================
PROMPT TESTE: Função FN_COORDENADOR_ESPECIALIDADE
PROMPT =========================================================================

SELECT 
    ID_USUARIO,
    NM_USUARIO,
    DS_ESPECIALIDADE AS ESPECIALIDADE_COORDENADA,
    FN_COORDENADOR_ESPECIALIDADE(ID_USUARIO, DS_ESPECIALIDADE) AS PODE_ACESSAR
FROM VW_COORDENADORES
ORDER BY ID_USUARIO;

-- Query: Matriz de Permissões - COORDENADOR
PROMPT
PROMPT =========================================================================
PROMPT VERIFICAÇÃO: Permissões do Perfil COORDENADOR
PROMPT =========================================================================

SELECT 
    p.DS_PERFIL AS PERFIL,
    perm.CD_PERMISSAO AS PERMISSAO,
    perm.DS_PERMISSAO AS DESCRICAO,
    perm.DS_MODULO AS MODULO
FROM FAV_TB_PERFIS p
JOIN FAV_TB_PERFIS_PERMISSOES pp ON p.ID_PERFIL = pp.ID_PERFIL
JOIN FAV_TB_PERMISSOES perm ON pp.ID_PERMISSAO = perm.ID_PERMISSAO
WHERE p.DS_PERFIL = 'COORDENADOR'
  AND perm.FL_ATIVO = 1
ORDER BY perm.DS_MODULO, perm.CD_PERMISSAO;

-- =========================================================================
-- FIM DO SCRIPT
-- =========================================================================
PROMPT
PROMPT =========================================================================
PROMPT ✓ Script de Criação do Perfil COORDENADOR finalizado com sucesso!
PROMPT =========================================================================
PROMPT
PROMPT Próximos passos:
PROMPT 1. Validar que os 4 coordenadores estão com perfil COORDENADOR
PROMPT 2. Validar especialidades mapeadas corretamente
PROMPT 3. Testar a função FN_COORDENADOR_ESPECIALIDADE
PROMPT 4. Implementar validação no backend FastAPI
PROMPT
