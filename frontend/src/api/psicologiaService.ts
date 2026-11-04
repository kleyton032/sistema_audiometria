import api from './client'
import type {
  PsiProtocolo,
  PsiAvaliacao,
  PsiAvaliacaoLista,
  PsiAvaliacaoCreate,
  PsiAvaliacaoUpdate,
} from '@/types/psicologia'

export async function getPsiProtocoloAtivo(): Promise<PsiProtocolo> {
  const { data } = await api.get<PsiProtocolo>('/psicologia/protocolo')
  return data
}

export async function listarPsiAvaliacoes(): Promise<PsiAvaliacaoLista> {
  const { data } = await api.get<PsiAvaliacaoLista>('/psicologia/avaliacoes')
  return data
}

export async function criarPsiAvaliacao(payload: PsiAvaliacaoCreate): Promise<PsiAvaliacao> {
  const { data } = await api.post<PsiAvaliacao>('/psicologia/avaliacoes', payload)
  return data
}

export async function getPsiAvaliacao(idAvaliacao: number): Promise<PsiAvaliacao> {
  const { data } = await api.get<PsiAvaliacao>(`/psicologia/avaliacoes/${idAvaliacao}`)
  return data
}

export async function salvarPsiRascunho(idAvaliacao: number, payload: PsiAvaliacaoUpdate): Promise<PsiAvaliacao> {
  const { data } = await api.put<PsiAvaliacao>(`/psicologia/avaliacoes/${idAvaliacao}`, payload)
  return data
}

export interface PsiStatusBatchItem {
  avaliacao: {
    id_avaliacao: number
    ds_situacao: string
  } | null
}

export async function getPsiAvaliacoesStatusBatch(
  cdPacientes: (number | string)[],
): Promise<Record<string, PsiStatusBatchItem>> {
  if (cdPacientes.length === 0) return {}
  const { data } = await api.get<Record<string, PsiStatusBatchItem>>(
    '/psicologia/avaliacoes/status-batch',
    { params: { cd_pacientes: cdPacientes.join(',') } },
  )
  return data
}
