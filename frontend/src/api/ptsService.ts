import api from './client'

export async function getPTSDiagnosticosPrincipais(): Promise<string[]> {
  const { data } = await api.get<{ ds_diagnostico: string }[]>(
    '/pts/diagnosticos-principais',
  )
  return data.map((d) => d.ds_diagnostico)
}

export async function getPTSDiagnosticosTerapeuticos(): Promise<string[]> {
  const { data } = await api.get<{ ds_diagnostico: string }[]>(
    '/pts/diagnosticos-terapeuticos',
  )
  return data.map((d) => d.ds_diagnostico)
}

export async function getPTSTerapiasIndicadas(): Promise<{ cd: string; ds: string }[]> {
  const { data } = await api.get<{ cd_item: string; ds_item: string }[]>(
    '/pts/terapias-indicadas',
  )
  return data.map((e) => ({ cd: e.cd_item, ds: e.ds_item }))
}

export async function getPTSItensMultidisciplinar(): Promise<{ cd: string; ds: string }[]> {
  const { data } = await api.get<{ cd_item: string; ds_item: string }[]>(
    '/pts/itens-multidisciplinar',
  )
  return data.map((e) => ({ cd: e.cd_item, ds: e.ds_item }))
}

export async function getPTSEspecialidades(): Promise<{ cd: string; ds: string }[]> {
  const { data } = await api.get<{ cd_especialidade: string; ds_especialidade: string }[]>(
    '/pts/especialidades',
  )
  return data.map((e) => ({ cd: e.cd_especialidade, ds: e.ds_especialidade }))
}

export async function getPTSDiagnosticosArea(idEspecialidade: number): Promise<string[]> {
  const { data } = await api.get<{ ds_diagnostico: string }[]>(
    '/pts/diagnosticos-area',
    { params: { id_especialidade: idEspecialidade } },
  )
  return data.map((d) => d.ds_diagnostico)
}

export async function getPTSInstrumentosAvaliacao(): Promise<{ cd: string; ds: string }[]> {
  const { data } = await api.get<{ codigo: string; descricao: string }[]>(
    '/pts/instrumentos-avaliacao',
  )
  return data.map((e) => ({ cd: e.codigo, ds: e.descricao }))
}

export async function finalizarPTS(idPts: number): Promise<{ status: string; mensagem: string }> {
  const { data } = await api.post<{ status: string; mensagem: string }>(
    `/pts/${idPts}/finalizar`,
  )
  return data
}

export async function cancelarPTS(
  idPts: number,
  payload: { ds_motivo: string; ds_detalhe?: string }
): Promise<{ status: string; mensagem: string }> {
  const { data } = await api.post<{ status: string; mensagem: string }>(
    `/pts/${idPts}/cancelar`,
    payload
  )
  return data
}
export async function savePTS(payload: any): Promise<{ status: string; mensagem: string; id_pts: number }> {
  const { data } = await api.post<{ status: string; mensagem: string; id_pts: number }>(
    '/pts',
    payload
  )
  return data
}

export async function updatePTS(idPts: number, payload: any): Promise<{ status: string; mensagem: string; id_pts: number }> {
  const { data } = await api.put<{ status: string; mensagem: string; id_pts: number }>(
    `/pts/${idPts}`,
    payload
  )
  return data
}

export async function getPTSById(idPts: number): Promise<any> {
  const { data } = await api.get(`/pts/load/${idPts}`)
  return data
}

export interface OutroPtsStatus {
  nm_profissional: string
  ds_especialidade: string
  fl_finalizado: number
}

export interface PtsStatusBatchItem {
  meu_pts: {
    id_pts: number
    fl_finalizado: number
    dt_criacao: string | null
  } | null
  outros_pts: OutroPtsStatus[]
}

export async function getPTSStatusBatch(cdPacientes: (number | string)[]): Promise<Record<string, PtsStatusBatchItem>> {
  if (cdPacientes.length === 0) return {}
  const { data } = await api.get('/pts/status-batch', {
    params: { cd_pacientes: cdPacientes.join(',') },
  })
  return data
}

export async function getPTSObjetivosPorEspecialidade(dsEspecialidade: string): Promise<string[]> {
  const { data } = await api.get<{ id_objetivo: number; ds_objetivo: string }[]>(
    '/pts/objetivos-por-especialidade',
    { params: { ds_especialidade: dsEspecialidade } },
  )
  return data.map((d) => d.ds_objetivo)
}

export async function getPTSDashboardStats(): Promise<{ total_pts: number; finalizados: number; em_rascunho: number; cancelados: number }> {
  const { data } = await api.get('/pts/dashboard/stats')
  return data
}

export async function getPTSDashboardReport(status?: 'finalizados' | 'rascunho' | 'cancelados'): Promise<any[]> {
  const params = status ? { status } : undefined
  const { data } = await api.get('/pts/dashboard/report', { params })
  return data
}

export interface CondutaInterdisciplinarStatus {
  possui_preenchimento: boolean
  status_documento: string
  total_registros: number
}

export async function getCondutaInterdisciplinarStatus(
  cdPaciente: number,
): Promise<CondutaInterdisciplinarStatus> {
  const { data } = await api.get<CondutaInterdisciplinarStatus>(
    `/pts/${cdPaciente}/conduta-interdisciplinar`,
  )
  return data
}

export interface OutroPTSObjetivo {
  objetivo: string | null
  status: string | null
  motivo: string | null
}

export interface PTSReportItem {
  id_pts: number
  cd_paciente: string
  nm_paciente: string
  nr_atendimento: string
  nm_usuario: string
  ds_vigencia: string
  dt_criacao: string
  fl_finalizado: number
  fl_ativo: number
  terapias?: string
  objetivos?: string
  ds_motivo_cancelamento?: string
  ds_detalhe_cancelamento?: string
  dt_cancelamento?: string
}

export interface OutroPTSItem {
  id_pts: number
  nm_prestador: string
  ds_especialidade_profissional: string
  fl_finalizado: number
  fl_ativo: number
  objetivos: Record<string, {
    anterior: OutroPTSObjetivo[]
    atual: OutroPTSObjetivo[]
  }>
}

export async function getOutrosPTSVigencia(
  nrAtendimento: string | number,
  cdPaciente: string | number,
  vigencia: string,
  idPtsExcluir: number
): Promise<OutroPTSItem[]> {
  const { data } = await api.get<OutroPTSItem[]>('/pts/outros-pts-vigencia', {
    params: {
      nr_atendimento: String(nrAtendimento),
      cd_paciente: String(cdPaciente),
      vigencia,
      id_pts_excluir: idPtsExcluir,
    },
  })
  return data
}

export interface PtsHistoricoObjetivoOut {
  id_objetivo: number
  ds_especialidade: string
  ds_momento: string
  nr_item: number
  ds_objetivo: string | null
  ds_status: string | null
  ds_motivo: string | null
}

export interface PtsHistoricoItemOut {
  id_pts: number
  dt_criacao: string
  ds_vigencia: string
  nm_usuario: string
  fl_finalizado: number
  objetivos: PtsHistoricoObjetivoOut[]
}

export interface PtsHistoricoSummaryOut {
  total_pts: number
  primeiro_pts_data: string | null
  ultimo_pts_data: string | null
  historico: PtsHistoricoItemOut[]
}

export async function getPTSHistoricoPaciente(cdPaciente: string): Promise<PtsHistoricoSummaryOut> {
  const { data } = await api.get<PtsHistoricoSummaryOut>(`/pts/${cdPaciente}/historico`)
  return data
}
