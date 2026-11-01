'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Film, Star, Tv, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, type KeyboardEvent } from 'react'
import useSWR from 'swr'
import type { MCUDetails, MCUItem } from '@/lib/mcu-timeline'
import { TMDB_IMAGE_ROOT } from '@/lib/tmdb-images'

type MCUDetailsModalProps = {
  item: MCUItem
  watched: boolean
  total: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  onToggleWatched: () => void
}

async function fetchDetails(url: string): Promise<MCUDetails> {
  const response = await fetch(url)
  if (!response.ok) throw new Error('TMDB details could not be loaded.')
  return response.json() as Promise<MCUDetails>
}

function imageUrl(path: string, size: string) {
  return `${TMDB_IMAGE_ROOT}/${size}${path.startsWith('/') ? path : `/${path}`}`
}

function formatDate(value: string | null, fallbackYear: number) {
  if (!value) return String(fallbackYear)
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) return String(fallbackYear)
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function formatRuntime(minutes: number | null, kind: MCUDetails['runtimeKind']) {
  if (!minutes) return 'Not listed'
  if (kind === 'episode') return `About ${minutes} min / episode`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return hours ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`
}

function DetailSkeleton() {
  return (
    <div className="details-loading" role="status" aria-label="Loading TMDB details">
      <span className="skeleton-line skeleton-line--wide" />
      <span className="skeleton-line" />
      <span className="skeleton-line skeleton-line--short" />
      <div className="skeleton-pills"><span /><span /><span /></div>
      <span className="sr-only">Loading cast, ratings, and film details.</span>
    </div>
  )
}

export function MCUDetailsModal({
  item,
  watched,
  total,
  onClose,
  onPrevious,
  onNext,
  onToggleWatched,
}: MCUDetailsModalProps) {
  const shouldReduceMotion = useReducedMotion() ?? false
  const dialogRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const detailKey = item.tmdbId
    ? `/api/tmdb/${item.mediaType}/${item.tmdbId}${item.season ? `?season=${item.season}` : ''}`
    : null
  const { data, error, isLoading } = useSWR<MCUDetails>(detailKey, fetchDetails, {
    dedupingInterval: 86_400_000,
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [])

  function handleDialogKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key !== 'Tab') return
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      'a[href]:not([aria-disabled="true"]), button:not(:disabled), [tabindex]:not([tabindex="-1"])',
    )
    if (!focusable?.length) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const backdropPath = item.backdropPath ?? data?.backdropPath
  const posterPath = item.posterPath ?? data?.posterPath
  const isTV = item.mediaType === 'tv'

  return (
    <motion.div
      className="modal-overlay"
      role="presentation"
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.22 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <motion.section
        ref={dialogRef}
        className="details-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mcu-detail-title"
        tabIndex={-1}
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.26, ease: [0.22, 1, 0.36, 1] }}
        onKeyDown={handleDialogKeyDown}
      >
        <div className="details-topbar">
          <p className="modal-position-label">
            MCU TIMELINE <span aria-hidden="true">/</span> {String(item.timelinePosition).padStart(2, '0')} OF {String(total).padStart(2, '0')}
          </p>
          <div className="modal-controls">
            <button className="modal-arrow" type="button" onClick={onPrevious} aria-label="Previous title">
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button className="modal-arrow" type="button" onClick={onNext} aria-label="Next title">
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            <button ref={closeButtonRef} className="modal-close" type="button" onClick={onClose} aria-label="Close details">
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={item.id}
            className="details-scroll-content"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
          >
            <div className="details-hero">
              {backdropPath && (
                <Image
                  src={imageUrl(backdropPath, 'w1280')}
                  alt=""
                  fill
                  sizes="(max-width: 720px) 100vw, 1000px"
                  loading="lazy"
                  className="details-backdrop-image"
                />
              )}
              <div className="details-hero-grid">
                <div className="details-poster-wrap">
                  {posterPath ? (
                    <Image
                      src={imageUrl(posterPath, 'w500')}
                      alt={`Poster for ${item.title}`}
                      width={500}
                      height={750}
                      sizes="(max-width: 720px) 34vw, 220px"
                      loading="lazy"
                      className="details-poster-image"
                    />
                  ) : (
                    <div className="details-poster-fallback" aria-hidden="true"><Film size={34} /><span>TMDB ARTWORK UNAVAILABLE</span></div>
                  )}
                </div>
                <div className="details-heading">
                  <p className="details-kicker">
                    {isTV ? <Tv size={13} aria-hidden="true" /> : <Film size={13} aria-hidden="true" />}
                    {item.season ? `SEASON ${item.season}` : isTV ? 'SERIES' : 'FEATURE FILM'}
                    <span aria-hidden="true">·</span>
                    CHRONOLOGICAL POSITION #{item.timelinePosition}
                  </p>
                  <h2 id="mcu-detail-title">{item.title}</h2>
                  {data?.tmdbTitle && data.tmdbTitle !== item.title && (
                    <p className="details-tmdb-title">TMDB listing: {data.tmdbTitle}</p>
                  )}
                  {data?.tagline && <p className="details-tagline">“{data.tagline}”</p>}
                  {isLoading ? <DetailSkeleton /> : (
                    <p className="details-overview">
                      {data?.overview || item.overview || (error ? 'TMDB details could not be loaded right now.' : 'No overview is available for this title yet.')}
                    </p>
                  )}
                  <div className="details-actions">
                    {data?.trailerUrl ? (
                      <a className="trailer-link" href={data.trailerUrl} target="_blank" rel="noreferrer">
                        <span className="trailer-play" aria-hidden="true">▶</span> Watch trailer <ArrowUpRight size={15} aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="trailer-link is-unavailable" aria-disabled="true"><span className="trailer-play" aria-hidden="true">▶</span> Trailer unavailable</span>
                    )}
                    <button className={`modal-watch-button${watched ? ' is-watched' : ''}`} type="button" aria-pressed={watched} onClick={onToggleWatched}>
                      <span aria-hidden="true">{watched ? <Check size={15} /> : <span className="watch-empty-mark" />}</span>
                      Mark {watched ? 'unwatched' : 'watched'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="details-body">
              <div className="details-main-column">
                <div className="details-stat-grid">
                  <div className="detail-stat">
                    <span className="detail-stat-label">Release date</span>
                    <strong>{formatDate(data?.releaseDate ?? item.releaseDate, item.releaseYear)}</strong>
                  </div>
                  <div className="detail-stat">
                    <span className="detail-stat-label">{isTV ? 'Episode runtime' : 'Runtime'}</span>
                    <strong>{data ? formatRuntime(data.runtime, data.runtimeKind) : '—'}</strong>
                  </div>
                  <div className="detail-stat">
                    <span className="detail-stat-label">TMDB rating</span>
                    <strong className="detail-rating">{typeof data?.rating === 'number' ? <><Star size={14} fill="currentColor" aria-hidden="true" /> {data.rating.toFixed(1)}<span>/10</span></> : '—'}</strong>
                  </div>
                  <div className="detail-stat">
                    <span className="detail-stat-label">{data?.directorLabel ?? (isTV ? 'Created by' : 'Director')}</span>
                    <strong>{data?.director ?? '—'}</strong>
                  </div>
                </div>

                <section className="cast-section" aria-labelledby="cast-heading">
                  <div className="cast-heading-row">
                    <div>
                      <p className="section-eyebrow">ON SCREEN</p>
                      <h3 id="cast-heading">Top cast</h3>
                    </div>
                    <span className="cast-count">{data?.cast.length ?? 0} PEOPLE</span>
                  </div>
                  {isLoading ? (
                    <div className="cast-skeleton" aria-hidden="true"><span /><span /><span /><span /><span /></div>
                  ) : data?.cast.length ? (
                    <ul className="cast-list">
                      {data.cast.map((name, index) => (
                        <li className="cast-person" key={`${item.id}-${name}`}>
                          <span className="cast-number">0{index + 1}</span>
                          <span>{name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="cast-unavailable">Cast information is not available for this title.</p>
                  )}
                </section>
              </div>

              <aside className="details-side-column" aria-label="Title metadata">
                <div className="genre-heading"><span className="section-eyebrow">GENRES</span><span className="genre-spark" aria-hidden="true">✦</span></div>
                {isLoading ? (
                  <div className="genre-skeleton" aria-hidden="true"><span /><span /><span /></div>
                ) : data?.genres.length ? (
                  <div className="genre-list">{data.genres.map((genre) => <span className="genre-chip" key={genre}>{genre}</span>)}</div>
                ) : (
                  <p className="genre-unavailable">No genres listed.</p>
                )}
                <div className="timeline-note">
                  <span className="timeline-note-mark" aria-hidden="true">{String(item.timelinePosition).padStart(2, '0')}</span>
                  <p>This chapter sits at <strong>#{item.timelinePosition}</strong> in the official Marvel Complete Timeline.</p>
                </div>
              </aside>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.section>
    </motion.div>
  )
}
