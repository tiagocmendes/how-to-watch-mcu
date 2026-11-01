import type { MCUDetails } from '@/lib/mcu-timeline'
import { fetchTMDB, getTMDBApiKey } from '@/lib/tmdb'

export const dynamic = 'force-dynamic'

type TMDBPerson = { name: string; job?: string; department?: string }
type TMDBVideo = {
  key?: string
  site?: string
  type?: string
  official?: boolean
  published_at?: string
}

type TMDBDetailsResponse = {
  title?: string
  name?: string
  tagline?: string
  overview?: string
  release_date?: string
  first_air_date?: string
  runtime?: number | null
  episode_run_time?: number[]
  genres?: Array<{ name: string }>
  vote_average?: number
  poster_path?: string | null
  backdrop_path?: string | null
  created_by?: TMDBPerson[]
  credits?: {
    cast?: TMDBPerson[]
    crew?: TMDBPerson[]
  }
  videos?: { results?: TMDBVideo[] }
}

type TMDBSeasonResponse = {
  air_date?: string | null
  overview?: string
  poster_path?: string | null
  episodes?: Array<{ runtime?: number | null }>
}

type RouteContext = { params: Promise<{ mediaType: string; id: string }> }

export async function GET(request: Request, context: RouteContext) {
  const { mediaType, id } = await context.params
  const apiKey = getTMDBApiKey()
  const numericId = Number(id)

  if ((mediaType !== 'movie' && mediaType !== 'tv') || !Number.isSafeInteger(numericId) || numericId < 1) {
    return Response.json({ error: 'Invalid TMDB resource.' }, { status: 400 })
  }

  if (!apiKey) {
    return Response.json({ error: 'TMDB_API_KEY_MISSING' }, { status: 503 })
  }

  const url = new URL(request.url)
  const seasonValue = url.searchParams.get('season')
  const seasonNumber = seasonValue && /^\d+$/.test(seasonValue) ? Number(seasonValue) : null
  let media: TMDBDetailsResponse

  try {
    media = await fetchTMDB<TMDBDetailsResponse>(`/${mediaType}/${numericId}`, apiKey, {
      append_to_response: 'credits,videos',
    })
  } catch {
    return Response.json({ error: 'TMDB_UNAVAILABLE' }, { status: 502 })
  }

  let season: TMDBSeasonResponse | null = null
  if (mediaType === 'tv' && seasonNumber !== null) {
    try {
      season = await fetchTMDB<TMDBSeasonResponse>(`/tv/${numericId}/season/${seasonNumber}`, apiKey)
    } catch {
      season = null
    }
  }

  const director = media.credits?.crew?.find((person) => person.job === 'Director')
  const creator = media.created_by?.[0]
  const trailer = (media.videos?.results ?? [])
    .filter((video) => video.site === 'YouTube' && video.key && (video.type === 'Trailer' || video.type === 'Teaser'))
    .sort((left, right) => Number(Boolean(right.official)) - Number(Boolean(left.official)))[0]
  const episodeRuntime = media.episode_run_time?.find((runtime) => runtime > 0)
    ?? season?.episodes?.find((episode) => typeof episode.runtime === 'number' && episode.runtime > 0)?.runtime
    ?? null

  const details: MCUDetails = {
    tmdbTitle: media.title ?? media.name ?? null,
    tagline: media.tagline || null,
    overview: season?.overview || media.overview || '',
    releaseDate: season?.air_date ?? media.release_date ?? media.first_air_date ?? null,
    runtime: mediaType === 'movie' ? media.runtime ?? null : episodeRuntime,
    runtimeKind: mediaType === 'movie' ? 'film' : 'episode',
    genres: (media.genres ?? []).map((genre) => genre.name),
    rating: typeof media.vote_average === 'number' ? media.vote_average : null,
    posterPath: season?.poster_path ?? media.poster_path ?? null,
    backdropPath: media.backdrop_path ?? null,
    director: director?.name ?? creator?.name ?? null,
    directorLabel: director ? 'Director' : creator ? 'Created by' : null,
    cast: (media.credits?.cast ?? []).slice(0, 5).map((person) => person.name),
    trailerUrl: trailer?.key ? `https://www.youtube.com/watch?v=${trailer.key}` : null,
  }

  return Response.json(details)
}

