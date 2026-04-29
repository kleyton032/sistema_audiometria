import api from './client'
import type { User, UserCreate } from '@/types'

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/users/me')
  return data
}

export async function getUserById(id: number): Promise<User> {
  const { data } = await api.get<User>(`/users/${id}`)
  return data
}

export async function createUser(payload: UserCreate): Promise<User> {
  const { data } = await api.post<User>('/users/', payload)
  return data
}
