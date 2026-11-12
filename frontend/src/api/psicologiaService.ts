import api from './client'
import type {
  PsiProtocolo,
  PsiAvaliacao,
  PsiAvaliacaoLista,
  PsiAvaliacaoCreate,
  PsiAvaliacaoUpdate,
} from '@/types/psicologia'

export type ModuloClinico = 'psicologia' | 'psicopedagogia'

export async function getPsiProtocoloAtivo(
  modulo: ModuloClinico = 'psicologia',
): Promise<PsiProtocolo> {
  const { data } = await api.get<PsiProtocolo>(`/${modulo}/protocolo`)
  return data
}

export async function listarPsiProtocolos(
  modulo: ModuloClinico = 'psicologia',
): Promise<PsiProtocolo[]> {
  const { data } = await api.get<PsiProtocolo[]>(`/${modulo}/protocolos`)
  return data
}

export async function getPsiProtocolo(
  idProtocolo: number,
  modulo: ModuloClinico = 'psicologia',
): Promise<PsiProtocolo> {
  const { data } = await api.get<PsiProtocolo>(`/${modulo}/protocolo/${idProtocolo}`)
  return data
}

export async function listarPsiAvaliacoes(
  modulo: ModuloClinico = 'psicologia',
): Promise<PsiAvaliacaoLista> {
  const { data } = await api.get<PsiAvaliacaoLista>(`/${modulo}/avaliacoes`)
  return data
}

export async function criarPsiAvaliacao(
  payload: PsiAvaliacaoCreate,
  modulo: ModuloClinico = 'psicologia',
): Promise<PsiAvaliacao> {
  const { data } = await api.post<PsiAvaliacao>(`/${modulo}/avaliacoes`, payload)
  return data
}

export async function getPsiAvaliacao(
  idAvaliacao: number,
  modulo: ModuloClinico = 'psicologia',
): Promise<PsiAvaliacao> {
  const { data } = await api.get<PsiAvaliacao>(`/${modulo}/avaliacoes/${idAvaliacao}`)
  return data
}

export async function salvarPsiRascunho(
  idAvaliacao: number,
  payload: PsiAvaliacaoUpdate,
  modulo: ModuloClinico = 'psicologia',
): Promise<PsiAvaliacao> {
  const { data } = await api.put<PsiAvaliacao>(`/${modulo}/avaliacoes/${idAvaliacao}`, payload)
  return data
}

export async function finalizarPsiAvaliacao(
  idAvaliacao: number,
  payload: PsiAvaliacaoUpdate,
  modulo: ModuloClinico = 'psicologia',
): Promise<PsiAvaliacao> {
  const { data } = await api.post<PsiAvaliacao>(`/${modulo}/avaliacoes/${idAvaliacao}/finalizar`, payload)
  return data
}

export interface PsiAvaliacaoStatus {
  id_avaliacao: number
  ds_situacao: string
  tem_respostas: boolean
}

export interface PsiStatusBatchItem {
  avaliacoes: { [dsCodigo: string]: PsiAvaliacaoStatus }
}

export async function getPsiAvaliacoesStatusBatch(
  cdPacientes: (number | string)[],
  modulo: ModuloClinico = 'psicologia',
): Promise<Record<string, PsiStatusBatchItem>> {
  if (cdPacientes.length === 0) return {}
  const { data } = await api.get<Record<string, PsiStatusBatchItem>>(
    `/${modulo}/avaliacoes/status-batch`,
    { params: { cd_pacientes: cdPacientes.join(',') } },
  )
  return data
}
