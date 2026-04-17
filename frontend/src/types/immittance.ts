// ============================
// Types — Imitanciometria
// ============================

/** Frequências dos reflexos estapedianos */
export const REFLEX_FREQUENCIES = [500, 1000, 2000, 4000] as const
export type ReflexFrequency = (typeof REFLEX_FREQUENCIES)[number]

/** Tipos de timpanograma */
export type TympanogramType = 'A' | 'As' | 'Ad' | 'B' | 'C'

/** Ponto do timpanograma para o gráfico */
export interface TympanogramPoint {
  pressure: number // daPa (-400 a +200)
  compliance: number // ml
}

/** Dados numéricos do timpanograma de uma orelha */
export interface TympanogramData {
  type: TympanogramType | null
  staticCompliance: number | null // ml
  earCanalVolume: number | null // ml
  peakPressure: number | null // daPa
  curve: TympanogramPoint[] // pontos para o gráfico
}

/** Resultado de reflexo em uma frequência/modo */
export interface ReflexResult {
  present: boolean | null // null = não testado
  threshold: number | null // dB (quando presente)
}

/** Tabela de reflexos estapedianos de uma orelha */
export type ReflexTable = Record<
  ReflexFrequency,
  {
    ipsilateral: ReflexResult
    contralateral: ReflexResult
  }
>

/** Dados completos de imitanciometria */
export interface ImmittanceData {
  rightEar: TympanogramData
  leftEar: TympanogramData
  rightReflexes: ReflexTable
  leftReflexes: ReflexTable
  conclusion: string
}

/** Cria uma tabela de reflexos vazia */
export function createEmptyReflexTable(): ReflexTable {
  const empty = (): { ipsilateral: ReflexResult; contralateral: ReflexResult } => ({
    ipsilateral: { present: null, threshold: null },
    contralateral: { present: null, threshold: null },
  })
  return {
    500: empty(),
    1000: empty(),
    2000: empty(),
    4000: empty(),
  }
}

/** Cria dados de timpanograma vazios */
export function createEmptyTympanogram(): TympanogramData {
  return {
    type: null,
    staticCompliance: null,
    earCanalVolume: null,
    peakPressure: null,
    curve: [],
  }
}
