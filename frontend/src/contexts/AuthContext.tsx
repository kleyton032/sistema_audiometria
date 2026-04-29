import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import { login as loginService } from '@/api'

function decodeJwtLogin(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.sub ?? null
  } catch {
    return null
  }
}

interface AuthContextType {
  token: string | null
  nm_login: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [nm_login, setNmLogin] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('access_token')
    if (saved) {
      setToken(saved)
      setNmLogin(decodeJwtLogin(saved))
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const data = await loginService(username, password)
    localStorage.setItem('access_token', data.access_token)
    setToken(data.access_token)
    setNmLogin(decodeJwtLogin(data.access_token))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    setToken(null)
    setNmLogin(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        token,
        nm_login,
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
