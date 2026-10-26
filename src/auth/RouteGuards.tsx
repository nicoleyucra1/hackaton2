import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Location } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { FullScreenLoader } from '../components/StatusViews'

// Rutas privadas: sin sesión → login, guardando a dónde quería ir.
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'checking') return <FullScreenLoader />
  if (status === 'anonymous') return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

// Login / registro: si ya hay sesión, volver a donde quería ir (o al dashboard).
export function PublicOnly() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'checking') return <FullScreenLoader />
  if (status === 'authenticated') return <Navigate to={getRedirectTarget(location)} replace />
  return <Outlet />
}

export function getRedirectTarget(location: Location): string {
  const state = location.state as { from?: Location } | null
  const from = state?.from
  return from ? `${from.pathname}${from.search}${from.hash}` : '/'
}
