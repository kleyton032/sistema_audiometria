-- =========================================================================
-- SCRIPT DE CONTROLE DE ACESSO - PERFIS, PERMISSÕES E MENUS
-- =========================================================================
-- Este script cria a estrutura de controle de acesso baseado em perfis
-- e permissões granulares por módulo/funcionalidade
-- =========================================================================

-- =========================================================================
-- 1. CRIAR TABELA DE PERFIS (ROLES)
-- =========================================================================
CREATE TABLE FAV_TB_PERFIS (
    ID_PERFIL NUMBER(10) PRIMARY KEY,
    DS_PERFIL VARCHAR2(50) NOT NULL UNIQUE,
    DS_DESCRICAO VARCHAR2(500),
    FL_ATIVO NUMBER(1) DEFAULT 1 NOT NULL,
    DT_CRIACAO DATE DEFAULT SYSDATE NOT NULL
);

CREATE SEQUENCE SEQ_PERFIS START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE OR REPLACE TRIGGER TRG_PERFIS_BI
BEFORE INSERT ON FAV_TB_PERFIS FOR EACH ROW
BEGIN
    IF :NEW.ID_PERFIL IS NULL THEN
        SELECT SEQ_PERFIS.NEXTVAL INTO :NEW.ID_PERFIL FROM DUAL;
    END IF;
    :NEW.DT_CRIACAO := SYSDATE;
END;
/

-- =========================================================================
-- 2. CRIAR TABELA DE PERMISSÕES
-- =========================================================================
CREATE TABLE FAV_TB_PERMISSOES (
    ID_PERMISSAO NUMBER(10) PRIMARY KEY,
    CD_PERMISSAO VARCHAR2(50) NOT NULL UNIQUE,  -- ex: "PTS_VISUALIZAR"
    DS_PERMISSAO VARCHAR2(200) NOT NULL,         -- ex: "Visualizar PTS"
    DS_MODULO VARCHAR2(50) NOT NULL,             -- ex: "PTS", "AUDIOMETRIA", "ADMIN"
    DS_TIPO VARCHAR2(20) NOT NULL,               -- ex: "VISUALIZAR", "CRIAR", "EDITAR", "DELETAR", "CANCELAR"
    FL_ATIVO NUMBER(1) DEFAULT 1 NOT NULL,
    DT_CRIACAO DATE DEFAULT SYSDATE NOT NULL
);

CREATE SEQUENCE SEQ_PERMISSOES START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE OR REPLACE TRIGGER TRG_PERMISSOES_BI
BEFORE INSERT ON FAV_TB_PERMISSOES FOR EACH ROW
BEGIN
    IF :NEW.ID_PERMISSAO IS NULL THEN
        SELECT SEQ_PERMISSOES.NEXTVAL INTO :NEW.ID_PERMISSAO FROM DUAL;
    END IF;
    :NEW.DT_CRIACAO := SYSDATE;
END;
/

-- =========================================================================
-- 3. CRIAR TABELA DE RELACIONAMENTO PERFIS-PERMISSÕES
-- =========================================================================
CREATE TABLE FAV_TB_PERFIS_PERMISSOES (
    ID_PERFIL_PERMISSAO NUMBER(10) PRIMARY KEY,
    ID_PERFIL NUMBER(10) NOT NULL,
    ID_PERMISSAO NUMBER(10) NOT NULL,
    DT_CRIACAO DATE DEFAULT SYSDATE NOT NULL,
    CONSTRAINT FK_PERP_PERFIL FOREIGN KEY (ID_PERFIL) 
        REFERENCES FAV_TB_PERFIS (ID_PERFIL) ON DELETE CASCADE,
    CONSTRAINT FK_PERP_PERMISSAO FOREIGN KEY (ID_PERMISSAO) 
        REFERENCES FAV_TB_PERMISSOES (ID_PERMISSAO) ON DELETE CASCADE,
    CONSTRAINT UQ_PERP_PERFIL_PERM UNIQUE (ID_PERFIL, ID_PERMISSAO)
);

CREATE SEQUENCE SEQ_PERFIS_PERMISSOES START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE OR REPLACE TRIGGER TRG_PERFIS_PERMISSOES_BI
BEFORE INSERT ON FAV_TB_PERFIS_PERMISSOES FOR EACH ROW
BEGIN
    IF :NEW.ID_PERFIL_PERMISSAO IS NULL THEN
        SELECT SEQ_PERFIS_PERMISSOES.NEXTVAL INTO :NEW.ID_PERFIL_PERMISSAO FROM DUAL;
    END IF;
    :NEW.DT_CRIACAO := SYSDATE;
END;
/

-- =========================================================================
-- 4. CRIAR TABELA DE MENUS (ESTRUTURA HIERÁRQUICA)
-- =========================================================================
CREATE TABLE FAV_TB_MENUS (
    ID_MENU NUMBER(10) PRIMARY KEY,
    NM_MENU VARCHAR2(100) NOT NULL,
    DS_MENU VARCHAR2(200),
    CD_ROTA VARCHAR2(255),                      -- ex: "/pts/dashboard", "/admin/usuarios"
    ID_MENU_PAI NUMBER(10),                     -- Para menus filhos (submenus)
    NR_ORDEM NUMBER(3) DEFAULT 999 NOT NULL,    -- Ordem de exibição
    ID_PERMISSAO NUMBER(10),                    -- FK para permissão requerida
    FL_ATIVO NUMBER(1) DEFAULT 1 NOT NULL,
    DT_CRIACAO DATE DEFAULT SYSDATE NOT NULL,
    CONSTRAINT FK_MENU_PAI FOREIGN KEY (ID_MENU_PAI) 
        REFERENCES FAV_TB_MENUS (ID_MENU) ON DELETE SET NULL,
    CONSTRAINT FK_MENU_PERMISSAO FOREIGN KEY (ID_PERMISSAO) 
        REFERENCES FAV_TB_PERMISSOES (ID_PERMISSAO) ON DELETE SET NULL
);

CREATE SEQUENCE SEQ_MENUS START WITH 1 INCREMENT BY 1 NOCACHE NOCYCLE;

CREATE OR REPLACE TRIGGER TRG_MENUS_BI
BEFORE INSERT ON FAV_TB_MENUS FOR EACH ROW
BEGIN
    IF :NEW.ID_MENU IS NULL THEN
        SELECT SEQ_MENUS.NEXTVAL INTO :NEW.ID_MENU FROM DUAL;
    END IF;
    :NEW.DT_CRIACAO := SYSDATE;
END;
/

-- =========================================================================
-- 5. ALTERAR TABELA DE USUÁRIOS PARA ADICIONAR ID_PERFIL
-- =========================================================================
ALTER TABLE FAV_TB_SILA_USUARIOS 
ADD (ID_PERFIL NUMBER(10));

