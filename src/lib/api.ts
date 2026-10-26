// Cliente HTTP único de la app: agrega el token, normaliza errores
// y avisa cuando la sesión deja de ser válida (401).

const BASE_URL = import.meta.env.VITE_API_BASE_URL
const TOKEN_KEY = 'logpose_token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  code: string | null
  fieldErrors: Record<string, string>

  constructor(status: number, message: string, code: string | null = null, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

// El AuthProvider registra aquí qué hacer cuando el servidor responde 401.
let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Lee los errores por campo, sin importar si vienen como objeto o como lista.
function readFieldErrors(body: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {}
  const raw = body.fieldErrors ?? body.errors ?? body.details
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (isRecord(item) && typeof item.field === 'string') {
        result[item.field] = typeof item.message === 'string' ? item.message : 'Valor inválido'
      }
    }
  } else if (isRecord(raw)) {
    for (const [field, msg] of Object.entries(raw)) {
      if (typeof msg === 'string') result[field] = msg
      else if (Array.isArray(msg) && typeof msg[0] === 'string') result[field] = msg[0]
    }
  }
  return result
}

function toApiError(status: number, body: unknown): ApiError {
  if (!isRecord(body)) return new ApiError(status, `Error ${status}`)
  const message =
    typeof body.message === 'string' ? body.message
    : typeof body.error === 'string' ? body.error
    : `Error ${status}`
  const code = typeof body.code === 'string' ? body.code : null
  return new ApiError(status, message, code, readFieldErrors(body))
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  const token = tokenStorage.get()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor')
  }

  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    // Si teníamos token y el servidor lo rechaza, la sesión ya no es válida.
    if (response.status === 401 && token) onUnauthorized?.()
    throw toApiError(response.status, body)
  }
  return body as T
}
