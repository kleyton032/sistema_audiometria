-- =========================================================================
-- SCRIPT: Adicionar Permissão PTS_CANCELAR
-- =========================================================================
-- Propósito: Inserir permissão de cancelamento de PTS na tabela de permissões
-- Data: 21 de maio de 2026
-- =========================================================================

-- =========================================================================
-- 1. INSERIR PERMISSÃO PTS_CANCELAR (se não existir)
-- =========================================================================
BEGIN
    INSERT INTO FAV_TB_PERMISSOES (CD_PERMISSAO, DS_PERMISSAO, DS_MODULO, DS_TIPO, FL_ATIVO)
    VALUES ('PTS_CANCELAR', 'Cancelar PTS', 'PTS', 'DELETAR', 1);
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('✓ Permissão PTS_CANCELAR adicionada com sucesso');
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        DBMS_OUTPUT.PUT_LINE('✓ Permissão PTS_CANCELAR já existe');
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('✗ Erro ao adicionar permissão: ' || SQLERRM);
        ROLLBACK;
END;
/

-- =========================================================================
-- 2. VERIFICAR SE PERMISSÃO FOI CRIADA
-- =========================================================================
SELECT 
    ID_PERMISSAO,
    CD_PERMISSAO,
    DS_PERMISSAO,
    DS_MODULO,
    DS_TIPO,
    FL_ATIVO
FROM FAV_TB_PERMISSOES
WHERE CD_PERMISSAO = 'PTS_CANCELAR';

-- =========================================================================
-- 3. ASSOCIAR PERMISSÃO AO PERFIL OPERADOR (se não estiver associada)
-- =========================================================================
BEGIN
    INSERT INTO FAV_TB_PERFIS_PERMISSOES (ID_PERFIL, ID_PERMISSAO)
    SELECT 
        (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'OPERADOR'),
        ID_PERMISSAO
    FROM FAV_TB_PERMISSOES
    WHERE CD_PERMISSAO = 'PTS_CANCELAR'
      AND NOT EXISTS (
        SELECT 1
        FROM FAV_TB_PERFIS_PERMISSOES pp
        WHERE pp.ID_PERFIL = (SELECT ID_PERFIL FROM FAV_TB_PERFIS WHERE DS_PERFIL = 'OPERADOR')
          AND pp.ID_PERMISSAO = (SELECT ID_PERMISSAO FROM FAV_TB_PERMISSOES WHERE CD_PERMISSAO = 'PTS_CANCELAR')
      );
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('✓ Permissão PTS_CANCELAR associada ao OPERADOR');
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        DBMS_OUTPUT.PUT_LINE('✓ Permissão PTS_CANCELAR já está associada ao OPERADOR');
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('✗ Erro ao associar permissão: ' || SQLERRM);
        ROLLBACK;
END;
/

-- =========================================================================
-- 4. VERIFICAR RESULTADO: OPERADOR COM PERMISSÃO PTS_CANCELAR
-- =========================================================================
SELECT 
    p.DS_PERFIL AS PERFIL,
    perm.CD_PERMISSAO AS PERMISSAO,
    perm.DS_PERMISSAO AS DESCRICAO,
    perm.DS_MODULO AS MODULO,
    perm.DS_TIPO AS TIPO
FROM FAV_TB_PERFIS p
JOIN FAV_TB_PERFIS_PERMISSOES pp ON p.ID_PERFIL = pp.ID_PERFIL
JOIN FAV_TB_PERMISSOES perm ON pp.ID_PERMISSAO = perm.ID_PERMISSAO
WHERE p.DS_PERFIL = 'OPERADOR'
  AND perm.CD_PERMISSAO = 'PTS_CANCELAR'
ORDER BY perm.CD_PERMISSAO;

-- =========================================================================
-- FIM DO SCRIPT
-- =========================================================================
-- Se você vir ✓ em ambas as operações, a permissão foi adicionada com sucesso!
-- =========================================================================