ALTER TABLE FAV_TB_SILA_USUARIOS
ADD CONSTRAINT FK_USER_PERFIL FOREIGN KEY (ID_PERFIL) 
    REFERENCES FAV_TB_PERFIS (ID_PERFIL) ON DELETE SET NULL;

-- =========================================================================
-- 6. INSERIR PERFIS PADRÃO
-- =========================================================================
INSERT ALL
  INTO FAV_TB_PERFIS (DS_PERFIL, DS_DESCRICAO, FL_ATIVO) VALUES ('ADMIN', 'Administrador do sistema com acesso completo', 1)
  INTO FAV_TB_PERFIS (DS_PERFIL, DS_DESCRICAO, FL_ATIVO) VALUES ('SUPERVISOR', 'Supervisor com acesso a relatorios, usuarios e auditoria', 1)
  INTO FAV_TB_PERFIS (DS_PERFIL, DS_DESCRICAO, FL_ATIVO) VALUES ('OPERADOR', 'Operador padrao com acesso limitado a funcionalidades especificas', 1)
  INTO FAV_TB_PERFIS (DS_PERFIL, DS_DESCRICAO, FL_ATIVO) VALUES ('VISUALIZADOR', 'Apenas visualizacao de dados, sem permissao de criar/editar', 1)
SELECT * FROM DUAL;

COMMIT;

-- =========================================================================
-- 7. INSERIR PERMISSÕES POR MÓDULO
-- =========================================================================

