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

export async function cancelarPTS(idPts: number): Promise<{ status: string; mensagem: string }> {
  const { data } = await api.post<{ status: string; mensagem: string }>(
    `/pts/${idPts}/cancelar`,
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
