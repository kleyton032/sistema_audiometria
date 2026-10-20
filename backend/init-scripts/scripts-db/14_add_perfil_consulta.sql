-- ============================================================================
-- 14_add_perfil_consulta.sql
-- Adiciona o perfil CONSULTA para usuários sem prestador vinculado ao MV.
-- Esses usuários (Central de Marcação, Recepção, setores administrativos)
-- possuem acesso EXCLUSIVAMENTE de leitura aos PTS.
-- ============================================================================

-- Insere o novo perfil (caso ainda não exista)
MERGE INTO FAV_TB_PERFIS t
USING (
    SELECT 'CONSULTA' AS DS_PERFIL,
           'Usuário somente consulta - sem prestador vinculado ao MV'
             AS DS_DESCRICAO
    FROM DUAL
) s
ON (UPPER(t.DS_PERFIL) = UPPER(s.DS_PERFIL))
WHEN NOT MATCHED THEN
    INSERT (ID_PERFIL, DS_PERFIL, DS_DESCRICAO)
    VALUES ((SELECT NVL(MAX(ID_PERFIL), 0) + 1 FROM FAV_TB_PERFIS),
            s.DS_PERFIL,
            s.DS_DESCRICAO);

COMMIT;

-- Registra a migração
-- Executado em: $(date)
