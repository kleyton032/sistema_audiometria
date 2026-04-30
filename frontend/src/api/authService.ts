import api from './client'
import type { TokenResponse } from '@/types'

export async function login(username: string, password: string): Promise<TokenResponse> {
  const params = new URLSearchParams()
  params.append('username', username)
  params.append('password', password)

  const { data } = await api.post<TokenResponse>('/auth/token', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}

export interface PrestadorMVInfo {
  cd_prestador:       number
  nm_prestador:       string
  ds_conselho:        string | null
  ds_codigo_conselho: string | null
  nm_tip_presta:      string | null
}

export interface CheckMvResponse {
  existe_local: boolean
  prestador:    PrestadorMVInfo | null
}

export async function checkMvCode(codigoMv: string): Promise<CheckMvResponse> {
  const { data } = await api.get<CheckMvResponse>(`/auth/check/${codigoMv}`)
  return data
}

export async function registerUser(cdUsuarioMv: string, dsSenha: string, dsEmail?: string): Promise<any> {
  const { data } = await api.post('/auth/register', {
    cd_usuario_mv: cdUsuarioMv,
    ds_senha:      dsSenha,
    ds_email:      dsEmail,
  })
  return data
}
