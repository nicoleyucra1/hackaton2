import { useEffect } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { DataCards } from '../components/DataCards'
import { ErrorState, Loading } from '../components/StatusViews'
import { useApi } from '../lib/useApi'
import { formatBounty, getCrewName, getFruitLabel } from '../wanted/types'
import type { WantedPoster } from '../wanted/types'

export function WantedDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { data, loading, error, reload } = useApi<WantedPoster>(`/wanted/${encodeURIComponent(id)}`)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  // Si venimos del listado, "atrás" restaura la URL exacta (filtros, página, etc.).
  function goBack() {
    const state = location.state as { fromList?: boolean } | null
    if (state?.fromList) navigate(-1)
    else navigate('/wanted')
  }

  return (
    <div className="space-y-6">
      <button onClick={goBack} className="text-sm text-amber-300 hover:underline">
        ← Volver a los carteles
      </button>

      {loading ? (
        <Loading label="Buscando el cartel…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : data ? (
        <article className="space-y-6">
          <header className="rounded-2xl border border-amber-900/50 bg-amber-950/20 p-6">
            <p className="text-xs uppercase tracking-widest text-amber-500">Se busca · vivo o muerto</p>
            <h1 className="mt-1 text-3xl font-black">{data.name}</h1>
            {data.epithet && <p className="italic text-slate-400">"{data.epithet}"</p>}
            <p className="mt-3 text-3xl font-black text-amber-300">{formatBounty(data.bounty)}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {data.status && <span className="rounded bg-slate-800 px-2 py-0.5">{data.status}</span>}
              {getCrewName(data) && <span className="rounded bg-slate-800 px-2 py-0.5">{getCrewName(data)}</span>}
              {getFruitLabel(data) && <span className="rounded bg-slate-800 px-2 py-0.5">{getFruitLabel(data)}</span>}
            </div>
          </header>
          <section>
            <h2 className="mb-3 text-lg font-bold">Ficha completa</h2>
            <DataCards data={{ ...data }} />
          </section>
        </article>
      ) : null}
    </div>
  )
}
