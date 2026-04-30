import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { login as loginService, getMe } from '@/api'
import type { User } from '@/types'

function decodeJwtLogin(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.sub ?? null
  } catch {
    return null
  }
}

interface AuthContextType {
  token:           string | null
  nm_login:        string | null
  usuario:         User | null
  isAuthenticated: boolean
  loading:         boolean
  login:  (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token,   setToken]   = useState<string | null>(null)
  const [nm_login, setNmLogin] = useState<string | null>(null)
  const [usuario, setUsuario] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Busca /users/me assim que tiver token
  const fetchMe = useCallback(async (tkn: string) => {
    try {
      // Garante que o client já tem o token antes de chamar
      localStorage.setItem('access_token', tkn)
      const me = await getMe()
      setUsuario(me)
    } catch {
      setUsuario(null)
    }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('access_token')
    if (saved) {
      setToken(saved)
      setNmLogin(decodeJwtLogin(saved))
      fetchMe(saved).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [fetchMe])

  const login = useCallback(async (username: string, password: string) => {
    const data = await loginService(username, password)
    setToken(data.access_token)
    setNmLogin(decodeJwtLogin(data.access_token))
    await fetchMe(data.access_token)
  }, [fetchMe])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    setToken(null)
    setNmLogin(null)
    setUsuario(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        token,
        nm_login,
        usuario,
        isAuthenticated: !!token,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
