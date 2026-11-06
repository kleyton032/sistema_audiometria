-- =========================================================================
-- SCRIPT DE CORREÇÃO: ORA-00001 UNIQUE CONSTRAINT VIOLATED
-- Motivo: A constraint antiga não permitia que houvesse múltiplos
-- registros com FL_ATIVO = 0 (cancelados) para o mesmo mês/paciente/terapeuta.
--
-- Solução: Substituir por um Índice Baseado em Função (Function-Based Index)
-- que valida a unicidade APENAS se o FL_ATIVO for 1 (ativo).
-- =========================================================================

-- 1. Drop da constraint engessada antiga
ALTER TABLE FAV_TB_PTS DROP CONSTRAINT UQ_PTS_PACIENTE_VIG;

-- 2. Criação do Índice Único Inteligente
CREATE UNIQUE INDEX UQ_PTS_PACIENTE_VIG ON FAV_TB_PTS (
    CASE WHEN FL_ATIVO = 1 THEN CD_PACIENTE ELSE NULL END,
    CASE WHEN FL_ATIVO = 1 THEN DS_VIGENCIA ELSE NULL END,
    CASE WHEN FL_ATIVO = 1 THEN ID_USUARIO ELSE NULL END
);