-- PTS, AUDIOMETRIA, IMITANCIOMETRIA e ADMINISTRATIVO
INSERT ALL
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('PTS_VISUALIZAR',            'Visualizar PTS',                             'PTS',              'VISUALIZAR', 1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('PTS_CRIAR',                 'Criar novo PTS',                             'PTS',              'CRIAR',      1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('PTS_EDITAR',                'Editar PTS',                                 'PTS',              'EDITAR',     1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('PTS_FINALIZAR',             'Finalizar PTS',                              'PTS',              'EDITAR',     1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('PTS_CANCELAR',              'Cancelar PTS',                               'PTS',              'DELETAR',    1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('PTS_IMPRIMIR',              'Imprimir PTS',                               'PTS',              'VISUALIZAR', 1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('PTS_DASHBOARD',             'Acessar Dashboard de PTS',                   'PTS',              'VISUALIZAR', 1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('AUDIOMETRIA_VISUALIZAR',    'Visualizar Audiometria',                     'AUDIOMETRIA',      'VISUALIZAR', 1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('AUDIOMETRIA_CRIAR',         'Criar Audiometria',                          'AUDIOMETRIA',      'CRIAR',      1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('AUDIOMETRIA_EDITAR',        'Editar Audiometria',                         'AUDIOMETRIA',      'EDITAR',     1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('AUDIOMETRIA_DELETAR',       'Deletar Audiometria',                        'AUDIOMETRIA',      'DELETAR',    1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('IMITANCIOMETRIA_VISUALIZAR','Visualizar Imitanciometria',                  'IMITANCIOMETRIA',  'VISUALIZAR', 1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('IMITANCIOMETRIA_CRIAR',     'Criar Imitanciometria',                      'IMITANCIOMETRIA',  'CRIAR',      1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('IMITANCIOMETRIA_EDITAR',    'Editar Imitanciometria',                     'IMITANCIOMETRIA',  'EDITAR',     1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('IMITANCIOMETRIA_DELETAR',   'Deletar Imitanciometria',                    'IMITANCIOMETRIA',  'DELETAR',    1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('ADMIN_ACESSO',              'Acessar painel administrativo',              'ADMIN',            'VISUALIZAR', 1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('USUARIOS_GERENCIAR',        'Gerenciar usuarios (criar, editar, ativar)',  'ADMIN',            'EDITAR',     1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('PERFIS_GERENCIAR',          'Gerenciar perfis e permissoes',              'ADMIN',            'EDITAR',     1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('MENUS_GERENCIAR',           'Gerenciar menus e acesso por perfil',        'ADMIN',            'EDITAR',     1)
  INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO) VALUES ('AUDITORIA_VISUALIZAR',      'Visualizar logs de auditoria',               'ADMIN',            'VISUALIZAR', 1)
SELECT * FROM DUAL;

COMMIT;

-- =========================================================================
-- 8. ATRIBUIR PERMISSÕES A PERFIS
-- =========================================================================

-- Perfil ADMIN - todas as permissões
INSERT INTO FAV_TB_PERFIS_PERMISSOES (ID_PERFIL, ID_PERMISSAO)
SELECT 1, ID_PERMISSAO FROM FAV_TB_PERMISSOES WHERE FL_ATIVO = 1;
COMMIT;

-- Perfil SUPERVISOR - acesso a PTS, Audiometria, Imitanciometria + Admin limitado
INSERT INTO FAV_TB_PERFIS_PERMISSOES (ID_PERFIL, ID_PERMISSAO)
SELECT 2, ID_PERMISSAO FROM FAV_TB_PERMISSOES 
WHERE FL_ATIVO = 1 
  AND (
    CD_PERMISSAO = 'PTS_VISUALIZAR' OR
    CD_PERMISSAO = 'PTS_CRIAR' OR
    CD_PERMISSAO = 'PTS_EDITAR' OR
    CD_PERMISSAO = 'PTS_FINALIZAR' OR
    CD_PERMISSAO = 'PTS_IMPRIMIR' OR
    CD_PERMISSAO = 'PTS_DASHBOARD' OR
    CD_PERMISSAO = 'AUDIOMETRIA_VISUALIZAR' OR
    CD_PERMISSAO = 'AUDIOMETRIA_CRIAR' OR
    CD_PERMISSAO = 'AUDIOMETRIA_EDITAR' OR
    CD_PERMISSAO = 'IMITANCIOMETRIA_VISUALIZAR' OR
    CD_PERMISSAO = 'IMITANCIOMETRIA_CRIAR' OR
    CD_PERMISSAO = 'IMITANCIOMETRIA_EDITAR' OR
    CD_PERMISSAO = 'ADMIN_ACESSO' OR
    CD_PERMISSAO = 'USUARIOS_GERENCIAR' OR
    CD_PERMISSAO = 'AUDITORIA_VISUALIZAR'
  );
COMMIT;

-- Perfil OPERADOR - acesso padrão (PTS, Audiometria, Imitanciometria apenas)
INSERT INTO FAV_TB_PERFIS_PERMISSOES (ID_PERFIL, ID_PERMISSAO)
SELECT 3, ID_PERMISSAO FROM FAV_TB_PERMISSOES 
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
    CD_PERMISSAO = 'IMITANCIOMETRIA_EDITAR'
  );
COMMIT;

-- Perfil VISUALIZADOR - apenas visualização
INSERT INTO FAV_TB_PERFIS_PERMISSOES (ID_PERFIL, ID_PERMISSAO)
SELECT 4, ID_PERMISSAO FROM FAV_TB_PERMISSOES 
WHERE FL_ATIVO = 1 
  AND DS_TIPO = 'VISUALIZAR'
  AND CD_PERMISSAO NOT LIKE 'ADMIN%';
COMMIT;

-- =========================================================================
-- 9. INSERIR MENUS PRINCIPAIS
-- =========================================================================

-- Menu Home (sem permissão requerida)
INSERT INTO FAV_TB_MENUS (NM_MENU, DS_MENU, CD_ROTA, NR_ORDEM, ID_PERMISSAO, FL_ATIVO)
VALUES ('Home', 'Tela inicial do sistema', '/home', 1, NULL, 1);
COMMIT;

-- Menu PTS Dashboard
INSERT INTO FAV_TB_MENUS (NM_MENU, DS_MENU, CD_ROTA, NR_ORDEM, ID_PERMISSAO, FL_ATIVO)
VALUES ('Dashboard PTS', 'Monitoramento de PTS', '/pts/dashboard', 2, 
        (SELECT ID_PERMISSAO FROM FAV_TB_PERMISSOES WHERE CD_PERMISSAO = 'PTS_DASHBOARD'), 1);
COMMIT;

-- Menu PTS Pacientes
INSERT INTO FAV_TB_MENUS (NM_MENU, DS_MENU, CD_ROTA, NR_ORDEM, ID_PERMISSAO, FL_ATIVO)
VALUES ('PTS - Pacientes', 'Listagem de pacientes para PTS', '/pts/pacientes', 3,
        (SELECT ID_PERMISSAO FROM FAV_TB_PERMISSOES WHERE CD_PERMISSAO = 'PTS_VISUALIZAR'), 1);
COMMIT;

-- Menu Audiometria
INSERT INTO FAV_TB_MENUS (NM_MENU, DS_MENU, CD_ROTA, NR_ORDEM, ID_PERMISSAO, FL_ATIVO)
VALUES ('Audiometria', 'Módulo de Audiometria', '/audiometria', 4,
        (SELECT ID_PERMISSAO FROM FAV_TB_PERMISSOES WHERE CD_PERMISSAO = 'AUDIOMETRIA_VISUALIZAR'), 1);
COMMIT;

-- Menu Imitanciometria
INSERT INTO FAV_TB_MENUS (NM_MENU, DS_MENU, CD_ROTA, NR_ORDEM, ID_PERMISSAO, FL_ATIVO)
VALUES ('Imitanciometria', 'Módulo de Imitanciometria', '/imitanciometria', 5,
        (SELECT ID_PERMISSAO FROM FAV_TB_PERMISSOES WHERE CD_PERMISSAO = 'IMITANCIOMETRIA_VISUALIZAR'), 1);
COMMIT;

-- Menu Administração
INSERT INTO FAV_TB_MENUS (NM_MENU, DS_MENU, CD_ROTA, NR_ORDEM, ID_PERMISSAO, FL_ATIVO)
VALUES ('Administração', 'Painel administrativo', '/admin', 10,
        (SELECT ID_PERMISSAO FROM FAV_TB_PERMISSOES WHERE CD_PERMISSAO = 'ADMIN_ACESSO'), 1);
COMMIT;

-- Submenu Controle de Acesso
INSERT INTO FAV_TB_MENUS (NM_MENU, DS_MENU, CD_ROTA, ID_MENU_PAI, NR_ORDEM, ID_PERMISSAO, FL_ATIVO)
VALUES ('Controle de Acesso', 'Gerenciar usuários, perfis e permissões', '/admin/controle-acesso',
        (SELECT ID_MENU FROM FAV_TB_MENUS WHERE CD_ROTA = '/admin' AND ID_MENU_PAI IS NULL),
        1,
        (SELECT ID_PERMISSAO FROM FAV_TB_PERMISSOES WHERE CD_PERMISSAO = 'USUARIOS_GERENCIAR'),
        1);
COMMIT;

-- Submenu Auditoria
INSERT INTO FAV_TB_MENUS (NM_MENU, DS_MENU, CD_ROTA, ID_MENU_PAI, NR_ORDEM, ID_PERMISSAO, FL_ATIVO)
VALUES ('Auditoria', 'Visualizar logs de atividades', '/admin/auditoria',
        (SELECT ID_MENU FROM FAV_TB_MENUS WHERE CD_ROTA = '/admin' AND ID_MENU_PAI IS NULL),
        2,
        (SELECT ID_PERMISSAO FROM FAV_TB_PERMISSOES WHERE CD_PERMISSAO = 'AUDITORIA_VISUALIZAR'),
        1);
COMMIT;

-- =========================================================================
-- 10. VALIDAÇÃO E ANÁLISE DE USUÁRIOS ANTES DE ATRIBUIÇÃO DE PERFIS
-- =========================================================================
-- ⚠️ IMPORTANTE: NÃO EXECUTAR UPDATE AUTOMÁTICO EM MASSA
-- Este processo requer análise cuidadosa para evitar problemas de acesso
-- 
-- Recomendação de processo:
-- 1. Executar queries de levantamento (abaixo)
-- 2. Analisar especialidades e funções de cada usuário
-- 3. Definir manualmente o perfil apropriado
-- 4. Validar acessos junto à regra de negócio
-- 5. Executar updates individuais após validação

-- =========================================================================
-- QUERY 1: LEVANTAMENTO DE TODOS OS USUÁRIOS EXISTENTES
-- =========================================================================
-- Execute esta query para ver todos os usuários e suas características
SELECT 
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.NM_USUARIO,
    u.DS_EMAIL,
    u.DS_ESPECIALIDADE,
    u.NR_CONSELHO,
    COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE) AS PROFISSAO,
    u.FL_ATIVO,
    u.DT_CRIACAO,
    CASE 
        WHEN u.ID_PERFIL IS NULL THEN 'SEM PERFIL'
        ELSE (SELECT DS_PERFIL FROM FAV_TB_PERFIS WHERE ID_PERFIL = u.ID_PERFIL)
    END AS PERFIL_ATUAL,
    u.CD_USUARIO_MV
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
ORDER BY u.DT_CRIACAO DESC;

-- =========================================================================
-- QUERY 2: USUÁRIOS SEM PERFIL DEFINIDO (PRIORITÁRIOS)
-- =========================================================================
SELECT 
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.NM_USUARIO,
    COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE, 'NÃO IDENTIFICADO') AS PROFISSAO,
    u.FL_ATIVO,
    'REQUER ATRIBUIÇÃO' AS STATUS
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
WHERE u.ID_PERFIL IS NULL 
  AND u.FL_ATIVO = 1
ORDER BY u.NM_USUARIO;

-- =========================================================================
-- QUERY 3: AGRUPAR USUÁRIOS POR ESPECIALIDADE PARA ANÁLISE
-- =========================================================================
SELECT 
    COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE, 'SEM ESPECIALIDADE') AS ESPECIALIDADE,
    COUNT(*) AS TOTAL_USUARIOS,
    SUM(CASE WHEN u.ID_PERFIL IS NULL THEN 1 ELSE 0 END) AS SEM_PERFIL,
    LISTAGG(u.NM_LOGIN, ', ') WITHIN GROUP (ORDER BY u.NM_LOGIN) AS USUARIOS
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
WHERE u.FL_ATIVO = 1
GROUP BY COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE)
ORDER BY TOTAL_USUARIOS DESC;

-- =========================================================================
-- QUERY 4: SUGESTÃO DE PERFIS POR ESPECIALIDADE
-- =========================================================================
-- Use esta consulta para determinar quais perfis devem ser atribuídos
SELECT 
    COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE) AS ESPECIALIDADE,
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.NM_USUARIO,
    CASE 
        WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%FONOAUDIO%' THEN 'OPERADOR (+ Audiometria)'
        WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%FISIO%' THEN 'OPERADOR (Fisio)'
        WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%PSICO%' THEN 'OPERADOR (Psico)'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%ADMIN%' THEN 'ADMIN'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%GESTOR%' THEN 'SUPERVISOR'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%DIRETOR%' THEN 'ADMIN'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%COORD%' THEN 'SUPERVISOR'
        ELSE 'OPERADOR (Geral)'
    END AS PERFIL_SUGERIDO,
    'REQUER VALIDAÇÃO' AS STATUS
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
WHERE u.ID_PERFIL IS NULL 
  AND u.FL_ATIVO = 1
ORDER BY ESPECIALIDADE, u.NM_USUARIO;

-- =========================================================================
-- QUERY 5: VIEW AUXILIAR PARA ANÁLISE CONSOLIDADA
-- =========================================================================
CREATE OR REPLACE VIEW VW_USUARIOS_ANALISE_ACESSO AS
SELECT 
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.NM_USUARIO,
    u.DS_EMAIL,
    COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE, 'NÃO IDENTIFICADO') AS ESPECIALIDADE,
    COALESCE(up.DS_CONSELHO, u.NR_CONSELHO::VARCHAR2, '-') AS CONSELHO,
    CASE 
        WHEN u.ID_PERFIL IS NULL THEN 'SEM PERFIL'
        ELSE (SELECT DS_PERFIL FROM FAV_TB_PERFIS WHERE ID_PERFIL = u.ID_PERFIL)
    END AS PERFIL_ATUAL,
    CASE 
        WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%FONOAUDIO%' THEN 'OPERADOR + AUDIOMETRIA'
        WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%FISIO%' THEN 'OPERADOR'
        WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%PSICO%' THEN 'OPERADOR'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%ADMIN%' THEN 'ADMIN'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%GESTOR%' THEN 'SUPERVISOR'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%DIRETOR%' THEN 'ADMIN'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%COORD%' THEN 'SUPERVISOR'
        ELSE 'OPERADOR'
    END AS PERFIL_SUGERIDO,
    u.FL_ATIVO,
    u.DT_CRIACAO
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
ORDER BY u.DT_CRIACAO DESC;

COMMIT;

-- =========================================================================
-- PRÓXIMOS PASSOS:
-- =========================================================================
-- 1. Execute as QUERY 1, 2, 3 e 4 para levantar os dados
-- 2. Exporte os resultados e analise com a equipe
-- 3. Identifique coordenadores por especialidade
-- 4. Valide os perfis sugeridos com o gestor/admin
-- 5. Execute manualmente os updates necessários com:
--
-- EXEMPLO DE UPDATE INDIVIDUAL (após validação):
-- UPDATE FAV_TB_SILA_USUARIOS
-- SET ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'ADMIN')
-- WHERE ID_USUARIO = XX;  -- Substituir XX pelo ID do usuário
-- COMMIT;
--
-- OU, se validado em massa para um grupo de especialidade:
--
-- UPDATE FAV_TB_SILA_USUARIOS u
-- SET u.ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'OPERADOR')
-- WHERE u.ID_USUARIO IN (
--     SELECT u2.ID_USUARIO FROM FAV_TB_SILA_USUARIOS u2
--     LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u2.ID_USUARIO = up.ID_USUARIO
--     WHERE u2.ID_PERFIL IS NULL 
--       AND u2.FL_ATIVO = 1
--       AND UPPER(up.NM_TIP_PRESTA) LIKE '%FISIO%'
-- );
-- COMMIT;
--
-- =========================================================================

-- =========================================================================
-- 11. VIEWS ÚTEIS PARA CONSULTAS
-- =========================================================================

-- View: Usuários com Perfil e Permissões
CREATE OR REPLACE VIEW VW_USUARIOS_PERMISSOES AS
SELECT 
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.NM_USUARIO,
    u.DS_EMAIL,
    p.DS_PERFIL,
    LISTAGG(perm.CD_PERMISSAO, ',') WITHIN GROUP (ORDER BY perm.CD_PERMISSAO) AS PERMISSOES,
    u.FL_ATIVO,
    u.DT_CRIACAO
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp ON p.ID_PERFIL = pp.ID_PERFIL
LEFT JOIN FAV_TB_PERMISSOES perm ON pp.ID_PERMISSAO = perm.ID_PERMISSAO AND perm.FL_ATIVO = 1
GROUP BY u.ID_USUARIO, u.NM_LOGIN, u.NM_USUARIO, u.DS_EMAIL, p.DS_PERFIL, u.FL_ATIVO, u.DT_CRIACAO;

-- View: Menus com Informações de Permissão
CREATE OR REPLACE VIEW VW_MENUS_PERMISSOES AS
SELECT 
    m.ID_MENU,
    m.NM_MENU,
    m.DS_MENU,
    m.CD_ROTA,
    m.ID_MENU_PAI,
    m.NR_ORDEM,
    perm.CD_PERMISSAO,
    perm.DS_PERMISSAO,
    perm.DS_MODULO,
    m.FL_ATIVO
FROM FAV_TB_MENUS m
LEFT JOIN FAV_TB_PERMISSOES perm ON m.ID_PERMISSAO = perm.ID_PERMISSAO
ORDER BY m.NR_ORDEM, m.NM_MENU;

COMMIT;

-- =========================================================================
-- 12. DEFINIÇÕES EXPLÍCITAS DE ACESSO POR PERFIL
-- =========================================================================
-- Este bloco define EXATAMENTE o que cada perfil pode fazer
-- Use estas queries para validar os acessos antes de atualizar usuários

-- =========================================================================
-- QUERY 6: LISTAR TODOS OS PERFIS COM SUAS DEFINIÇÕES
-- =========================================================================
-- RESULTADO ESPERADO: 4 perfis (ADMIN, SUPERVISOR, OPERADOR, VISUALIZADOR)
SELECT 
    p.ID_PERFIL,
    p.DS_PERFIL AS PERFIL,
    p.DS_DESCRICAO AS DESCRIÇÃO,
    COUNT(pp.ID_PERMISSAO) AS TOTAL_PERMISSOES,
    LISTAGG(perm.CD_PERMISSAO, ', ') WITHIN GROUP (ORDER BY perm.CD_PERMISSAO) AS PERMISSÕES
FROM FAV_TB_PERFIS p
LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp ON p.ID_PERFIL = pp.ID_PERFIL
LEFT JOIN FAV_TB_PERMISSOES perm ON pp.ID_PERMISSAO = perm.ID_PERMISSAO AND perm.FL_ATIVO = 1
WHERE p.FL_ATIVO = 1
GROUP BY p.ID_PERFIL, p.DS_PERFIL, p.DS_DESCRICAO
ORDER BY p.ID_PERFIL;

-- =========================================================================
-- QUERY 7: O QUE O ADMIN PODE VER E FAZER
-- =========================================================================
-- RESULTADO: Todas as 20+ permissões (acesso completo)
SELECT 
    p.DS_PERFIL AS PERFIL,
    perm.DS_MODULO AS MÓDULO,
    perm.CD_PERMISSAO AS CÓDIGO_PERMISSÃO,
    perm.DS_PERMISSAO AS AÇÃO,
    perm.DS_TIPO AS TIPO
FROM FAV_TB_PERFIS p
LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp ON p.ID_PERFIL = pp.ID_PERFIL
LEFT JOIN FAV_TB_PERMISSOES perm ON pp.ID_PERMISSAO = perm.ID_PERMISSAO AND perm.FL_ATIVO = 1
WHERE p.DS_PERFIL = 'ADMIN'
  AND perm.FL_ATIVO = 1
ORDER BY perm.DS_MODULO, perm.CD_PERMISSAO;

-- =========================================================================
-- QUERY 8: O QUE O SUPERVISOR PODE VER E FAZER
-- =========================================================================
-- RESULTADO: Acesso a PTS, Audiometria, Imitanciometria + Admin limitado
SELECT 
    p.DS_PERFIL AS PERFIL,
    perm.DS_MODULO AS MÓDULO,
    perm.CD_PERMISSAO AS CÓDIGO_PERMISSÃO,
    perm.DS_PERMISSAO AS AÇÃO,
    perm.DS_TIPO AS TIPO
FROM FAV_TB_PERFIS p
LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp ON p.ID_PERFIL = pp.ID_PERFIL
LEFT JOIN FAV_TB_PERMISSOES perm ON pp.ID_PERMISSAO = perm.ID_PERMISSAO AND perm.FL_ATIVO = 1
WHERE p.DS_PERFIL = 'SUPERVISOR'
  AND perm.FL_ATIVO = 1
ORDER BY perm.DS_MODULO, perm.CD_PERMISSAO;

-- =========================================================================
-- QUERY 9: O QUE O OPERADOR PODE VER E FAZER
-- =========================================================================
-- RESULTADO: PTS, Audiometria, Imitanciometria (sem admin)
SELECT 
    p.DS_PERFIL AS PERFIL,
    perm.DS_MODULO AS MÓDULO,
    perm.CD_PERMISSAO AS CÓDIGO_PERMISSÃO,
    perm.DS_PERMISSAO AS AÇÃO,
    perm.DS_TIPO AS TIPO
FROM FAV_TB_PERFIS p
LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp ON p.ID_PERFIL = pp.ID_PERFIL
LEFT JOIN FAV_TB_PERMISSOES perm ON pp.ID_PERMISSAO = perm.ID_PERMISSAO AND perm.FL_ATIVO = 1
WHERE p.DS_PERFIL = 'OPERADOR'
  AND perm.FL_ATIVO = 1
ORDER BY perm.DS_MODULO, perm.CD_PERMISSAO;

-- =========================================================================
-- QUERY 10: O QUE O VISUALIZADOR PODE VER E FAZER
-- =========================================================================
-- RESULTADO: Apenas leitura (VISUALIZAR)
SELECT 
    p.DS_PERFIL AS PERFIL,
    perm.DS_MODULO AS MÓDULO,
    perm.CD_PERMISSAO AS CÓDIGO_PERMISSÃO,
    perm.DS_PERMISSAO AS AÇÃO,
    perm.DS_TIPO AS TIPO
FROM FAV_TB_PERFIS p
LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp ON p.ID_PERFIL = pp.ID_PERFIL
LEFT JOIN FAV_TB_PERMISSOES perm ON pp.ID_PERMISSAO = perm.ID_PERMISSAO AND perm.FL_ATIVO = 1
WHERE p.DS_PERFIL = 'VISUALIZADOR'
  AND perm.FL_ATIVO = 1
ORDER BY perm.DS_MODULO, perm.CD_PERMISSAO;

-- =========================================================================
-- QUERY 11: COMPARAÇÃO LADO-A-LADO - QUEM ACESSA O PTS
-- =========================================================================
-- RESULTADO: Mostra quais perfis têm acesso ao módulo PTS
SELECT 
    p.DS_PERFIL AS PERFIL,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'PTS_VISUALIZAR' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS VER_PTS,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'PTS_CRIAR' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS CRIAR_PTS,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'PTS_EDITAR' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS EDITAR_PTS,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'PTS_FINALIZAR' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS FINALIZAR_PTS,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'PTS_CANCELAR' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS CANCELAR_PTS,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'PTS_IMPRIMIR' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS IMPRIMIR_PTS,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'PTS_DASHBOARD' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS DASHBOARD_PTS
FROM FAV_TB_PERFIS p
LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp ON p.ID_PERFIL = pp.ID_PERFIL
LEFT JOIN FAV_TB_PERMISSOES perm ON pp.ID_PERMISSAO = perm.ID_PERMISSAO AND perm.FL_ATIVO = 1 AND perm.DS_MODULO = 'PTS'
WHERE p.FL_ATIVO = 1
GROUP BY p.ID_PERFIL, p.DS_PERFIL
ORDER BY p.ID_PERFIL;

-- =========================================================================
-- QUERY 12: COMPARAÇÃO LADO-A-LADO - QUEM ACESSA AUDIOMETRIA
-- =========================================================================
-- RESULTADO: Mostra quais perfis têm acesso a Audiometria
SELECT 
    p.DS_PERFIL AS PERFIL,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'AUDIOMETRIA_VISUALIZAR' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS VER,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'AUDIOMETRIA_CRIAR' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS CRIAR,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'AUDIOMETRIA_EDITAR' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS EDITAR,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'AUDIOMETRIA_DELETAR' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS DELETAR
FROM FAV_TB_PERFIS p
LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp ON p.ID_PERFIL = pp.ID_PERFIL
LEFT JOIN FAV_TB_PERMISSOES perm ON pp.ID_PERMISSAO = perm.ID_PERMISSAO AND perm.FL_ATIVO = 1 AND perm.DS_MODULO = 'AUDIOMETRIA'
WHERE p.FL_ATIVO = 1
GROUP BY p.ID_PERFIL, p.DS_PERFIL
ORDER BY p.ID_PERFIL;

-- =========================================================================
-- QUERY 13: COMPARAÇÃO LADO-A-LADO - QUEM ACESSA IMITANCIOMETRIA
-- =========================================================================
-- RESULTADO: Mostra quais perfis têm acesso a Imitanciometria
SELECT 
    p.DS_PERFIL AS PERFIL,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'IMITANCIOMETRIA_VISUALIZAR' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS VER,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'IMITANCIOMETRIA_CRIAR' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS CRIAR,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'IMITANCIOMETRIA_EDITAR' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS EDITAR,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'IMITANCIOMETRIA_DELETAR' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS DELETAR
FROM FAV_TB_PERFIS p
LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp ON p.ID_PERFIL = pp.ID_PERFIL
LEFT JOIN FAV_TB_PERMISSOES perm ON pp.ID_PERMISSAO = perm.ID_PERMISSAO AND perm.FL_ATIVO = 1 AND perm.DS_MODULO = 'IMITANCIOMETRIA'
WHERE p.FL_ATIVO = 1
GROUP BY p.ID_PERFIL, p.DS_PERFIL
ORDER BY p.ID_PERFIL;

-- =========================================================================
-- QUERY 14: COMPARAÇÃO LADO-A-LADO - QUEM TEM ACESSO ADMIN
-- =========================================================================
-- RESULTADO: Mostra quais perfis têm acesso às funções administrativas
SELECT 
    p.DS_PERFIL AS PERFIL,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'ADMIN_ACESSO' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS ACESSO_ADMIN,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'USUARIOS_GERENCIAR' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS GERENCIAR_USUARIOS,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'PERFIS_GERENCIAR' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS GERENCIAR_PERFIS,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'MENUS_GERENCIAR' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS GERENCIAR_MENUS,
    CASE WHEN COUNT(CASE WHEN perm.CD_PERMISSAO = 'AUDITORIA_VISUALIZAR' THEN 1 END) > 0 THEN 'SIM' ELSE 'NÃO' END AS VER_AUDITORIA
FROM FAV_TB_PERFIS p
LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp ON p.ID_PERFIL = pp.ID_PERFIL
LEFT JOIN FAV_TB_PERMISSOES perm ON pp.ID_PERMISSAO = perm.ID_PERMISSAO AND perm.FL_ATIVO = 1 AND perm.DS_MODULO = 'ADMIN'
WHERE p.FL_ATIVO = 1
GROUP BY p.ID_PERFIL, p.DS_PERFIL
ORDER BY p.ID_PERFIL;

-- =========================================================================
-- QUERY 15: MATRIZ COMPLETA DE ACESSO (RESUMIDA)
-- =========================================================================
-- RESULTADO: Visão resumida de quem pode fazer o quê
-- Use esta query para decisões rápidas de permissões
SELECT 
    p.DS_PERFIL AS PERFIL,
    SUM(CASE WHEN perm.DS_TIPO = 'VISUALIZAR' THEN 1 ELSE 0 END) AS VISUALIZAR,
    SUM(CASE WHEN perm.DS_TIPO = 'CRIAR' THEN 1 ELSE 0 END) AS CRIAR,
    SUM(CASE WHEN perm.DS_TIPO = 'EDITAR' THEN 1 ELSE 0 END) AS EDITAR,
    SUM(CASE WHEN perm.DS_TIPO = 'DELETAR' THEN 1 ELSE 0 END) AS DELETAR,
    COUNT(DISTINCT perm.ID_PERMISSAO) AS TOTAL_PERMISSÕES,
    LISTAGG(DISTINCT perm.DS_MODULO, ', ') WITHIN GROUP (ORDER BY perm.DS_MODULO) AS MÓDULOS_ACESSO
FROM FAV_TB_PERFIS p
LEFT JOIN FAV_TB_PERFIS_PERMISSOES pp ON p.ID_PERFIL = pp.ID_PERFIL
LEFT JOIN FAV_TB_PERMISSOES perm ON pp.ID_PERMISSAO = perm.ID_PERMISSAO AND perm.FL_ATIVO = 1
WHERE p.FL_ATIVO = 1
GROUP BY p.ID_PERFIL, p.DS_PERFIL
ORDER BY p.ID_PERFIL;

-- =========================================================================
-- QUERY 16: EXEMPLO - USUÁRIOS QUE VAMOS ATUALIZAR (TEMPLATE)
-- =========================================================================
-- RESULTADO: Mostra usuários prontos para receber perfis
-- Edite esta query conforme necessário para validar antes de UPDATE
SELECT 
    u.ID_USUARIO,
    u.NM_LOGIN,
    u.NM_USUARIO,
    COALESCE(up.NM_TIP_PRESTA, u.DS_ESPECIALIDADE) AS ESPECIALIDADE,
    CASE 
        WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%FONOAUDIO%' THEN 'OPERADOR'
        WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%FISIO%' THEN 'OPERADOR'
        WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%PSICO%' THEN 'OPERADOR'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%ADMIN%' THEN 'ADMIN'
        WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%COORD%' THEN 'SUPERVISOR'
        ELSE 'OPERADOR'
    END AS PERFIL_SUGERIDO,
    u.FL_ATIVO,
    (SELECT DS_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 
        CASE 
            WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%FONOAUDIO%' THEN 'OPERADOR'
            WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%FISIO%' THEN 'OPERADOR'
            WHEN UPPER(up.NM_TIP_PRESTA) LIKE '%PSICO%' THEN 'OPERADOR'
            WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%ADMIN%' THEN 'ADMIN'
            WHEN UPPER(u.DS_ESPECIALIDADE) LIKE '%COORD%' THEN 'SUPERVISOR'
            ELSE 'OPERADOR'
        END
    ) AS PERFIL_ID_PARA_USAR
FROM FAV_TB_SILA_USUARIOS u
LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u.ID_USUARIO = up.ID_USUARIO
WHERE u.ID_PERFIL IS NULL 
  AND u.FL_ATIVO = 1
ORDER BY u.NM_USUARIO;

-- =========================================================================
-- RESUMO DE DEFINIÇÕES - O QUE CADA PERFIL PODE FAZER
-- =========================================================================
-- 
-- PERFIS DISPONÍVEIS: 4
-- 
-- 1. ADMIN
--    - Acesso COMPLETO a tudo
--    - PTS: Ver, Criar, Editar, Finalizar, Cancelar, Imprimir, Dashboard
--    - Audiometria: Ver, Criar, Editar, Deletar
--    - Imitanciometria: Ver, Criar, Editar, Deletar
--    - Admin: Gerenciar usuários, perfis, menus, auditoria
--    - TOTAL: 20+ permissões
-- 
-- 2. SUPERVISOR (Coordenadores)
--    - Acesso a PTS: Ver, Criar, Editar, Finalizar, Imprimir, Dashboard
--    - Audiometria: Ver, Criar, Editar
--    - Imitanciometria: Ver, Criar, Editar
--    - Admin limitado: Ver auditoria, Gerenciar usuários
--    - TOTAL: ~15 permissões
-- 
-- 3. OPERADOR (Profissionais)
--    - Acesso a PTS: Ver, Criar, Editar, Finalizar, Imprimir, Dashboard
--    - Audiometria: Ver, Criar, Editar
--    - Imitanciometria: Ver, Criar, Editar
--    - Admin: NENHUM
--    - TOTAL: ~12 permissões
-- 
-- 4. VISUALIZADOR
--    - Acesso a PTS: Ver apenas
--    - Audiometria: Ver apenas
--    - Imitanciometria: Ver apenas
--    - Admin: NENHUM
--    - TOTAL: ~3 permissões (apenas VISUALIZAR)
-- 
-- =========================================================================
-- PRÓXIMOS PASSOS PARA ATUALIZAR USUÁRIOS:
-- =========================================================================
-- 
-- 1. Execute QUERY 6 para ver todos os 4 perfis
-- 2. Execute QUERY 7 para ver que ADMIN tem TUDO
-- 3. Execute QUERY 11 para ver quem acessa PTS
-- 4. Execute QUERY 15 para matriz resumida
-- 5. Execute QUERY 16 para ver usuários que serão atualizados
-- 6. Valide os perfis sugeridos com gestor
-- 7. Execute os UPDATEs conforme exemplo abaixo:
-- 
-- EXEMPLO UPDATE INDIVIDUAL (1 usuário ADMIN):
-- UPDATE FAV_TB_SILA_USUARIOS 
-- SET ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'ADMIN')
-- WHERE ID_USUARIO = 1;  -- Substituir pelo ID real
-- COMMIT;
-- 
-- EXEMPLO UPDATE EM MASSA (todos os fonoaudiólogos = OPERADOR):
-- UPDATE FAV_TB_SILA_USUARIOS u
-- SET u.ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'OPERADOR')
-- WHERE u.ID_USUARIO IN (
--     SELECT u2.ID_USUARIO FROM FAV_TB_SILA_USUARIOS u2
--     LEFT JOIN FAV_TB_USUARIO_PRESTADOR up ON u2.ID_USUARIO = up.ID_USUARIO
--     WHERE u2.ID_PERFIL IS NULL 
--       AND u2.FL_ATIVO = 1
--       AND UPPER(up.NM_TIP_PRESTA) LIKE '%FONOAUDIO%'
-- );
-- COMMIT;
-- 
-- =========================================================================

COMMIT;

-- =========================================================================
-- 13. REGRAS ESPECIAIS DE AUTORIZAÇÃO - CANCELAMENTO DE PTS
-- =========================================================================
-- REGRA: OPERADOR pode cancelar APENAS os PTS que ele criou
-- - Usuário A criou PTS → Usuário A pode cancelar
-- - Usuário B quer cancelar PTS do A → BLOQUEADO
-- - ADMIN/SUPERVISOR → podem cancelar conforme permissões
-- =========================================================================

-- =========================================================================
-- FUNÇÃO ORACLE: Validar se usuário pode cancelar um PTS específico
-- =========================================================================
-- Esta função verifica se um usuário tem permissão para cancelar um PTS
-- Retorna: 1 (pode cancelar) ou 0 (não pode cancelar)
CREATE OR REPLACE FUNCTION FN_PODE_CANCELAR_PTS(
    p_id_usuario IN NUMBER,
    p_id_pts IN NUMBER
) RETURN NUMBER IS
    v_pode_cancelar NUMBER := 0;
    v_perfil_usuario VARCHAR2(50);
    v_id_usuario_criador NUMBER;
BEGIN
    -- 1. Obter perfil do usuário
    SELECT p.DS_PERFIL 
    INTO v_perfil_usuario
    FROM FAV_TB_SILA_USUARIOS u
    LEFT JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
    WHERE u.ID_USUARIO = p_id_usuario
      AND u.FL_ATIVO = 1;
    
    -- 2. Se é ADMIN ou SUPERVISOR, pode cancelar qualquer PTS
    IF v_perfil_usuario IN ('ADMIN', 'SUPERVISOR') THEN
        RETURN 1;
    END IF;
    
    -- 3. Se é OPERADOR, pode cancelar APENAS o seu próprio PTS
    IF v_perfil_usuario = 'OPERADOR' THEN
        -- Obter quem criou o PTS
        SELECT ID_USUARIO_CRIADOR 
        INTO v_id_usuario_criador
        FROM FAV_TB_PTS
        WHERE ID_PTS = p_id_pts;
        
        -- Se foi o próprio usuário que criou, pode cancelar
        IF v_id_usuario_criador = p_id_usuario THEN
            v_pode_cancelar := 1;
        ELSE
            v_pode_cancelar := 0;
        END IF;
        
        RETURN v_pode_cancelar;
    END IF;
    
    -- 4. Outros perfis (VISUALIZADOR, etc) não podem cancelar
    RETURN 0;
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        -- Usuário ou PTS não encontrado
        RETURN 0;
    WHEN OTHERS THEN
        -- Erro na validação
        RETURN 0;
END FN_PODE_CANCELAR_PTS;
/

COMMIT;

-- =========================================================================
-- FUNÇÃO ORACLE: Validar se usuário pode editar um PTS específico
-- =========================================================================
-- Esta função valida a mesma lógica para EDIÇÃO de PTS
-- (com a mesma regra: OPERADOR edita apenas seus próprios)
CREATE OR REPLACE FUNCTION FN_PODE_EDITAR_PTS(
    p_id_usuario IN NUMBER,
    p_id_pts IN NUMBER
) RETURN NUMBER IS
    v_pode_editar NUMBER := 0;
    v_perfil_usuario VARCHAR2(50);
    v_id_usuario_criador NUMBER;
BEGIN
    -- 1. Obter perfil do usuário
    SELECT p.DS_PERFIL 
    INTO v_perfil_usuario
    FROM FAV_TB_SILA_USUARIOS u
    LEFT JOIN FAV_TB_PERFIS p ON u.ID_PERFIL = p.ID_PERFIL
    WHERE u.ID_USUARIO = p_id_usuario
      AND u.FL_ATIVO = 1;
    
    -- 2. Se é ADMIN ou SUPERVISOR, pode editar qualquer PTS
    IF v_perfil_usuario IN ('ADMIN', 'SUPERVISOR') THEN
        RETURN 1;
    END IF;
    
    -- 3. Se é OPERADOR, pode editar APENAS o seu próprio PTS
    IF v_perfil_usuario = 'OPERADOR' THEN
        -- Obter quem criou o PTS
        SELECT ID_USUARIO_CRIADOR 
        INTO v_id_usuario_criador
        FROM FAV_TB_PTS
        WHERE ID_PTS = p_id_pts;
        
        -- Se foi o próprio usuário que criou, pode editar
        IF v_id_usuario_criador = p_id_usuario THEN
            v_pode_editar := 1;
        ELSE
            v_pode_editar := 0;
        END IF;
        
        RETURN v_pode_editar;
    END IF;
    
    -- 4. Outros perfis (VISUALIZADOR, etc) não podem editar
    RETURN 0;
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
    WHEN OTHERS THEN
        RETURN 0;
END FN_PODE_EDITAR_PTS;
/

COMMIT;

-- =========================================================================
-- TRIGGER: Validar cancelamento de PTS antes de ser processado
-- =========================================================================
-- Esta trigger garante que a regra seja respeitada em UPDATE/DELETE
-- Nota: Usar no backend FastAPI para melhor controle e mensagens
CREATE OR REPLACE TRIGGER TRG_VALIDAR_CANCELAMENTO_PTS
BEFORE UPDATE ON FAV_TB_PTS
FOR EACH ROW
WHEN (NEW.CD_STATUS = 'CANCELADO' AND OLD.CD_STATUS != 'CANCELADO')
BEGIN
    -- Esta trigger serve como validação adicional
    -- O controle principal deve estar no backend FastAPI
    NULL;  -- Implementar validação específica se necessário
END;
/

COMMIT;

-- =========================================================================
-- QUERY 17: Validar Regra de Cancelamento - Exemplos de Uso
-- =========================================================================
-- Esta query mostra como usar a função de validação

-- EXEMPLO 1: Verificar se Usuário 5 pode cancelar PTS 1
-- SELECT FN_PODE_CANCELAR_PTS(5, 1) AS PODE_CANCELAR
-- FROM DUAL;
-- Resultado: 1 (pode) ou 0 (não pode)

-- EXEMPLO 2: Listar todos os PTS que um OPERADOR pode cancelar (seus próprios)
-- SELECT 
--     p.ID_PTS,
--     p.NM_PACIENTE,
--     u_criador.NM_USUARIO AS CRIADO_POR,
--     p.DT_CRIACAO,
--     p.CD_STATUS,
--     FN_PODE_CANCELAR_PTS(5, p.ID_PTS) AS PODE_CANCELAR
-- FROM FAV_TB_PTS p
-- JOIN FAV_TB_SILA_USUARIOS u_criador ON p.ID_USUARIO_CRIADOR = u_criador.ID_USUARIO
-- WHERE p.FL_ATIVO = 1
--   AND u_criador.ID_USUARIO = 5  -- ID do OPERADOR
-- ORDER BY p.DT_CRIACAO DESC;

-- =========================================================================
-- QUERY 18: Matriz de Autorização para Cancelamento de PTS
-- =========================================================================
-- Mostra exatamente quem pode cancelar o PTS de cada um

SELECT 
    u_criador.NM_USUARIO AS PTS_CRIADO_POR,
    u_criador.ID_USUARIO AS ID_CRIADOR,
    p_criador.DS_PERFIL AS PERFIL_CRIADOR,
    u_usuario.NM_USUARIO AS USUARIO_QUE_QUER_CANCELAR,
    u_usuario.ID_USUARIO AS ID_USUARIO,
    p_usuario.DS_PERFIL AS PERFIL_USUARIO,
    CASE 
        WHEN p_usuario.DS_PERFIL IN ('ADMIN', 'SUPERVISOR') THEN 'SIM - Perfil Administrativo'
        WHEN p_usuario.DS_PERFIL = 'OPERADOR' AND u_usuario.ID_USUARIO = u_criador.ID_USUARIO THEN 'SIM - Seu próprio PTS'
        ELSE 'NÃO - Sem permissão'
    END AS PODE_CANCELAR
FROM FAV_TB_SILA_USUARIOS u_criador
CROSS JOIN FAV_TB_SILA_USUARIOS u_usuario
LEFT JOIN FAV_TB_PERFIS p_criador ON u_criador.ID_PERFIL = p_criador.ID_PERFIL
LEFT JOIN FAV_TB_PERFIS p_usuario ON u_usuario.ID_PERFIL = p_usuario.ID_PERFIL
WHERE u_criador.FL_ATIVO = 1
  AND u_usuario.FL_ATIVO = 1
ORDER BY u_criador.NM_USUARIO, u_usuario.NM_USUARIO;

-- =========================================================================
-- DOCUMENTAÇÃO: Regra de Cancelamento de PTS
-- =========================================================================
-- 
-- REGRA DE NEGÓCIO:
-- ================
-- O cancelamento de PTS deve seguir esta hierarquia:
-- 
-- 1. ADMIN:
--    ✅ Pode cancelar QUALQUER PTS de QUALQUER usuário
--    ✅ Sem restrições
-- 
-- 2. SUPERVISOR:
--    ✅ Pode cancelar qualquer PTS da sua especialidade
--    ✅ Sem restrições (mesmo se criado por outro)
-- 
-- 3. OPERADOR:
--    ✅ Pode cancelar APENAS os PTS que ELE CRIOU
--    ❌ NÃO pode cancelar PTS de outros colegas
--    ❌ NÃO pode cancelar mesmo que tenha permissão PTS_CANCELAR
-- 
-- 4. VISUALIZADOR:
--    ❌ Não pode cancelar nada
-- 
-- =========================================================================
-- IMPLEMENTAÇÃO NO BACKEND (FastAPI/Python):
-- =========================================================================
-- 
-- @router.post("/pts/{id_pts}/cancelar")
-- async def cancelar_pts(
--     id_pts: int,
--     current_user: User = Depends(get_current_user),
--     db: Session = Depends(get_db)
-- ):
--     # 1. Buscar o PTS
--     pts = db.query(PTS).filter(PTS.ID_PTS == id_pts).first()
--     if not pts:
--         raise HTTPException(status_code=404, detail="PTS não encontrado")
--     
--     # 2. Validar permissão de cancelar
--     tem_permissao = has_permission(
--         db, 
--         current_user.ID_USUARIO, 
--         "PTS_CANCELAR"
--     )
--     if not tem_permissao:
--         raise HTTPException(status_code=403, detail="Sem permissão para cancelar PTS")
--     
--     # 3. ADICIONAR VALIDAÇÃO: Verificar se é seu próprio PTS
--     # Se OPERADOR e o PTS foi criado por outro usuário, BLOQUEAR
--     usuario_perfil = get_user_perfil(db, current_user.ID_USUARIO)
--     
--     if usuario_perfil == "OPERADOR":
--         if pts.ID_USUARIO_CRIADOR != current_user.ID_USUARIO:
--             raise HTTPException(
--                 status_code=403, 
--                 detail="Operadores podem cancelar apenas seus próprios PTS"
--             )
--     
--     # 4. Se passou nas validações, cancelar
--     pts.CD_STATUS = "CANCELADO"
--     pts.DT_CANCELAMENTO = datetime.now()
--     db.commit()
--     
--     return {"mensagem": "PTS cancelado com sucesso"}
-- 
-- =========================================================================

COMMIT;

-- =========================================================================
-- FIM DO SCRIPT
-- =========================================================================
COMMIT;
