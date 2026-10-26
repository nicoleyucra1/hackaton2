export function FullScreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center">
      <p className="animate-pulse text-slate-400">Consultando el Log Pose…</p>
    </div>
  )
}

export function Loading({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div role="status" className="rounded-xl border border-slate-800 p-6 text-slate-400">
      <span className="animate-pulse">{label}</span>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-900 bg-red-950/40 p-6">
      <p className="text-red-300">{message}</p>
      <button
        onClick={onRetry}
        className="mt-3 rounded-lg bg-red-700 px-4 py-2 text-sm font-medium hover:bg-red-600"
      >
        Reintentar
      </button>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-slate-400">
      {message}
    </div>
  )
}
