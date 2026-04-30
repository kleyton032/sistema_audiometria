// ============================================================
// Listas de valores para os combobox do formulário PTS
// ============================================================

export const DIAGNOSTICOS_PRINCIPAIS = [
  'NÃO SE APLICA',
  'AGENESIA DE CORPO CALOSO',
  'ALBINISMO OCULAR',
  'ALTA MIOPIA',
  'AMBLIOPIA',
  'ANOFTALMIA',
  'ATROFIA ÓPTICA',
  'BAIXA VISÃO',
  'CATARATA CONGÊNITA',
  'CERATOCONE',
  'DEFICIÊNCIA AUDITIVA',
  'DEFICIÊNCIA FÍSICA',
  'DEFICIÊNCIA INTELECTUAL',
  'DEFICIÊNCIA MÚLTIPLA',
  'DEFICIÊNCIA VISUAL',
  'DEGENERAÇÃO MACULAR',
  'DESCOLAMENTO DE RETINA',
  'DISPLASIA SEPTO-ÓPTICA',
  'DISTROFIA MUSCULAR',
  'ENCEFALOPATIA CRÔNICA',
  'ESPINHA BÍFIDA',
  'GLAUCOMA CONGÊNITO',
  'HEMIANOPSIA',
  'HIDROCEFALIA',
  'LEUCOMALÁCIA PERIVENTRICULAR',
  'MICROCEFALIA',
  'MIELOMENINGOCELE',
  'NEUROPATIA AUDITIVA',
  'NISTAGMO',
  'PARALISIA CEREBRAL',
  'PERDA AUDITIVA CONDUTIVA',
  'PERDA AUDITIVA MISTA',
  'PERDA AUDITIVA SENSORIONEURAL',
  'RETINOBLASTOMA',
  'RETINOPATIA DA PREMATURIDADE (ROP)',
  'RETINOPATIA DIABÉTICA',
  'SÍNDROME DE DOWN',
  'SÍNDROME DE USHER',
  'TEA - TRANSTORNO DO ESPECTRO AUTISTA',
  'OUTROS',
]

export const DIAGNOSTICOS_AREA: Record<string, string[]> = {
  visual: [
    'NÃO SE APLICA',
    'ALBINISMO OCULAR',
    'ALTA MIOPIA',
    'AMBLIOPIA',
    'ANOFTALMIA / MICROFTALMIA',
    'ATROFIA ÓPTICA',
    'CATARATA CONGÊNITA',
    'CERATOCONE',
    'DEGENERAÇÃO MACULAR',
    'DESCOLAMENTO DE RETINA',
    'DISPLASIA SEPTO-ÓPTICA',
    'GLAUCOMA',
    'HEMIANOPSIA',
    'LEUCOMALÁCIA PERIVENTRICULAR',
    'NISTAGMO',
    'RETINOPATIA DA PREMATURIDADE',
    'RETINOSE PIGMENTAR',
    'OUTROS',
  ],
  intelectual: [
    'NÃO SE APLICA',
    'DEFICIÊNCIA INTELECTUAL LEVE',
    'DEFICIÊNCIA INTELECTUAL MODERADA',
    'DEFICIÊNCIA INTELECTUAL GRAVE',
    'DEFICIÊNCIA INTELECTUAL PROFUNDA',
    'SÍNDROME DE DOWN',
    'TEA - TRANSTORNO DO ESPECTRO AUTISTA',
    'SÍNDROME DE ANGELMAN',
    'SÍNDROME DE PRADER-WILLI',
    'SÍNDROME DE RETT',
    'SÍNDROME DE WEST',
    'ENCEFALOPATIA CRÔNICA NÃO PROGRESSIVA',
    'MICROCEFALIA',
    'HIDROCEFALIA',
    'OUTROS',
  ],
  fisica: [
    'NÃO SE APLICA',
    'PARALISIA CEREBRAL - ESPÁSTICA',
    'PARALISIA CEREBRAL - DISCINÉTICA',
    'PARALISIA CEREBRAL - ATÁXICA',
    'PARALISIA CEREBRAL - MISTA',
    'MIELOMENINGOCELE',
    'ESPINHA BÍFIDA',
    'ARTROGRIPOSE',
    'DISTROFIA MUSCULAR',
    'AMPUTAÇÃO',
    'MALFORMAÇÃO DE MEMBROS',
    'SEQUELA DE POLIOMIELITE',
    'ESCOLIOSE GRAVE',
    'OUTROS',
  ],
  auditiva: [
    'NÃO SE APLICA',
    'PERDA AUDITIVA SENSORIONEURAL BILATERAL',
    'PERDA AUDITIVA SENSORIONEURAL UNILATERAL',
    'PERDA AUDITIVA CONDUTIVA BILATERAL',
    'PERDA AUDITIVA CONDUTIVA UNILATERAL',
    'PERDA AUDITIVA MISTA BILATERAL',
    'PERDA AUDITIVA MISTA UNILATERAL',
    'NEUROPATIA AUDITIVA',
    'SÍNDROME DE USHER',
    'ATRESIA DE MEATO',
    'OTITE MÉDIA CRÔNICA',
    'OUTROS',
  ],
}

