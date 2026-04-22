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

export interface CheckMvResponse {
  existe_local: boolean
  valido_mv: boolean
}

export async function checkMvCode(codigoMv: string): Promise<CheckMvResponse> {
  const { data } = await api.get<CheckMvResponse>(`/auth/check/${codigoMv}`)
  return data
}

export async function registerUser(payload: any): Promise<any> {
  const { data } = await api.post('/auth/register', payload)
  return data
}
