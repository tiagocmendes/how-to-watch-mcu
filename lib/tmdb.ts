const TMDB_API_ROOT = 'https://api.themoviedb.org/3'
export const TMDB_CACHE_SECONDS = 60 * 60 * 24

export function getTMDBApiKey() {
  return process.env.NEXT_PUBLIC_TMDB_API_KEY
}

export async function fetchTMDB<T>(
  path: string,
  apiKey: string,
  query: Record<string, string> = {},
): Promise<T> {
  const url = new URL(`${TMDB_API_ROOT}${path.startsWith('/') ? path : `/${path}`}`)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('language', 'en-US')

  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    next: { revalidate: TMDB_CACHE_SECONDS },
  })

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}
