import type { WantedPage } from './types'

// Memoria simple (vive mientras la pestaña esté abierta) para que al volver del
// detalle el listado se pinte al instante y en la misma posición de scroll.
export const pageCache = new Map<string, WantedPage>()

export const scrollMemory = { y: 0 }
