'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { ArrowDownRight, ArrowUpRight, RotateCcw, Search, Sparkles, Star, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import useSWR from 'swr'
import { Toggle } from '@/components/ui/toggle'
import { MCUDetailsModal } from '@/components/mcu-details-modal'
import { MCUPosterCard } from '@/components/mcu-poster-card'
import { MCU_TIMELINE, type MCUCatalogResponse, type MCUItem } from '@/lib/mcu-timeline'

const WATCHED_STORAGE_KEY = 'multiverse-rewatch:watched:v1'

type OrderMode = 'timeline' | 'release'
type FilterMode = 'all' | 'unwatched' | 'watched'

async function fetchCatalog(url: string): Promise<MCUCatalogResponse> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('The MCU catalog could not be loaded.')
  return response.json() as Promise<MCUCatalogResponse>
}

function releaseTimestamp(item: MCUItem) {
  if (item.releaseDate) {
    const parsedDate = Date.parse(`${item.releaseDate.slice(0, 10)}T00:00:00Z`)
    if (Number.isFinite(parsedDate)) return parsedDate
  }

  return Date.UTC(item.releaseYear, 0, 1) + item.timelinePosition
}

export function MCURewatcher() {
  const shouldReduceMotion = useReducedMotion() ?? false
  const { data: catalog, error: catalogError, isLoading: catalogLoading } = useSWR<MCUCatalogResponse>(
    '/api/mcu/catalog',
    fetchCatalog,
    {
      dedupingInterval: 86_400_000,
      revalidateOnFocus: false,
      shouldRetryOnError: false,
    },
  )
  const [watchedIds, setWatchedIds] = useState<string[]>([])
  const [progressReady, setProgressReady] = useState(false)
  const [orderMode, setOrderMode] = useState<OrderMode>('timeline')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [resetOpen, setResetOpen] = useState(false)

  useEffect(() => {
    try {
      const savedProgress = window.localStorage.getItem(WATCHED_STORAGE_KEY)
      if (savedProgress) {
        const parsedProgress: unknown = JSON.parse(savedProgress)
        if (Array.isArray(parsedProgress)) {
          setWatchedIds(parsedProgress.filter((id): id is string => typeof id === 'string'))
        }
      }
    } catch {
      setWatchedIds([])
    } finally {
      setProgressReady(true)
    }
  }, [])

  const items = catalog?.items?.length ? catalog.items : MCU_TIMELINE
  const watchedSet = useMemo(() => new Set(watchedIds), [watchedIds])
  const watchedCount = items.reduce((count, item) => count + Number(watchedSet.has(item.id)), 0)
  const progress = items.length ? Math.round((watchedCount / items.length) * 100) : 0

  const visibleItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('en-US')
    const sorted = [...items].sort((left, right) => {
      if (orderMode === 'timeline') return left.timelinePosition - right.timelinePosition
      return releaseTimestamp(left) - releaseTimestamp(right) || left.timelinePosition - right.timelinePosition
    })

    return sorted.filter((item) => {
      const matchesSearch = !normalizedSearch
        || item.title.toLocaleLowerCase('en-US').includes(normalizedSearch)
        || item.tmdbTitle?.toLocaleLowerCase('en-US').includes(normalizedSearch)
      const isWatched = watchedSet.has(item.id)
      const matchesFilter = filterMode === 'all'
        || (filterMode === 'watched' && isWatched)
        || (filterMode === 'unwatched' && !isWatched)

      return matchesSearch && matchesFilter
    })
  }, [filterMode, items, orderMode, searchTerm, watchedSet])

  const toggleWatched = useCallback((id: string) => {
    const nextIds = watchedIds.includes(id)
      ? watchedIds.filter((watchedId) => watchedId !== id)
      : [...watchedIds, id]
    setWatchedIds(nextIds)

    try {
      window.localStorage.setItem(WATCHED_STORAGE_KEY, JSON.stringify(nextIds))
    } catch {
      // Keep this interaction usable when browser storage is unavailable.
    }
  }, [watchedIds])

  const resetProgress = useCallback(() => {
    setWatchedIds([])
    try {
      window.localStorage.removeItem(WATCHED_STORAGE_KEY)
    } catch {
      // The in-memory progress still resets when browser storage is unavailable.
    }
  }, [])

  const closeDetails = useCallback(() => setActiveItemId(null), [])
  const activeItem = items.find((item) => item.id === activeItemId) ?? null

  const navigateDetails = useCallback((direction: -1 | 1) => {
    if (!activeItem || visibleItems.length < 2) return
    const currentIndex = visibleItems.findIndex((item) => item.id === activeItem.id)
    const nextIndex = (currentIndex + direction + visibleItems.length) % visibleItems.length
    setActiveItemId(visibleItems[nextIndex].id)
  }, [activeItem, visibleItems])

  const updateOrder = (value: string[]) => {
    if (value[0] === 'timeline' || value[0] === 'release') setOrderMode(value[0])
  }

  const updateFilter = (value: string[]) => {
    if (value[0] === 'all' || value[0] === 'unwatched' || value[0] === 'watched') {
      setFilterMode(value[0])
    }
  }

  return (
    <main className="app-shell" id="top">
      <div className="page-wrap">
        <header className="site-header">
          <a className="wordmark" href="#top" aria-label="Rewatch the Multiverse home">
            <span className="wordmark-mark"><Sparkles size={18} aria-hidden="true" /></span>
            <span className="wordmark-type">MULTIVERSE<br />ARCHIVE</span>
          </a>
          <p className="header-note">A PERSONAL MCU REWATCH TRACKER <span aria-hidden="true">·</span> EST. 2026</p>
          <a className="header-link" href="#timeline">Explore timeline <ArrowDownRight size={15} aria-hidden="true" /></a>
        </header>

        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> YOUR STORY, YOUR ORDER</p>
            <h1 className="hero-title" id="hero-title">Rewatch the<br /><span>Multiverse.</span></h1>
            <p className="hero-tagline">One cinematic universe. Your own way through it.</p>
            <p className="hero-description">The complete Marvel timeline, from the first shield to the next horizon. Pick up where you left off and make every rewatch your own.</p>
            <a className="hero-cta" href="#timeline"><span>EXPLORE THE TIMELINE</span><ArrowDownRight size={16} aria-hidden="true" /></a>
          </div>

          <div className="hero-visual">
            <span className="orbit-ring orbit-ring--outer" aria-hidden="true" />
            <span className="orbit-ring orbit-ring--inner" aria-hidden="true" />
            <span className="orbit-core" aria-hidden="true"><Star size={21} fill="currentColor" /></span>
            <div className="progress-board">
              <div className="progress-board__top"><span>YOUR SCREENING LOG</span><span>616</span></div>
              <div className="progress-board__number">{progress}<span>%</span></div>
              <p className="progress-board__caption">of the complete timeline watched</p>
              <div className="progress-track" role="progressbar" aria-label="MCU timeline progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                <span style={{ width: `${progress}%` }} />
              </div>
              <div className="progress-board__foot"><span>{progressReady ? watchedCount : 0} TITLES WATCHED</span><span>{items.length} IN THE ARCHIVE</span></div>
            </div>
            <p className="hero-visual-note">CHAPTER {String(watchedCount + 1).padStart(2, '0')} <span aria-hidden="true">/</span> THE STORY CONTINUES</p>
          </div>
        </section>

        <section className="catalog-section" id="timeline" aria-labelledby="catalog-title">
          <div className="catalog-heading-row">
            <div>
              <p className="section-eyebrow">THE COMPLETE MCU <span aria-hidden="true">/</span> {String(items.length).padStart(2, '0')} CHAPTERS</p>
              <h2 className="catalog-title" id="catalog-title">The story, <em>in your order.</em></h2>
            </div>
            <p className="catalog-description">Track your watch-through, follow Marvel&apos;s official chronology, or reshuffle the universe by release date.</p>
          </div>

          <div className="catalog-toolbar">
            <div className="toolbar-primary">
              <div className="toolbar-group">
                <span className="toolbar-label">SORT BY</span>
                <ToggleGroup
                  className="segmented-control"
                  aria-label="Sort titles by"
                  value={[orderMode]}
                  onValueChange={updateOrder}
                >
                  <Toggle value="timeline" variant="outline" size="sm">MCU timeline</Toggle>
                  <Toggle value="release" variant="outline" size="sm">Release date</Toggle>
                </ToggleGroup>
              </div>
              <div className="search-box">
                <Search size={16} aria-hidden="true" />
                <label className="sr-only" htmlFor="timeline-search">Search titles</label>
                <input
                  id="timeline-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search the timeline"
                  autoComplete="off"
                />
                {searchTerm && <button type="button" className="clear-search" aria-label="Clear search" onClick={() => setSearchTerm('')}><X size={14} aria-hidden="true" /></button>}
              </div>
            </div>

            <div className="toolbar-secondary">
              <ToggleGroup
                className="segmented-control filter-control"
                aria-label="Filter titles"
                value={[filterMode]}
                onValueChange={updateFilter}
              >
                <Toggle value="all" variant="outline" size="sm">All</Toggle>
                <Toggle value="unwatched" variant="outline" size="sm">To watch</Toggle>
                <Toggle value="watched" variant="outline" size="sm">Watched</Toggle>
              </ToggleGroup>
              <AlertDialog.Root open={resetOpen} onOpenChange={setResetOpen}>
                <AlertDialog.Trigger className="reset-trigger" type="button">
                  <RotateCcw size={14} aria-hidden="true" /> Reset all
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Backdrop className="reset-backdrop" />
                  <AlertDialog.Popup className="reset-popup">
                    <div className="reset-icon"><RotateCcw size={18} aria-hidden="true" /></div>
                    <AlertDialog.Title className="reset-title">Reset your progress?</AlertDialog.Title>
                    <AlertDialog.Description className="reset-description">
                      This clears every watched mark saved on this device. Your timeline settings will stay as they are.
                    </AlertDialog.Description>
                    <div className="reset-actions">
                      <AlertDialog.Close className="reset-cancel" type="button">Keep progress</AlertDialog.Close>
                      <AlertDialog.Close className="reset-confirm" type="button" onClick={resetProgress}>Reset all</AlertDialog.Close>
                    </div>
                  </AlertDialog.Popup>
                </AlertDialog.Portal>
              </AlertDialog.Root>
            </div>
          </div>

          {catalog?.configured === false && !catalogLoading && (
            <div className="tmdb-notice" role="status">
              <span className="notice-orbit" aria-hidden="true"><Sparkles size={15} /></span>
              <p><strong>Connect your TMDB key to reveal the artwork.</strong> Add <code>NEXT_PUBLIC_TMDB_API_KEY</code> in project Vars to load official posters, ratings, and details. Your watchlist works without it.</p>
            </div>
          )}
          {catalog?.error === 'TMDB_UNAVAILABLE' && (
            <div className="tmdb-notice" role="status"><span className="notice-orbit" aria-hidden="true"><Sparkles size={15} /></span><p><strong>TMDB is taking a breather.</strong> The timeline is still here; try again later for refreshed artwork and metadata.</p></div>
          )}
          {catalogError && (
            <div className="tmdb-notice" role="status"><span className="notice-orbit" aria-hidden="true"><Sparkles size={15} /></span><p><strong>The catalog could not connect.</strong> Your saved progress is available, but TMDB artwork and metadata could not be refreshed.</p></div>
          )}

          <div className="catalog-results" role="status" aria-live="polite">
            <span>{searchTerm || filterMode !== 'all' ? `Showing ${visibleItems.length} of ${items.length}` : `${items.length} titles`}</span>
            <span className="catalog-results__divider" aria-hidden="true" />
            <span>{watchedCount} watched <span aria-hidden="true">·</span> {items.length - watchedCount} left</span>
            {catalogLoading && <span className="catalog-sync"><span className="sync-dot" /> Loading TMDB artwork</span>}
          </div>

          {visibleItems.length > 0 ? (
            <div className="poster-grid">
              <AnimatePresence initial={false} mode="popLayout">
                {visibleItems.map((item, index) => (
                  <motion.div
                    className="poster-grid__item"
                    key={item.id}
                    layout
                    initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 9 }}
                    transition={{
                      opacity: { duration: shouldReduceMotion ? 0 : 0.3, delay: shouldReduceMotion ? 0 : (index % 5) * 0.035 },
                      y: { duration: shouldReduceMotion ? 0 : 0.36, delay: shouldReduceMotion ? 0 : (index % 5) * 0.035 },
                      layout: { type: 'spring', stiffness: 330, damping: 34 },
                    }}
                  >
                    <MCUPosterCard
                      item={item}
                      watched={watchedSet.has(item.id)}
                      catalogLoading={catalogLoading}
                      onOpen={() => setActiveItemId(item.id)}
                      onToggleWatched={() => toggleWatched(item.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-state__icon"><Search size={20} aria-hidden="true" /></span>
              <h3>No titles found</h3>
              <p>Try another title or switch your filter to see more of the timeline.</p>
              <button type="button" className="empty-state__reset" onClick={() => { setSearchTerm(''); setFilterMode('all') }}>Clear filters <ArrowUpRight size={14} aria-hidden="true" /></button>
            </div>
          )}
        </section>

        <footer className="site-footer">
          <div className="footer-credit">
            <p>Made by <a href="https://github.com/tiagocmendes" target="_blank" rel="noreferrer">tiagocmendes</a></p>
            <p className="footer-source">Timeline order follows <a href="https://www.marvel.com/articles/movies/mcu-timeline-order-disney-plus" target="_blank" rel="noreferrer">Marvel&apos;s Complete MCU Timeline</a>.</p>
          </div>
          <div className="footer-right">
            <nav className="footer-socials" aria-label="Creator social links">
<a href="https://github.com/tiagocmendes" target="_blank" rel="noreferrer" aria-label="GitHub profile for tiagocmendes"><span className="social-icon"><Image src="https://thesvg.org/icons/github/default.svg" alt="" width={16} height={16} /></span><span>GitHub</span></a>
<a href="https://www.linkedin.com/in/tiagocmendes" target="_blank" rel="noreferrer" aria-label="LinkedIn profile for tiagocmendes"><span className="social-icon"><Image src="https://thesvg.org/icons/linkedin/default.svg" alt="" width={16} height={16} /></span><span>LinkedIn</span></a>
            </nav>
            <p className="tmdb-credit">This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
          </div>
        </footer>
      </div>

      <AnimatePresence>
        {activeItem && (
          <MCUDetailsModal
            item={activeItem}
            watched={watchedSet.has(activeItem.id)}
            total={items.length}
            onClose={closeDetails}
            onPrevious={() => navigateDetails(-1)}
            onNext={() => navigateDetails(1)}
            onToggleWatched={() => toggleWatched(activeItem.id)}
          />
        )}
      </AnimatePresence>
    </main>
  )
}
