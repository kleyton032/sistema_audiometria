// ============================
// Types — User & Auth
// ============================

export type Perfil = 'ADMIN' | 'SUPERVISOR' | 'COORDENADOR' | 'OPERADOR' | 'CONSULTA'

export interface User {
  id_usuario:         number
  nm_login:           string
  nm_usuario:         string
  ds_email:           string
  cd_usuario_mv:      string | null
  ds_perfil:          Perfil
  dt_criacao:         string | null
  fl_ativo:           number
  // dados do prestador MV
  cd_prestador:       number | null
  ds_conselho:        string | null
  ds_codigo_conselho: string | null
  nm_tip_presta:      string | null
  // dados do cadastro local (SILA)
  nr_conselho:        string | null
  ds_especialidade:   string | null
}

export interface LoginPayload {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface UserCreate {
  nm_login: string
  nm_usuario: string
  ds_email: string
  ds_senha: string
  nr_conselho?: string
  ds_especialidade?: string
  ds_perfil?: Perfil
}
