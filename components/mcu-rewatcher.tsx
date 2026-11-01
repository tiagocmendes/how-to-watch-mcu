'use client'

import { AlertDialog } from '@base-ui/react/alert-dialog'
import { ToggleGroup } from '@base-ui/react/toggle-group'
import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw, Search, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Toggle } from '@/components/ui/toggle'
import { MCUDetailsModal } from '@/components/mcu-details-modal'
import { MCUPosterCard } from '@/components/mcu-poster-card'
import { MCU_TIMELINE, type MCUItem } from '@/lib/mcu-timeline'

const WATCHED_STORAGE_KEY = 'multiverse-rewatch:watched:v1'

function readWatchedIds() {
  if (typeof window === 'undefined') return [] as string[]
  try {
    const savedProgress = window.localStorage.getItem(WATCHED_STORAGE_KEY)
    if (!savedProgress) return [] as string[]
    const parsedProgress: unknown = JSON.parse(savedProgress)
    if (!Array.isArray(parsedProgress)) return []
    return parsedProgress.filter((id): id is string => typeof id === 'string')
  } catch {
    return [] as string[]
  }
}

function writeWatchedIds(nextIds: string[]) {
  try {
    window.localStorage.setItem(WATCHED_STORAGE_KEY, JSON.stringify(nextIds))
  } catch {
    // Keep this interaction usable when browser storage is unavailable.
  }
}

type OrderMode = 'timeline' | 'release'
type FilterMode = 'all' | 'unwatched' | 'watched'
type KindFilter = 'all' | 'movies'
type PhaseFilter = 'all' | '1' | '2' | '3' | '4' | '5' | '6'

function releaseTimestamp(item: MCUItem) {
  if (item.releaseDate) {
    const parsedDate = Date.parse(`${item.releaseDate.slice(0, 10)}T00:00:00Z`)
    if (Number.isFinite(parsedDate)) return parsedDate
  }

  return Date.UTC(item.releaseYear, 0, 1) + item.timelinePosition
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLocaleLowerCase('en-US')
}

