// Muestra un objeto de la API como tarjetas (clave → valor) sin inventar datos.

function toLabel(key: string) {
  const spaced = key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase()
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'number') return value.toLocaleString('es')
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return `${value.length} elementos`
  return ''
}

export function DataCards({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Object.entries(data).map(([key, value]) =>
        typeof value === 'object' && value !== null && !Array.isArray(value) ? (
          <div key={key} className="col-span-2 rounded-xl border border-slate-800 bg-slate-900 p-4 md:col-span-4">
            <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">{toLabel(key)}</p>
            <DataCards data={value as Record<string, unknown>} />
          </div>
        ) : (
          <div key={key} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">{toLabel(key)}</p>
            <p className="mt-1 text-2xl font-bold text-amber-300">{formatValue(value)}</p>
          </div>
        ),
      )}
    </div>
  )
}
