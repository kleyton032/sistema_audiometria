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

export async function getPTSStatusBatch(cdAtendimentos: (number | string)[]): Promise<Record<string, { id_pts: number; fl_finalizado: number } | null>> {
  if (cdAtendimentos.length === 0) return {}
  const { data } = await api.get('/pts/status-batch', {
    params: { cd_pacientes: cdAtendimentos.join(',') },
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

export async function getPTSDashboardReport(): Promise<any[]> {
  const { data } = await api.get('/pts/dashboard/report')
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
