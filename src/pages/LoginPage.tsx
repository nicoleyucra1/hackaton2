import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getRedirectTarget } from '../auth/RouteGuards'
import { FormField } from '../components/FormField'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate(getRedirectTarget(location), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold text-amber-400">Iniciar sesión</h1>
        <FormField label="Email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <FormField label="Contraseña" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button disabled={submitting} className="w-full rounded-lg bg-amber-500 py-2 font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50">
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
        <p className="text-center text-sm text-slate-400">
          ¿Nueva tripulación?{' '}
          <Link to="/register" state={location.state} className="text-amber-300 underline">
            Regístrala
          </Link>
        </p>
      </form>
    </div>
  )
}
