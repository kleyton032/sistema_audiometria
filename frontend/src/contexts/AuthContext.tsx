import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { ReactNode } from 'react'
import { login as loginService, getMe } from '@/api'
import type { User, Perfil } from '@/types'

function decodeJwtLogin(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.sub ?? null
  } catch {
    return null
  }
}

/**
 * Chave usada no sessionStorage.
 * sessionStorage é escopo por aba/iframe — é limpo automaticamente quando
 * o MV destroi o iframe (logout MV) ou abre uma nova aba para outro usuário.
 * Ao contrário do localStorage, NÃO persiste entre abas nem após fechar.
 */
const TOKEN_KEY = 'access_token'

interface AuthContextType {
  token:           string | null
  nm_login:        string | null
  usuario:         User | null
  perfil:          Perfil | null
  isAuthenticated: boolean
  loading:         boolean
  // helpers de perfil
  isAdmin:         boolean
  isSupervisor:    boolean
  isCoordenador:   boolean
  isOperador:      boolean
  /** true para ADMIN e SUPERVISOR (visão global) */
  isGestor:        boolean
  isSessionExpired: boolean
  clearSessionExpired: () => void
  login:  (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token,   setToken]   = useState<string | null>(null)
  const [nm_login, setNmLogin] = useState<string | null>(null)
  const [usuario, setUsuario] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSessionExpired, setIsSessionExpired] = useState(false)

  // Ref para acessar o valor atual do token dentro de callbacks estáveis (setInterval).
  const tokenRef = useRef<string | null>(null)
  useEffect(() => { tokenRef.current = token }, [token])

  // Busca /users/me assim que tiver token
  const fetchMe = useCallback(async (tkn: string) => {
    try {
      sessionStorage.setItem(TOKEN_KEY, tkn)
      const me = await getMe()
      setUsuario(me)
    } catch {
      // Token inválido ou expirado — em vez de destruir a tela, pede re-login
      window.dispatchEvent(new CustomEvent('auth-unauthorized'))
    }
  }, [])

  // Inicialização: recupera sessão salva no sessionStorage
  useEffect(() => {
    // Migração: remove token legado do localStorage (código anterior usava localStorage).
    // Garante que sessões antigas não causem confusão após a atualização do código.
    localStorage.removeItem(TOKEN_KEY)

    const saved = sessionStorage.getItem(TOKEN_KEY)
    if (saved) {
      setToken(saved)
      setNmLogin(decodeJwtLogin(saved))
      fetchMe(saved).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [fetchMe])

  // Garante consistência entre o estado React e o sessionStorage.
  useEffect(() => {
    const syncSession = () => {
      // Sem token no sessionStorage mas React ainda tem usuário → perdeu sessão externa (ex: MV)
      if (!sessionStorage.getItem(TOKEN_KEY) && tokenRef.current !== null) {
        console.warn('[CDM] Token ausente no sessionStorage — disparando re-login.')
        window.dispatchEvent(new CustomEvent('auth-unauthorized'))
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') syncSession()
    }

    const handleUnauthorized = () => {
      setIsSessionExpired(true)
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('auth-unauthorized', handleUnauthorized)
    
    // Verifica a cada 2 s — cobre o caso em que o MV usa CSS show/hide no iframe
    const id = setInterval(syncSession, 2000)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('auth-unauthorized', handleUnauthorized)
      clearInterval(id)
    }
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const data = await loginService(username, password)
    sessionStorage.setItem(TOKEN_KEY, data.access_token)
    setToken(data.access_token)
    setNmLogin(decodeJwtLogin(data.access_token))
    await fetchMe(data.access_token)
  }, [fetchMe])

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
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
        perfil:          (usuario?.ds_perfil ?? null) as Perfil | null,
        isAuthenticated: !!token,
        loading,
        isAdmin:         usuario?.ds_perfil === 'ADMIN',
        isSupervisor:    usuario?.ds_perfil === 'SUPERVISOR',
        isCoordenador:   usuario?.ds_perfil === 'COORDENADOR',
        isOperador:      usuario?.ds_perfil === 'OPERADOR',
        isGestor:        usuario?.ds_perfil === 'ADMIN' || usuario?.ds_perfil === 'SUPERVISOR',
        isSessionExpired,
        clearSessionExpired: () => setIsSessionExpired(false),
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
