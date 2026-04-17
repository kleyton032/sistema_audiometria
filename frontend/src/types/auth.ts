// ============================
// Types — User & Auth
// ============================

export interface User {
  id_usuario: number
  nm_login: string
  nm_usuario: string
  ds_email: string
  nr_conselho: string | null
  ds_especialidade: string | null
  ds_perfil: 'ADMIN' | 'AUDIÓLOGO' | 'OPERADOR'
  dt_criacao: string | null
  fl_ativo: number
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
  ds_perfil?: 'ADMIN' | 'AUDIÓLOGO' | 'OPERADOR'
}
