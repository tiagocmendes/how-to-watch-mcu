import { MCU_TIMELINE, type MCUItem, type MCUItemSource } from '@/lib/mcu-timeline'
import { fetchTMDB, getTMDBApiKey } from '@/lib/tmdb'

export const dynamic = 'force-dynamic'

type TMDBSearchResult = {
  id: number
  title?: string
  name?: string
  overview?: string
  poster_path?: string | null
  backdrop_path?: string | null
  release_date?: string
  first_air_date?: string
  vote_average?: number
  popularity?: number
}

type TMDBSearchResponse = { results?: TMDBSearchResult[] }

type TMDBSeasonSummary = {
  season_number: number
  air_date?: string | null
  overview?: string
  poster_path?: string | null
}

type TMDBTVSummary = {
  seasons?: TMDBSeasonSummary[]
  poster_path?: string | null
  backdrop_path?: string | null
  overview?: string
}

function lookupKey(item: MCUItemSource) {
  return `${item.mediaType}:${item.tmdbQuery.trim().toLocaleLowerCase('en-US')}:${item.mediaType === 'movie' ? item.releaseYear : ''}`
}

function normalizeTitle(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('en-US')
    .replace(/[^a-z0-9]+/g, '')
}

function selectBestMatch(results: TMDBSearchResult[], query: string) {
  const normalizedQuery = normalizeTitle(query)

  return [...results].sort((left, right) => {
    const leftTitle = normalizeTitle(left.title ?? left.name ?? '')
    const rightTitle = normalizeTitle(right.title ?? right.name ?? '')
    const leftScore = leftTitle === normalizedQuery ? 0 : leftTitle.includes(normalizedQuery) ? 1 : 2
    const rightScore = rightTitle === normalizedQuery ? 0 : rightTitle.includes(normalizedQuery) ? 1 : 2

    return leftScore - rightScore || (right.popularity ?? 0) - (left.popularity ?? 0)
  })[0] ?? null
}

async function searchTitle(item: MCUItemSource, apiKey: string) {
  const search = async (includeYear: boolean) => {
    const query: Record<string, string> = {
      query: item.tmdbQuery.trim(),
      include_adult: 'false',
    }

    if (includeYear && item.mediaType === 'movie') {
      query.primary_release_year = String(item.releaseYear)
    }

    return fetchTMDB<TMDBSearchResponse>(`/search/${item.mediaType}`, apiKey, query)
  }

  let results = (await search(item.mediaType === 'movie')).results ?? []

  if (results.length === 0 && item.mediaType === 'movie') {
    results = (await search(false)).results ?? []
  }

  return selectBestMatch(results, item.tmdbQuery)
}

async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(values.length)
  let cursor = 0

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, async () => {
      while (cursor < values.length) {
        const index = cursor++
        results[index] = await mapper(values[index])
      }
    }),
  )

  return results
}

export async function GET() {
  const apiKey = getTMDBApiKey()

  if (!apiKey) {
    return Response.json({
      configured: false,
      error: 'TMDB_API_KEY_MISSING',
      items: MCU_TIMELINE,
    })
  }

  const uniqueItems = new Map<string, MCUItemSource>()
  for (const item of MCU_TIMELINE) uniqueItems.set(lookupKey(item), item)

  let searchFailures = 0
  const searches = await mapWithConcurrency([...uniqueItems.values()], 8, async (item) => {
    try {
      return [lookupKey(item), await searchTitle(item, apiKey)] as const
    } catch {
      searchFailures += 1
      return [lookupKey(item), null] as const
    }
  })
  const resultsByQuery = new Map(searches)

  const seriesIds = [
    ...new Set(
      MCU_TIMELINE.filter((item) => item.mediaType === 'tv' && item.season !== undefined)
        .map((item) => resultsByQuery.get(lookupKey(item))?.id)
        .filter((id): id is number => typeof id === 'number'),
    ),
  ]
  const seasonLookups = await mapWithConcurrency(seriesIds, 6, async (id) => {
    try {
      return [id, await fetchTMDB<TMDBTVSummary>(`/tv/${id}`, apiKey)] as const
    } catch {
      return [id, null] as const
    }
  })
  const seriesById = new Map<number, TMDBTVSummary | null>(seasonLookups)

  const items: MCUItem[] = MCU_TIMELINE.map((item) => {
    const result = resultsByQuery.get(lookupKey(item)) ?? null
    const series = result && item.mediaType === 'tv' ? seriesById.get(result.id) : null
    const season = item.season === undefined
      ? undefined
      : series?.seasons?.find((entry) => entry.season_number === item.season)

    return {
      ...item,
      tmdbId: result?.id ?? null,
      tmdbTitle: result?.title ?? result?.name ?? null,
      posterPath: season?.poster_path ?? result?.poster_path ?? series?.poster_path ?? null,
      backdropPath: result?.backdrop_path ?? series?.backdrop_path ?? null,
      overview: season?.overview || result?.overview || series?.overview || '',
      releaseDate: item.season !== undefined
        ? season?.air_date ?? null
        : result?.release_date ?? result?.first_air_date ?? null,
      rating: typeof result?.vote_average === 'number' ? result.vote_average : null,
    }
  })

  return Response.json({
    configured: true,
    items,
    ...(searchFailures === uniqueItems.size ? { error: 'TMDB_UNAVAILABLE' as const } : {}),
  })
}
