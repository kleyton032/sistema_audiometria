// ============================
// Types — Audiometria
// ============================

/** Frequências padrão do audiograma (Hz) */
export const FREQUENCIES = [250, 500, 1000, 2000, 3000, 4000, 6000, 8000] as const
export type Frequency = (typeof FREQUENCIES)[number]

/** Limiares de uma orelha (dBHL por frequência) */
export interface EarThresholds {
  airConduction: Partial<Record<Frequency, number | null>>
  boneConduction: Partial<Record<Frequency, number | null>>
  airNR?: boolean   // Sem resposta — via aérea
  boneNR?: boolean  // Sem resposta — via óssea
}

/** Dados de logoaudiometria de uma orelha */
export interface SpeechAudiometry {
  srt: number | null         // LRF (dBHL)
  sdt: number | null         // SDT (dBHL)
  irf: number | null         // IPRF MON (%)
  irfIntensity: number | null // IPRF MON dB
  irfDis: number | null      // IPRF DIS (%)
  irfDisDb: number | null    // IPRF DIS dB
  irfTri: number | null      // IPRF TRI (%)
  irfTriDb: number | null    // IPRF TRI dB
}

/** Dados de mascaramento de uma orelha */
export interface MaskingData {
  va: number | null    // VA masking (dB NB)
  vo: number | null    // VO masking (dB NB)
  lrf: number | null   // LRF masking (dB NB)
  iprf: number | null  // IPRF masking (dB NB)
}

/** Classificação de perda auditiva */
export type HearingLossGrade =
  | 'Normal'
  | 'Leve'
  | 'Moderada'
  | 'Moderadamente Severa'
  | 'Severa'
  | 'Profunda'

export type HearingLossType = 'Normal' | 'Condutiva' | 'Sensorioneural' | 'Mista'

/** Dados completos de audiometria */
export interface AudiometryData {
  rightEar: EarThresholds
  leftEar: EarThresholds
  speechRight: SpeechAudiometry
  speechLeft: SpeechAudiometry
  maskingRight: MaskingData
  maskingLeft: MaskingData
  hearingLossType: HearingLossType | null
  hearingLossGrade: HearingLossGrade | null
  conclusion: string
  observations: string
}

/** Retorna o grau de perda baseado na média tritonal (PTA) */
export function classifyHearingLoss(pta: number): HearingLossGrade {
  if (pta <= 25) return 'Normal'
  if (pta <= 40) return 'Leve'
  if (pta <= 55) return 'Moderada'
  if (pta <= 70) return 'Moderadamente Severa'
  if (pta <= 90) return 'Severa'
  return 'Profunda'
}

/** Calcula a média quadritonal (OMS 2021): 500 + 1000 + 2000 + 4000 Hz */
export function calculatePTA(thresholds: EarThresholds): number | null {
  const v500  = thresholds.airConduction[500]
  const v1000 = thresholds.airConduction[1000]
  const v2000 = thresholds.airConduction[2000]
  const v4000 = thresholds.airConduction[4000]
  if (v500 == null || v1000 == null || v2000 == null || v4000 == null) return null
  return Math.round((v500 + v1000 + v2000 + v4000) / 4)
}

/** Ponto de dado para o gráfico do audiograma */
export interface AudiometryPoint {
  frequency: number
  db: number
  ear: 'right' | 'left'
  type: 'air' | 'bone'
}
