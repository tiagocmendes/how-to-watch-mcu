'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUpRight, Check, ChevronLeft, ChevronRight, Film, Star, Tv, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, type KeyboardEvent } from 'react'
import type { MCUItem } from '@/lib/mcu-timeline'

type MCUDetailsModalProps = {
  item: MCUItem
  watched: boolean
  total: number
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  onToggleWatched: () => void
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

function formatRuntime(minutes: number | null, kind: MCUItem['runtimeKind']) {
  if (!minutes) return 'Not listed'
  if (kind === 'episode') return `About ${minutes} min / episode`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return hours ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`
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
  const dialogRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onPreviousRef = useRef(onPrevious)
  const onNextRef = useRef(onNext)
  const isTV = item.mediaType === 'tv'
  onPreviousRef.current = onPrevious
  onNextRef.current = onNext

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

  useEffect(() => {
    function onWindowKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()
      event.stopPropagation()
      if (event.key === 'ArrowLeft') onPreviousRef.current()
      else onNextRef.current()
    }

    window.addEventListener('keydown', onWindowKeyDown, true)
    return () => window.removeEventListener('keydown', onWindowKeyDown, true)
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

  return (
    <motion.div
      className="modal-overlay"
      role="presentation"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
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
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.22 }}
        onKeyDown={handleDialogKeyDown}
      >
        <div className="details-topbar">
          <p className="modal-position-label">
            ISSUE {String(item.timelinePosition).padStart(2, '0')} / {String(total).padStart(2, '0')}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
          >
            <div className="details-hero">
              {item.backdropSrc && (
                <Image
                  src={item.backdropSrc}
                  alt=""
                  fill
                  sizes="(max-width: 720px) 100vw, 1000px"
                  loading="lazy"
                  className="details-backdrop-image"
                />
              )}
              <div className="details-hero-grid">
                <div className="details-poster-wrap">
                  {item.posterSrc ? (
                    <Image
                      src={item.posterSrc}
                      alt={`Poster for ${item.title}`}
                      width={500}
                      height={750}
                      sizes="(max-width: 720px) 34vw, 220px"
                      loading="lazy"
                      className="details-poster-image"
                    />
                  ) : (
                    <div className="details-poster-fallback" aria-hidden="true"><Film size={34} /></div>
                  )}
                </div>
                <div className="details-heading">
                  <p className="details-kicker">
                    {isTV ? <Tv size={13} aria-hidden="true" /> : <Film size={13} aria-hidden="true" />}
                    {item.season ? `SEASON ${item.season}` : isTV ? 'SERIES' : 'FEATURE FILM'}
                    <span aria-hidden="true">·</span>
                    PHASE {item.phase}
                  </p>
                  <h2 id="mcu-detail-title">{item.title}</h2>
                  {item.tagline && <p className="details-tagline">{item.tagline}</p>}
                  <p className="details-overview">
                    {item.overview || 'No overview is available for this title yet.'}
                  </p>
                  <div className="details-actions">
                    {item.trailerUrl ? (
                      <a className="trailer-link" href={item.trailerUrl} target="_blank" rel="noreferrer">
                        Watch trailer <ArrowUpRight size={15} aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="trailer-link is-unavailable" aria-disabled="true">Trailer unavailable</span>
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
                    <strong>{formatDate(item.releaseDate, item.releaseYear)}</strong>
                  </div>
                  <div className="detail-stat">
                    <span className="detail-stat-label">{isTV ? 'Episode runtime' : 'Runtime'}</span>
                    <strong>{formatRuntime(item.runtime, item.runtimeKind)}</strong>
                  </div>
                  <div className="detail-stat">
                    <span className="detail-stat-label">Rating</span>
                    <strong className="detail-rating">
                      {typeof item.rating === 'number' && item.rating > 0
                        ? <><Star size={14} fill="currentColor" aria-hidden="true" /> {item.rating.toFixed(1)}<span>/10</span></>
                        : '—'}
                    </strong>
                  </div>
                  <div className="detail-stat">
                    <span className="detail-stat-label">{item.directorLabel ?? (isTV ? 'Created by' : 'Director')}</span>
                    <strong>{item.director ?? '—'}</strong>
                  </div>
                </div>

                <section className="cast-section" aria-labelledby="cast-heading">
                  <h3 id="cast-heading">Top cast</h3>
                  {item.cast.length ? (
                    <ul className="cast-list">
                      {item.cast.map((name) => (
                        <li className="cast-person" key={`${item.id}-${name}`}>{name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="cast-unavailable">Cast information is not available for this title.</p>
                  )}
                </section>
              </div>

              <aside className="details-side-column" aria-label="Title metadata">
                <p className="section-eyebrow">GENRES</p>
                {item.genres.length ? (
                  <div className="genre-list">{item.genres.map((genre) => <span className="genre-chip" key={genre}>{genre}</span>)}</div>
                ) : (
                  <p className="genre-unavailable">No genres listed.</p>
                )}
                <div className="timeline-note">
                  <span className="timeline-note-mark" aria-hidden="true">{String(item.timelinePosition).padStart(2, '0')}</span>
                  <p>Chapter <strong>#{item.timelinePosition}</strong> in Marvel&apos;s complete timeline.</p>
                </div>
              </aside>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.section>
    </motion.div>
  )
}
