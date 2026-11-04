// ============================
// Types — Psicologia (PAFE)
// ============================

export interface PsiItem {
  id_item: number
  ds_codigo: string
  ds_dominio: string
  nr_ordem: number
  ds_componente: string | null
  ds_criterio: string | null
}

export interface PsiProtocolo {
  id_protocolo: number
  ds_codigo: string
  nr_versao: string
  ds_titulo: string
  nr_idade_min: number | null
  nr_idade_max: number | null
  ds_faixa_etaria: string | null
  ds_escala: string | null
  ds_situacao: string
  itens: PsiItem[]
}

export interface PsiResposta {
  id_item: number
  ds_codigo: string | null
  ds_dominio: string | null
  nr_valor: number
  ds_observacao: string | null
}

export interface PsiResultado {
  ds_dominio: string
  nr_subtotal: number
  nr_maximo: number
}

export type PsiSituacao = 'RASCUNHO' | 'FINALIZADO' | 'CANCELADO'

export interface PsiAvaliacao {
  id_avaliacao: number
  cd_paciente: string
  cd_atendimento: string | null
  id_usuario: number
  cd_prestador: number | null
  dt_clinica: string
  nr_idade_aplicacao: number | null
  id_protocolo: number
  ds_situacao: string
  ds_observacoes: string | null
  ds_evolucao: string | null
  ds_conduta: string | null
  nr_revisao: number
  dt_criacao: string | null
  respostas: PsiResposta[]
  resultados: PsiResultado[]
}

export interface PsiAvaliacaoLista {
  total: number
  items: PsiAvaliacao[]
}

export interface PsiRespostaIn {
  id_item: number
  nr_valor: number
  ds_observacao?: string | null
}

export interface PsiAvaliacaoCreate {
  cd_paciente: string
  cd_atendimento?: string | null
  dt_clinica: string
  id_protocolo: number
}

export interface PsiAvaliacaoUpdate {
  respostas: PsiRespostaIn[]
  ds_observacoes?: string | null
  ds_evolucao?: string | null
  ds_conduta?: string | null
  nr_revisao: number
}
