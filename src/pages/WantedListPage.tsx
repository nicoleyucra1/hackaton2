import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState } from '../components/StatusViews'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { apiFetch } from '../lib/api'
import { useApi } from '../lib/useApi'
import { pageCache, scrollMemory } from '../wanted/listMemory'
import {
  FRUIT_OPTIONS,
  SIZE_OPTIONS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  parseWantedQuery,
  toApiPath,
  toSearchParams,
} from '../wanted/query'
import type { WantedQuery } from '../wanted/query'
import { formatBounty, getCrewName, getFruitLabel } from '../wanted/types'
import type { Crew, WantedPage } from '../wanted/types'

// /crews puede venir como lista o paginado.
function toCrewList(data: Crew[] | { content: Crew[] } | null): Crew[] {
  if (!data) return []
  return Array.isArray(data) ? data : data.content ?? []
}

const selectClass = 'rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm'

export function WantedListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = useMemo(() => parseWantedQuery(searchParams), [searchParams])
  const apiPath = toApiPath(query)

  // Si la URL traía valores inválidos, la reemplazamos por la versión corregida.
  useEffect(() => {
    const clean = toSearchParams(query)
    if (clean.toString() !== searchParams.toString()) setSearchParams(clean, { replace: true })
  }, [query, searchParams, setSearchParams])

  function updateQuery(patch: Partial<WantedQuery>, replace = false) {
    // Cualquier cambio que no sea de página vuelve a la página 0.
    const next = { ...query, page: 0, ...patch }
    setSearchParams(toSearchParams(next), { replace })
  }

  // ---- Búsqueda con debounce: una sola request cuando el usuario deja de escribir ----
  const [searchInput, setSearchInput] = useState(query.q)
  const debouncedSearch = useDebouncedValue(searchInput, 400)

  useEffect(() => {
    setSearchInput(query.q) // si la URL cambia (atrás/adelante), el input la sigue
  }, [query.q])

  useEffect(() => {
    const q = debouncedSearch.trim()
    if (q !== query.q) updateQuery({ q })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  // ---- Datos del listado ----
  const [result, setResult] = useState<{ path: string; data: WantedPage } | null>(() => {
    const cached = pageCache.get(apiPath)
    return cached ? { path: apiPath, data: cached } : null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const cached = pageCache.get(apiPath)
    if (cached) setResult({ path: apiPath, data: cached })
    setLoading(true)
    setError(null)

    apiFetch<WantedPage>(apiPath, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return
        pageCache.set(apiPath, data)
        setResult({ path: apiPath, data })
        setLoading(false)
      })
      .catch((err: unknown) => {
        // Una request cancelada es una respuesta vieja: se ignora.
        if (controller.signal.aborted) return
        setError(err instanceof Error ? err.message : 'Error al cargar los carteles')
        setLoading(false)
      })

    // Al cambiar la búsqueda, se cancela la request anterior.
    return () => controller.abort()
  }, [apiPath, reloadKey])

  // Si la página pedida ya no existe (p. ej. tras filtrar), ir a la última que sí existe.
  useEffect(() => {
    if (!result || result.path !== apiPath) return
    const { totalPages } = result.data
    if (totalPages > 0 && query.page >= totalPages) updateQuery({ page: totalPages - 1 }, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, apiPath, query.page])

  // Al volver del detalle, restaurar el scroll.
  useLayoutEffect(() => {
    if (scrollMemory.y > 0 && result) {
      window.scrollTo(0, scrollMemory.y)
      scrollMemory.y = 0
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const crews = useApi<Crew[] | { content: Crew[] }>('/crews')
  const crewList = toCrewList(crews.data)

  const page = result?.data
  const posters = page?.content ?? []
  const hasFilters = Boolean(query.q || query.status || query.crewId || query.fruit)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">📜 Carteles de "Se Busca"</h1>

      {/* Filtros */}
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <input
          type="search"
          placeholder="Buscar por nombre o epíteto…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className={`${selectClass} md:col-span-3 lg:col-span-2`}
        />
        <select aria-label="Estado" value={query.status} onChange={(e) => updateQuery({ status: e.target.value })} className={selectClass}>
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select aria-label="Tripulación" value={query.crewId} onChange={(e) => updateQuery({ crewId: e.target.value })} className={selectClass}>
          <option value="">Todas las tripulaciones</option>
          {crewList.map((c) => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
        <select aria-label="Fruta del diablo" value={query.fruit} onChange={(e) => updateQuery({ fruit: e.target.value })} className={selectClass}>
          <option value="">Todas las frutas</option>
          {FRUIT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select aria-label="Ordenar" value={query.sort} onChange={(e) => updateQuery({ sort: e.target.value })} className={selectClass}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Línea de estado con altura fija para que nada salte */}
      <div className="flex h-6 items-center justify-between text-sm text-slate-400">
        <span>{page ? `${page.totalElements.toLocaleString('es')} carteles` : ''}</span>
        {loading && <span className="animate-pulse">Actualizando…</span>}
      </div>

      {/* Resultados */}
      <div className="min-h-[480px]">
        {error ? (
          <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        ) : !page ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-slate-900" />
            ))}
          </div>
        ) : posters.length === 0 ? (
          <EmptyState message={hasFilters ? 'Ningún cartel coincide con estos filtros.' : 'No hay carteles todavía.'} />
        ) : (
          <ul className={`grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-50' : ''}`}>
            {posters.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/wanted/${p.id}`}
                  state={{ fromList: true }}
                  onClick={() => (scrollMemory.y = window.scrollY)}
                  className="block h-full rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 hover:border-amber-500"
                >
                  <p className="text-xs uppercase tracking-widest text-amber-500">Se busca</p>
                  <p className="mt-1 text-lg font-bold">{p.name}</p>
                  {p.epithet && <p className="text-sm italic text-slate-400">"{p.epithet}"</p>}
                  <p className="mt-2 text-xl font-black text-amber-300">{formatBounty(p.bounty)}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                    {p.status && <span className="rounded bg-slate-800 px-2 py-0.5">{p.status}</span>}
                    {getCrewName(p) && <span className="rounded bg-slate-800 px-2 py-0.5">{getCrewName(p)}</span>}
                    {getFruitLabel(p) && <span className="rounded bg-slate-800 px-2 py-0.5">{getFruitLabel(p)}</span>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Paginación */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-slate-400">
          Por página
          <select value={query.size} onChange={(e) => updateQuery({ size: Number(e.target.value) })} className={selectClass}>
            {SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-3 text-sm">
          <button
            disabled={query.page === 0}
            onClick={() => updateQuery({ page: query.page - 1 })}
            className="rounded-lg border border-slate-700 px-3 py-1 disabled:opacity-40"
          >
            ← Anterior
          </button>
          <span className="text-slate-400">
            Página {query.page + 1} de {Math.max(page?.totalPages ?? 1, 1)}
          </span>
          <button
            disabled={!page || query.page >= page.totalPages - 1}
            onClick={() => updateQuery({ page: query.page + 1 })}
            className="rounded-lg border border-slate-700 px-3 py-1 disabled:opacity-40"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  )
}