export const GRAU_DEFICIENCIA: Record<string, string[]> = {
  visual: [
    'NÃO SE APLICA',
    'BAIXA VISÃO LEVE',
    'BAIXA VISÃO MODERADA',
    'BAIXA VISÃO GRAVE',
    'PRÓXIMO À CEGUEIRA',
    'CEGUEIRA TOTAL',
  ],
  intelectual: [
    'NÃO SE APLICA',
    'LEVE',
    'MODERADO',
    'GRAVE',
    'PROFUNDO',
  ],
  fisica: [
    'NÃO SE APLICA',
    'LEVE',
    'MODERADO',
    'GRAVE',
    'PROFUNDO',
  ],
  auditiva: [
    'NÃO SE APLICA',
    'LEVE (26 – 40 dBNA)',
    'MODERADA (41 – 55 dBNA)',
    'MODERADAMENTE SEVERA (56 – 70 dBNA)',
    'SEVERA (71 – 90 dBNA)',
    'PROFUNDA (> 91 dBNA)',
    'ANACUSIA',
  ],
}

// Lista de valores dos 3 combobox de Diagnóstico(s) Terapêutico(s)
// Preencher com os valores fornecidos pelo usuário
export const DIAGNOSTICOS_TERAPEUTICOS: string[] = [
  // TODO: inserir a lista de valores aqui
]

export const AREAS = ['visual', 'intelectual', 'fisica', 'auditiva'] as const
export type Area = (typeof AREAS)[number]

export const AREA_LABEL: Record<Area, string> = {
  visual: 'Visual',
  intelectual: 'Intelectual',
  fisica: 'Física',
  auditiva: 'Auditiva',
}

// Lista de valores dos 4 combobox de Instrumentos usados na avaliação
// TODO: preencher com os valores fornecidos pelo usuário
export const INSTRUMENTOS_AVALIACAO: string[] = []

// ── Seção Terapia Indicada ────────────────────────────────────────────────────
export const TERAPIAS_INDICADAS: string[] = [
  'FISIOTERAPIA',
  'FISIOTERAPIA AQUÁTICA',
  'FONOAUDIOLOGIA',
  'TERAPIA OCUPACIONAL',
  'PROFISSIONAL DE EDUCAÇÃO FÍSICA',
  'PSICOLOGIA',
  'PSICOLOGIA SONORO MUSICAL',
  'PSICOPEDAGOGIA',
  'PROFESSOR DE BRAILLE',
  'ATENDIMENTO MÉDICO',
  'ATENDIMENTO MULTIDISCIPLINAR',
]

export const TIPOS_ATENDIMENTO: { value: string; label: string }[] = [
  { value: '01', label: 'Individual' },
  { value: '02', label: 'Dupla' },
  { value: '03', label: 'Grupo 3' },
  { value: '04', label: 'Grupo 4' },
  { value: '05', label: 'Grupo 5' },
  { value: '06', label: 'Grupo 6' },
  { value: '07', label: 'Grupo 7' },
  { value: '08', label: 'Grupo 8' },
  { value: '09', label: 'Grupo 9' },
  { value: '10', label: 'Grupo 10' },
]

export const PERIODICIDADES: { value: string; label: string }[] = [
  { value: '1', label: 'Semanal' },
  { value: '2', label: 'Quinzenal' },
  { value: '3', label: 'Mensal' },
  { value: '4', label: 'Bimestral' },
  { value: '5', label: 'Trimestral' },
  { value: '6', label: 'Semestral' },
  { value: '7', label: 'Anual' },
]

// ── Seção 9: Faz outras terapias no CER IV ───────────────────────────────────
export const CER_GRUPOS = [
  'fisio_to',
  'psicologia',
  'fonoaudiologia',
  'outros',
] as const
export type CerGrupo = (typeof CER_GRUPOS)[number]

export const CER_GRUPO_LABEL: Record<CerGrupo, string> = {
  fisio_to:       'Fisioterapia / Terapia Ocupacional',
  psicologia:     'Psicologia / Psicopedagogia',
  fonoaudiologia: 'Fonoaudiologia',
  outros:         'Outros',
}

export const CER_OPCOES: Record<CerGrupo, string[]> = {
  fisio_to: [
    'FISIOTERAPIA MOTORA',
    'FISIOTERAPIA AQUÁTICA',
    'TERAPIA OCUPACIONAL',
    'ESTIMULAÇÃO VISUAL',
  ],
  psicologia: [
    'PSICOTERAPIA',
    'PSICOTERAPIA - APOIO FAMILIAR',
    'PSICOPEDAGOGIA',
  ],
  fonoaudiologia: [
    'FONOTERAPIA MOTRICIDADE OROFACIAL',
    'FONOTERAPIA LINGUAGEM',
    'REABILITAÇÃO AUDITIVA',
    'FONOTERAPIA COMUNICAÇÃO ALTERNATIVA',
  ],
  outros: [
    'CLÍNICA DE TOXINA BOTULÍNICA',
    'BRAILLE',
    'TECNOLOGIA ASSISTIVA',
    'ORIENTAÇÃO E MOBILIDADE',
    'MUSICOTERAPIA',
  ],
}

export const EXTERNAL_TERAPY_OPTIONS = Object.values(CER_OPCOES).flat().sort()
