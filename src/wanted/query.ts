// Todo el estado del listado vive en la URL. Aquí se lee (validando) y se escribe.

// ⚠️ Revisar estos valores contra Swagger (enums de status y fruit).
export const STATUS_OPTIONS = [
  { value: 'WANTED', label: 'Se busca' },
  { value: 'CAPTURED', label: 'Capturado' },
  { value: 'DECEASED', label: 'Fallecido' },
] as const

export const FRUIT_OPTIONS = [
  { value: 'PARAMECIA', label: 'Paramecia' },
  { value: 'ZOAN', label: 'Zoan' },
  { value: 'LOGIA', label: 'Logia' },
  { value: 'NONE', label: 'Sin fruta' },
] as const

export const SORT_OPTIONS = [
  { value: 'bounty,desc', label: 'Mayor recompensa' },
  { value: 'name,asc', label: 'Nombre (A-Z)' },
  { value: 'updatedAt,desc', label: 'Actualizados recientemente' },
] as const

export const SIZE_OPTIONS = [10, 20, 50] as const

export interface WantedQuery {
  page: number
  size: number
  sort: string
  status: string
  crewId: string
  fruit: string
  q: string
}

export const DEFAULT_QUERY: WantedQuery = {
  page: 0,
  size: 20,
  sort: 'bounty,desc',
  status: '',
  crewId: '',
  fruit: '',
  q: '',
}

function oneOf(value: string | null, options: readonly { value: string }[], fallback: string): string {
  return options.some((o) => o.value === value) ? (value as string) : fallback
}

// Cualquier valor inválido en la URL se reemplaza por el valor por defecto.
export function parseWantedQuery(params: URLSearchParams): WantedQuery {
  const page = Number(params.get('page') ?? 0)
  const size = Number(params.get('size') ?? DEFAULT_QUERY.size)
  const crewId = params.get('crewId') ?? ''

  return {
    page: Number.isInteger(page) && page >= 0 ? page : 0,
    size: SIZE_OPTIONS.some((s) => s === size) ? size : DEFAULT_QUERY.size,
    sort: oneOf(params.get('sort'), SORT_OPTIONS, DEFAULT_QUERY.sort),
    status: oneOf(params.get('status'), STATUS_OPTIONS, ''),
    fruit: oneOf(params.get('fruit'), FRUIT_OPTIONS, ''),
    crewId: /^[\w-]{1,64}$/.test(crewId) ? crewId : '',
    q: (params.get('q') ?? '').trim().slice(0, 100),
  }
}

// Para la URL del navegador: solo lo que difiere del default, en orden fijo.
export function toSearchParams(query: WantedQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  if (query.status) params.set('status', query.status)
  if (query.crewId) params.set('crewId', query.crewId)
  if (query.fruit) params.set('fruit', query.fruit)
  if (query.sort !== DEFAULT_QUERY.sort) params.set('sort', query.sort)
  if (query.size !== DEFAULT_QUERY.size) params.set('size', String(query.size))
  if (query.page !== 0) params.set('page', String(query.page))
  return params
}

// Para la API: siempre manda page, size y sort.
export function toApiPath(query: WantedQuery): string {
  const params = new URLSearchParams({
    page: String(query.page),
    size: String(query.size),
    sort: query.sort,
  })
  if (query.q) params.set('q', query.q)
  if (query.status) params.set('status', query.status)
  if (query.crewId) params.set('crewId', query.crewId)
  if (query.fruit) params.set('fruit', query.fruit)
  return `/wanted?${params.toString()}`
}
