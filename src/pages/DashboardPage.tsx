import { DataCards } from '../components/DataCards'
import { EmptyState, ErrorState, Loading } from '../components/StatusViews'
import { useApi } from '../lib/useApi'

type ApiObject = Record<string, unknown>

export function DashboardPage() {
  const summary = useApi<ApiObject>('/dashboard/summary')
  const logPose = useApi<ApiObject>('/log-pose')

  return (
    <div className="space-y-10">
      <section>
        <h1 className="mb-4 text-2xl font-bold">Indicadores de la tripulación</h1>
        {summary.loading ? (
          <Loading />
        ) : summary.error ? (
          <ErrorState message={summary.error} onRetry={summary.reload} />
        ) : !summary.data || Object.keys(summary.data).length === 0 ? (
          <EmptyState message="Tu tripulación aún no tiene indicadores." />
        ) : (
          <DataCards data={summary.data} />
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">🧭 Estado del Log Pose</h2>
        {logPose.loading ? (
          <Loading />
        ) : logPose.error ? (
          <ErrorState message={logPose.error} onRetry={logPose.reload} />
        ) : !logPose.data || Object.keys(logPose.data).length === 0 ? (
          <EmptyState message="Sin información del Log Pose." />
        ) : (
          <DataCards data={logPose.data} />
        )}
      </section>
    </div>
  )
}
