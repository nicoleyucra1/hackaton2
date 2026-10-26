import { useEffect, useState } from 'react'
import { apiFetch } from './api'

// Hace un GET y expone data / loading / error / reload.
export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let ignore = false // evita guardar una respuesta si el componente ya cambió
    setLoading(true)
    setError(null)
    apiFetch<T>(path)
      .then((result) => {
        if (!ignore) setData(result)
      })
      .catch((err: unknown) => {
        if (!ignore) setError(err instanceof Error ? err.message : 'Error inesperado')
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [path, reloadKey])

  return { data, loading, error, reload: () => setReloadKey((k) => k + 1) }
}
