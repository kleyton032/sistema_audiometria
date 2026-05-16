import api from './client'

export interface HomeStats {
  resumo_mes: {
    pts_finalizados: number
    exames_realizados: number
  }
  pendencias: {
    pts_rascunho: number
    exames_pendentes: number
  }
}

export async function getHomeStats(): Promise<HomeStats> {
  const { data } = await api.get<HomeStats>('/home/geral')
  return data
}