function itemMatchesSearch(item: MCUItem, query: string) {
  if (!query) return true

  const fields = [
    item.title,
    item.listedTitle,
    item.overview,
    item.tagline,
    item.director,
    ...item.cast,
  ]

  return fields.some((field) => field && normalizeSearch(field).includes(query))
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 10.02.5.09.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.84c.85 0 1.71.11 2.51.34 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48A10.02 10.02 0 0 0 22 12c0-5.52-4.48-10-10-10z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 0 1 2.063-2.065 2.064 2.064 0 0 1 2.063 2.065c0 1.14-.923 2.065-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

export function MCURewatcher() {
  const items = MCU_TIMELINE
  const [watchedIds, setWatchedIds] = useState<string[]>([])
  const [orderMode, setOrderMode] = useState<OrderMode>('timeline')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [resetOpen, setResetOpen] = useState(false)

  const watchedSet = useMemo(() => new Set(watchedIds), [watchedIds])
  const scopedItems = useMemo(
    () => (kindFilter === 'movies' ? items.filter((item) => item.mediaType === 'movie') : items),
    [items, kindFilter],
  )
  const watchedCount = scopedItems.reduce((count, item) => count + Number(watchedSet.has(item.id)), 0)
  const progress = scopedItems.length ? Math.round((watchedCount / scopedItems.length) * 100) : 0

  const visibleItems = useMemo(() => {
    const normalizedSearch = normalizeSearch(searchTerm.trim())
    const sorted = [...scopedItems].sort((left, right) => {
      if (orderMode === 'timeline') return left.timelinePosition - right.timelinePosition
      return releaseTimestamp(left) - releaseTimestamp(right) || left.timelinePosition - right.timelinePosition
    })

    return sorted.filter((item) => {
      const isWatched = watchedSet.has(item.id)
      const matchesFilter = filterMode === 'all'
        || (filterMode === 'watched' && isWatched)
        || (filterMode === 'unwatched' && !isWatched)
      const matchesPhase = phaseFilter === 'all' || String(item.phase) === phaseFilter

      return itemMatchesSearch(item, normalizedSearch) && matchesFilter && matchesPhase
    })
  }, [filterMode, orderMode, phaseFilter, scopedItems, searchTerm, watchedSet])

  useEffect(() => {
    setWatchedIds(readWatchedIds())
  }, [])

  const toggleWatched = useCallback((id: string) => {
    setWatchedIds((currentIds) => {
      const nextIds = currentIds.includes(id)
        ? currentIds.filter((watchedId) => watchedId !== id)
        : [...currentIds, id]
      writeWatchedIds(nextIds)
      return nextIds
    })
  }, [])

  const resetProgress = useCallback(() => {
    writeWatchedIds([])
    setWatchedIds([])
  }, [])

  const closeDetails = useCallback(() => setActiveItemId(null), [])
  const activeItem = items.find((item) => item.id === activeItemId) ?? null

  const navigateDetails = useCallback((direction: -1 | 1) => {
    if (!activeItem || visibleItems.length < 2) return
    const currentIndex = visibleItems.findIndex((item) => item.id === activeItem.id)
    if (currentIndex < 0) return
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

  const updateKind = (value: string[]) => {
    if (value[0] === 'all' || value[0] === 'movies') setKindFilter(value[0])
  }

  const updatePhase = (value: string[]) => {
    if (value[0] === 'all' || /^[1-6]$/.test(value[0])) setPhaseFilter(value[0] as PhaseFilter)
  }

  return (
    <main className="app-shell" id="top">
      <div className="page-wrap">
        <header className="site-header">
          <a className="wordmark" href="#top">EARTH-616</a>
          <p className="header-note">MCU TIMELINE · WATCH OR REWATCH</p>
          <a className="header-link" href="#timeline">Jump to issues</a>
        </header>

        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">THE COMPLETE MULTIVERSE RUN</p>
            <h1 className="hero-title" id="hero-title">Watch the MCU in story order.</h1>
            <p className="hero-description">
              First time through or another lap around the timeline. {scopedItems.length} titles across Phases 1–6 — or switch to movies only.
            </p>
            <a className="hero-cta" href="#timeline">Open the timeline</a>
          </div>

          <div className="progress-board" aria-label="Watch progress">
            <p className="progress-board__kicker">YOUR RUN</p>
            <p className="progress-board__number">{progress}<span>%</span></p>
            <div className="progress-track" role="progressbar" aria-label="MCU timeline progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <p className="progress-board__foot">
              {watchedCount} watched · {items.length - watchedCount} left
            </p>
          </div>
        </section>

        <section className="catalog-section" id="timeline" aria-labelledby="catalog-title">
          <div className="catalog-heading-row">
            <h2 className="catalog-title" id="catalog-title">Issue file</h2>
            <p className="catalog-description">Mark titles as you go. Progress stays on this device.</p>
          </div>

          <div className="catalog-toolbar">
            <div className="toolbar-primary">
              <div className="toolbar-group">
                <span className="toolbar-label">ORDER</span>
                <ToggleGroup
                  className="segmented-control"
                  aria-label="Sort titles by"
                  value={[orderMode]}
                  onValueChange={updateOrder}
                >
                  <Toggle value="timeline" variant="outline" size="sm">Timeline</Toggle>
                  <Toggle value="release" variant="outline" size="sm">Release</Toggle>
                </ToggleGroup>
              </div>
              <form
                className="search-box"
                role="search"
                onSubmit={(event) => event.preventDefault()}
              >
                <Search size={16} aria-hidden="true" />
                <label className="sr-only" htmlFor="timeline-search">Search titles, cast, and descriptions</label>
                <input
                  id="timeline-search"
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search titles, cast, plot"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                />
                {searchTerm && <button type="button" className="clear-search" aria-label="Clear search" onClick={() => setSearchTerm('')}><X size={14} aria-hidden="true" /></button>}
              </form>
            </div>

            <div className="toolbar-secondary">
              <ToggleGroup
                className="segmented-control"
                aria-label="Show movies or all titles"
                value={[kindFilter]}
                onValueChange={updateKind}
              >
                <Toggle value="all" variant="outline" size="sm">All titles</Toggle>
                <Toggle value="movies" variant="outline" size="sm">Movies only</Toggle>
              </ToggleGroup>
              <ToggleGroup
                className="segmented-control phase-control"
                aria-label="Filter by MCU phase"
                value={[phaseFilter]}
                onValueChange={updatePhase}
              >
                <Toggle value="all" variant="outline" size="sm">All phases</Toggle>
                <Toggle value="1" variant="outline" size="sm">P1</Toggle>
                <Toggle value="2" variant="outline" size="sm">P2</Toggle>
                <Toggle value="3" variant="outline" size="sm">P3</Toggle>
                <Toggle value="4" variant="outline" size="sm">P4</Toggle>
                <Toggle value="5" variant="outline" size="sm">P5</Toggle>
                <Toggle value="6" variant="outline" size="sm">P6</Toggle>
              </ToggleGroup>
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
                  <RotateCcw size={14} aria-hidden="true" /> Reset
                </AlertDialog.Trigger>
                <AlertDialog.Portal>
                  <AlertDialog.Backdrop className="reset-backdrop" />
                  <AlertDialog.Popup className="reset-popup">
                    <AlertDialog.Title className="reset-title">Reset your progress?</AlertDialog.Title>
                    <AlertDialog.Description className="reset-description">
                      This clears every watched mark saved on this device.
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

          <div className="catalog-results" role="status" aria-live="polite">
            <span>{searchTerm || filterMode !== 'all' || kindFilter !== 'all' || phaseFilter !== 'all' ? `Showing ${visibleItems.length} of ${scopedItems.length}` : `${scopedItems.length} titles`}</span>
          </div>

          {visibleItems.length > 0 ? (
            <div className="poster-grid">
              <AnimatePresence initial={false} mode="popLayout">
                {visibleItems.map((item) => (
                  <motion.div
                    className="poster-grid__item"
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <MCUPosterCard
                      item={item}
                      watched={watchedSet.has(item.id)}
                      onOpen={() => setActiveItemId(item.id)}
                      onToggleWatched={() => toggleWatched(item.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="empty-state">
              <h3>No titles found</h3>
              <p>Try another title or switch your filter.</p>
              <button type="button" className="empty-state__reset" onClick={() => { setSearchTerm(''); setFilterMode('all') }}>Clear filters</button>
            </div>
          )}
        </section>
      </div>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-left-col">
            <p className="footer-byline">
              <a className="footer-social" href="https://github.com/tiagocmendes" target="_blank" rel="noreferrer" aria-label="GitHub profile for tiagocmendes">
                  <GitHubIcon />
                </a>
                <a className="footer-social" href="https://www.linkedin.com/in/tiagocmendes" target="_blank" rel="noreferrer" aria-label="LinkedIn profile for tiagocmendes">
                  <LinkedInIcon />
                </a>
            </p>
            
            <p className="footer-byline">
              Made by<a href="https://github.com/tiagocmendes" target="_blank" rel="noreferrer">tiagocmendes</a>
            </p>
          </div>
         
          <div className="footer-right-col">
            <p className="footer-source">Order follows <a href="https://www.marvel.com/articles/movies/mcu-timeline-order-disney-plus" target="_blank" rel="noreferrer">Marvel&apos;s Complete MCU Timeline</a>.</p>
            <p className="footer-credit-note">Movie info and images were retrieved from TMDB&apos;s free API.</p>
          </div>
        </div>
      </footer>

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
