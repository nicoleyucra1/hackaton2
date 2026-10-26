import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getRedirectTarget } from '../auth/RouteGuards'
import { FormField } from '../components/FormField'
import { ApiError } from '../lib/api'

type Field = 'teamName' | 'email' | 'password'
type FieldErrors = Partial<Record<Field, string>>

// Ubica el error del servidor en el campo que corresponde.
function mapServerErrors(err: ApiError): FieldErrors {
  const errors: FieldErrors = {}
  for (const field of ['teamName', 'email', 'password'] as const) {
    if (err.fieldErrors[field]) errors[field] = err.fieldErrors[field]
  }
  // Si el servidor no indica el campo (ej. 409 "ya registrado"), lo deducimos del mensaje.
  if (Object.keys(errors).length === 0) {
    const text = `${err.code ?? ''} ${err.message}`.toLowerCase()
    if (text.includes('email')) errors.email = err.message
    else if (text.includes('name') || text.includes('nombre') || text.includes('team')) errors.teamName = err.message
  }
  return errors
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ teamName: '', email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function update(field: Field, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
    setFieldErrors((errs) => ({ ...errs, [field]: undefined })) // limpia el error al corregir
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    setSubmitting(true)
    try {
      await register(form.teamName, form.email, form.password)
      navigate(getRedirectTarget(location), { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        const mapped = mapServerErrors(err)
        setFieldErrors(mapped)
        if (Object.keys(mapped).length === 0) setError(err.message)
      } else {
        setError('No se pudo registrar la tripulación')
      }
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold text-amber-400">Registrar tripulación</h1>
        <FormField label="Nombre del equipo" name="teamName" required value={form.teamName} error={fieldErrors.teamName} onChange={(e) => update('teamName', e.target.value)} />
        <FormField label="Email" name="email" type="email" required value={form.email} error={fieldErrors.email} onChange={(e) => update('email', e.target.value)} />
        <FormField label="Contraseña" name="password" type="password" required value={form.password} error={fieldErrors.password} onChange={(e) => update('password', e.target.value)} />
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <button disabled={submitting} className="w-full rounded-lg bg-amber-500 py-2 font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-50">
          {submitting ? 'Registrando…' : 'Registrar y zarpar'}
        </button>
        <p className="text-center text-sm text-slate-400">
          ¿Ya tienen cuenta?{' '}
          <Link to="/login" state={location.state} className="text-amber-300 underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  )
}
