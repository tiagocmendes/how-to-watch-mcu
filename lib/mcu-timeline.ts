import catalog from '@/data/mcu-catalog.json'

export type MCUContentType = 'movie' | 'tv'

export type MCUPhase = 1 | 2 | 3 | 4 | 5 | 6

export interface MCUItem {
  id: string
  title: string
  mediaType: MCUContentType
  releaseYear: number
  season?: number
  phase: MCUPhase
  timelinePosition: number
  listedTitle: string | null
  posterSrc: string | null
  backdropSrc: string | null
  overview: string
  releaseDate: string | null
  rating: number | null
  tagline: string | null
  runtime: number | null
  runtimeKind: 'film' | 'episode'
  genres: string[]
  director: string | null
  directorLabel: string | null
  cast: string[]
  trailerUrl: string | null
}

export const MCU_TIMELINE = catalog as MCUItem[]
