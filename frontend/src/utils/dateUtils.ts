import dayjs, { Dayjs } from 'dayjs'

/**
 * Converte com robustez strings de data digitadas pelo usuário ou inseridas por tecnologias
 * assistivas (leitores de tela) para um objeto Dayjs válido.
 * 
 * Suporta formatos com barra, traço, ponto e digitação contínua de números (ex: 10112026).
 */
export function parseBrDate(raw?: string | null): Dayjs | null {
  if (!raw) return null
  const cleaned = raw.trim()
  if (!cleaned) return null

  // 1. Apenas dígitos: 8 dígitos (DDMMAAAA) ou 6 dígitos (DDMMAA)
  if (/^\d{8}$/.test(cleaned)) {
    const d = dayjs(cleaned, 'DDMMYYYY', true)
    if (d.isValid()) return d
  }
  if (/^\d{6}$/.test(cleaned)) {
    const d = dayjs(cleaned, 'DDMMYY', true)
    if (d.isValid()) return d
  }

  // 2. Formatos comuns com separadores
  const formats = [
    'DD/MM/YYYY',
    'D/M/YYYY',
    'DD-MM-YYYY',
    'D-M-YYYY',
    'DD.MM.YYYY',
    'D.M.YYYY',
    'YYYY-MM-DD',
    'DD/MM',
    'D/M',
  ]

  for (const fmt of formats) {
    const d = dayjs(cleaned, fmt, true)
    if (d.isValid()) return d
  }

  // 3. Fallback flexível do Day.js
  const fallback = dayjs(cleaned)
  if (fallback.isValid()) return fallback

  return null
}

/** Lista de formatos aceitos diretamente pelo DatePicker do Ant Design */
export const DATE_PICKER_FORMATS = [
  'DD/MM/YYYY',
  'D/M/YYYY',
  'DD-MM-YYYY',
  'D-M-YYYY',
  'DD.MM.YYYY',
  'YYYY-MM-DD',
]

