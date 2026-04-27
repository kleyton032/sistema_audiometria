import api from './client'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ExameAudiometriaCreate {
  id_paciente:          number
  id_atendimento?:      number | null
  ds_queixa_principal?: string | null
  fl_cae_od_obstruido:  number
  fl_cae_oe_obstruido:  number
  ds_observacoes?:      string | null

  // Limiares OD — via aérea
  od_va_250?: number | null; od_va_500?: number | null; od_va_1000?: number | null
  od_va_2000?: number | null; od_va_3000?: number | null; od_va_4000?: number | null
  od_va_6000?: number | null; od_va_8000?: number | null
  // Limiares OD — via óssea
  od_vo_500?: number | null; od_vo_1000?: number | null
  od_vo_2000?: number | null; od_vo_4000?: number | null
  // Limiares OE — via aérea
  oe_va_250?: number | null; oe_va_500?: number | null; oe_va_1000?: number | null
  oe_va_2000?: number | null; oe_va_3000?: number | null; oe_va_4000?: number | null
  oe_va_6000?: number | null; oe_va_8000?: number | null
  // Limiares OE — via óssea
  oe_vo_500?: number | null; oe_vo_1000?: number | null
  oe_vo_2000?: number | null; oe_vo_4000?: number | null
  // Logoaudiometria
  od_lrf?: number | null; od_iprf_mon?: number | null; od_iprf_int?: number | null
  oe_lrf?: number | null; oe_iprf_mon?: number | null; oe_iprf_int?: number | null
  // Classificação
  nr_media_od?: number | null; nr_media_oe?: number | null
  ds_class_od?: string | null; ds_class_oe?: string | null
  ds_tipo_od?: string | null; ds_tipo_oe?: string | null
  ds_conclusao?: string | null
}

export interface ResultadoAudioResponse {
  id_resultado: number
  id_exame:     number
  od_va_250?: number | null; od_va_500?: number | null; od_va_1000?: number | null
  od_va_2000?: number | null; od_va_3000?: number | null; od_va_4000?: number | null
  od_va_6000?: number | null; od_va_8000?: number | null
  od_vo_500?: number | null; od_vo_1000?: number | null
  od_vo_2000?: number | null; od_vo_4000?: number | null
  oe_va_250?: number | null; oe_va_500?: number | null; oe_va_1000?: number | null
  oe_va_2000?: number | null; oe_va_3000?: number | null; oe_va_4000?: number | null
  oe_va_6000?: number | null; oe_va_8000?: number | null
  oe_vo_500?: number | null; oe_vo_1000?: number | null
  oe_vo_2000?: number | null; oe_vo_4000?: number | null
  od_lrf?: number | null; od_iprf_mon?: number | null; od_iprf_int?: number | null
  oe_lrf?: number | null; oe_iprf_mon?: number | null; oe_iprf_int?: number | null
  nr_media_od?: number | null; nr_media_oe?: number | null
  ds_class_od?: string | null; ds_class_oe?: string | null
  ds_tipo_od?: string | null; ds_tipo_oe?: string | null
  ds_conclusao?: string | null
}

export interface ExameResponse {
  id_exame:            number
  id_paciente:         number
  id_atendimento:      number | null
  ds_tipo:             string
  ds_status:           string
  ds_queixa_principal: string | null
  fl_cae_od_obstruido: number
  fl_cae_oe_obstruido: number
  ds_observacoes:      string | null
  dt_exame:            string
  resultado_audio:     ResultadoAudioResponse | null
}

// ── Funções ──────────────────────────────────────────────────────────────────

export async function buscarExamePorAtendimento(
  cdAtendimento: number,
): Promise<ExameResponse | null> {
  const { data } = await api.get<ExameResponse | null>(
    `/exames/por-atendimento/${cdAtendimento}`,
  )
  return data ?? null
}

export async function criarExameAudiometria(
  payload: ExameAudiometriaCreate,
): Promise<ExameResponse> {
  const { data } = await api.post<ExameResponse>('/exames/audiometria', payload)
  return data
}

export async function atualizarExameAudiometria(
  idExame: number,
  payload: ExameAudiometriaCreate,
): Promise<ExameResponse> {
  const { data } = await api.put<ExameResponse>(
    `/exames/audiometria/${idExame}`,
    payload,
  )
  return data
}

export async function finalizarExame(idExame: number): Promise<ExameResponse> {
  const { data } = await api.post<ExameResponse>(`/exames/${idExame}/finalizar`)
  return data
}

export async function gerarLaudoPdf(idExame: number): Promise<Blob> {
  const { data } = await api.post(`/exames/${idExame}/laudo`, null, {
    responseType: 'blob',
  })
  return data as Blob
}
