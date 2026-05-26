import { client } from './client'

export interface DocumentoResponse {
  id_psicologia_doc: number
  cd_paciente: string
  id_usuario: number
  ds_tipo_doc: string
  dt_criacao: string
  dt_atualizacao: string | null
  fl_ativo: number
  ds_observacoes?: string
  anamnese?: AnamneseResponse
  evolucoes?: EvolucaoResponse[]
  avaliacao?: AvaliacaoResponse
}

export interface AnamneseResponse {
  id_anamnese: number
  id_psicologia_doc: number
  ds_historia_familiar?: string
  ds_historia_pessoal?: string
  ds_escolaridade?: string
  ds_socioeconomico?: string
  ds_queixa_principal?: string
  ds_hipotese_inicial?: string
  dt_criacao: string
  dt_atualizacao?: string
}

export interface EvolucaoResponse {
  id_evolucao: number
  id_psicologia_doc: number
  nr_atendimento?: string
  ds_data_atendimento: string
  ds_observacoes?: string
  ds_objetivos_sessao?: string
  ds_intervencoes?: string
  ds_proximos_passos?: string
  id_usuario_criou: number
  dt_criacao: string
  dt_atualizacao?: string
}

export interface AvaliacaoResponse {
  id_avaliacao: number
  id_psicologia_doc: number
  ds_tipo_teste?: string
  ds_resultado?: string
  nr_escore?: number
  ds_interpretacao?: string
  ds_recomendacoes?: string
  id_usuario_fez: number
  dt_realizacao: string
  dt_criacao: string
  dt_atualizacao?: string
  ds_status: string
}

export interface VersaoResponse {
  id_versao: number
  id_psicologia_doc: number
  nr_versao: number
  ds_conteudo_anterior?: string
  ds_campo_alterado?: string
  ds_motivo_alteracao?: string
  dt_edicao: string
}

// ============================================================================
// DOCUMENTOS
// ============================================================================

export const listarDocumentosPaciente = async (
  cd_paciente: string,
  ds_tipo_doc?: string
): Promise<{ total: number; documentos: DocumentoResponse[] }> => {
  const params = new URLSearchParams()
  if (ds_tipo_doc) params.append('ds_tipo_doc', ds_tipo_doc)
  
  return client.get(`/psicologia/documentos/${cd_paciente}?${params.toString()}`)
}

export const obterDocumento = async (
  id_psicologia_doc: number
): Promise<DocumentoResponse> => {
  return client.get(`/psicologia/documento/${id_psicologia_doc}`)
}

export const criarDocumento = async (payload: {
  cd_paciente: string
  ds_tipo_doc: 'ANAMNESE' | 'EVOLUCAO' | 'AVALIACAO'
  ds_observacoes?: string
}): Promise<DocumentoResponse> => {
  return client.post('/psicologia/documentos', payload)
}

export const atualizarDocumento = async (
  id_psicologia_doc: number,
  payload: { ds_observacoes?: string }
): Promise<DocumentoResponse> => {
  return client.patch(`/psicologia/documento/${id_psicologia_doc}`, payload)
}

export const desativarDocumento = async (
  id_psicologia_doc: number
): Promise<void> => {
  return client.delete(`/psicologia/documento/${id_psicologia_doc}`)
}

// ============================================================================
// ANAMNESE
// ============================================================================

export const criarAnamnese = async (
  id_psicologia_doc: number,
  payload: {
    ds_historia_familiar?: string
    ds_historia_pessoal?: string
    ds_escolaridade?: string
    ds_socioeconomico?: string
    ds_queixa_principal?: string
    ds_hipotese_inicial?: string
  }
): Promise<AnamneseResponse> => {
  return client.post(`/psicologia/documento/${id_psicologia_doc}/anamnese`, payload)
}

export const obterAnamnese = async (
  id_psicologia_doc: number
): Promise<AnamneseResponse> => {
  return client.get(`/psicologia/documento/${id_psicologia_doc}/anamnese`)
}

export const atualizarAnamnese = async (
  id_anamnese: number,
  payload: {
    ds_historia_familiar?: string
    ds_historia_pessoal?: string
    ds_escolaridade?: string
    ds_socioeconomico?: string
    ds_queixa_principal?: string
    ds_hipotese_inicial?: string
  }
): Promise<AnamneseResponse> => {
  return client.patch(`/psicologia/anamnese/${id_anamnese}`, payload)
}

// ============================================================================
// EVOLUÇÃO
// ============================================================================

export const criarEvolucao = async (
  id_psicologia_doc: number,
  payload: {
    nr_atendimento?: string
    ds_data_atendimento: string
    ds_observacoes?: string
    ds_objetivos_sessao?: string
    ds_intervencoes?: string
    ds_proximos_passos?: string
  }
): Promise<EvolucaoResponse> => {
  return client.post(`/psicologia/documento/${id_psicologia_doc}/evolucao`, payload)
}

export const listarEvolucoes = async (
  id_psicologia_doc: number
): Promise<EvolucaoResponse[]> => {
  return client.get(`/psicologia/documento/${id_psicologia_doc}/evolucoes`)
}

export const atualizarEvolucao = async (
  id_evolucao: number,
  payload: {
    nr_atendimento?: string
    ds_data_atendimento: string
    ds_observacoes?: string
    ds_objetivos_sessao?: string
    ds_intervencoes?: string
    ds_proximos_passos?: string
  }
): Promise<EvolucaoResponse> => {
  return client.patch(`/psicologia/evolucao/${id_evolucao}`, payload)
}

export const deletarEvolucao = async (id_evolucao: number): Promise<void> => {
  return client.delete(`/psicologia/evolucao/${id_evolucao}`)
}

// ============================================================================
// AVALIAÇÃO
// ============================================================================

export const criarAvaliacao = async (
  id_psicologia_doc: number,
  payload: {
    ds_tipo_teste?: string
    ds_resultado?: string
    nr_escore?: number
    ds_interpretacao?: string
    ds_recomendacoes?: string
    dt_realizacao: string
  }
): Promise<AvaliacaoResponse> => {
  return client.post(`/psicologia/documento/${id_psicologia_doc}/avaliacao`, payload)
}

export const obterAvaliacao = async (
  id_psicologia_doc: number
): Promise<AvaliacaoResponse> => {
  return client.get(`/psicologia/documento/${id_psicologia_doc}/avaliacao`)
}

export const atualizarAvaliacao = async (
  id_avaliacao: number,
  payload: {
    ds_resultado?: string
    nr_escore?: number
    ds_interpretacao?: string
    ds_recomendacoes?: string
  }
): Promise<AvaliacaoResponse> => {
  return client.patch(`/psicologia/avaliacao/${id_avaliacao}`, payload)
}

export const finalizarAvaliacao = async (
  id_avaliacao: number
): Promise<AvaliacaoResponse> => {
  return client.post(`/psicologia/avaliacao/${id_avaliacao}/finalizar`, {})
}

export const assinarAvaliacao = async (
  id_avaliacao: number
): Promise<AvaliacaoResponse> => {
  return client.post(`/psicologia/avaliacao/${id_avaliacao}/assinar`, {})
}

// ============================================================================
// VERSÕES (AUDITORIA)
// ============================================================================

export const obterHistoricoVersoes = async (
  id_psicologia_doc: number
): Promise<VersaoResponse[]> => {
  return client.get(`/psicologia/documento/${id_psicologia_doc}/versoes`)
}
