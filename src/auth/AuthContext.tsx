import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { apiFetch, setUnauthorizedHandler, tokenStorage } from '../lib/api'

export interface User {
  teamName?: string
  teamCode?: string
  email?: string
}

type AuthStatus = 'checking' | 'authenticated' | 'anonymous'

interface TokenResponse {
  token?: string
  accessToken?: string
}

interface AuthContextValue {
  status: AuthStatus
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (teamName: string, email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function extractToken(data: TokenResponse): string | null {
  return data.token ?? data.accessToken ?? null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Si hay token guardado empezamos en "checking" para no mostrar el login mientras verificamos.
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStorage.get() ? 'checking' : 'anonymous'))
  const [user, setUser] = useState<User | null>(null)

  const logout = useCallback(() => {
    tokenStorage.clear()
    setUser(null)
    setStatus('anonymous')
  }, [])

  // Cuando cualquier request devuelve 401, cerramos sesión → RequireAuth manda al login.
  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  // Restaurar sesión al recargar.
  useEffect(() => {
    if (!tokenStorage.get()) return
    apiFetch<User>('/auth/me')
      .then((me) => {
        setUser(me)
        setStatus('authenticated')
      })
      .catch(() => logout())
  }, [logout])

  async function startSession(token: string) {
    tokenStorage.set(token)
    const me = await apiFetch<User>('/auth/me')
    setUser(me)
    setStatus('authenticated')
  }

  async function login(email: string, password: string) {
    const data = await apiFetch<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    const token = extractToken(data)
    if (!token) throw new Error('El servidor no devolvió un token')
    await startSession(token)
  }

  async function register(teamName: string, email: string, password: string) {
    const data = await apiFetch<TokenResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ teamName, email, password }),
    })
    const token = extractToken(data)
    if (token) {
      await startSession(token)
    } else {
      await login(email, password) // por si el registro no devuelve token
    }
  }

  return (
    <AuthContext.Provider value={{ status, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
