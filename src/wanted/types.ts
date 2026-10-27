export interface Crew {
  id: string | number
  name: string
}

export interface WantedPoster {
  id: string | number
  name: string
  epithet?: string | null
  bounty?: number | null
  status?: string | null
  crewId?: string | number | null
  crewName?: string | null
  crew?: Crew | null
  fruit?: string | null
  devilFruit?: { name?: string | null; type?: string | null } | string | null
  imageUrl?: string | null
  updatedAt?: string | null
}

export interface WantedPage {
  content: WantedPoster[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export function getCrewName(poster: WantedPoster): string | null {
  return poster.crewName ?? poster.crew?.name ?? null
}

export function getFruitLabel(poster: WantedPoster): string | null {
  const df = poster.devilFruit
  if (typeof df === 'string') return df
  if (df) return [df.name, df.type].filter(Boolean).join(' · ') || null
  return poster.fruit ?? null
}

export function formatBounty(bounty: number | null | undefined): string {
  return typeof bounty === 'number' ? `฿ ${bounty.toLocaleString('es')}` : '฿ —'
}
