import api from './client'

export interface AgendaItem {
  cd_agenda_central:       number | null
  hr_agenda:               string | null
  dt_agenda:               string | null   
  cd_paciente:             number | null
  nm_paciente:             string | null
  cd_item_agendamento:     number | null  
  ds_item_agendamento:     string | null   // descrição do item  sn_falta:                string | null
  sn_atendido:             string | null
  nr_fone:                 string | null
  cd_atendimento:          number | null
  cd_convenio:             number | null
  cd_prestador:            number | null
  cd_setor:                number | null
  tp_situacao:             string | null
  cd_unidade_atendimento:  number | null
  ds_observacao:           string | null
  ds_consultorio:          string | null
  sn_encaixe:              string | null
}

export interface AgendaListResponse {
  total: number
  items: AgendaItem[]
  data_referencia: string
}

export async function getAgendaDoPacientes(
  data?: string  // YYYY-MM-DD, opcional — padrão hoje
): Promise<AgendaListResponse> {
  const params = data ? { data } : {}
  const { data: result } = await api.get<AgendaListResponse>('/agenda/pacientes', { params })
  return result
}
