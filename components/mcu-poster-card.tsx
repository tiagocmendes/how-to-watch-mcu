'use client'

import Image from 'next/image'
import { Check, Film, Play, Star, Tv } from 'lucide-react'
import { useState } from 'react'
import type { MCUItem } from '@/lib/mcu-timeline'
import { TMDB_IMAGE_ROOT } from '@/lib/tmdb-images'

type MCUPosterCardProps = {
  item: MCUItem
  watched: boolean
  catalogLoading: boolean
  onOpen: () => void
  onToggleWatched: () => void
}

function getInitials(title: string) {
  return title
    .split(/\s+/)
    .filter((word) => /[A-Za-z0-9]/.test(word))
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function getImageUrl(path: string, size: string) {
  return `${TMDB_IMAGE_ROOT}/${size}${path.startsWith('/') ? path : `/${path}`}`
}

export function MCUPosterCard({
  item,
  watched,
  catalogLoading,
  onOpen,
  onToggleWatched,
}: MCUPosterCardProps) {
  const [failedImagePath, setFailedImagePath] = useState<string | null>(null)
  const posterFailed = failedImagePath === item.posterPath

  return (
    <article className={`poster-card${watched ? ' is-watched' : ''}`}>
      <button className="poster-card__open" type="button" onClick={onOpen} aria-label={`Open details for ${item.title}`}>
        <span className="poster-frame">
          {item.posterPath && !posterFailed ? (
            <Image
              src={getImageUrl(item.posterPath, 'w500')}
              alt=""
              width={500}
              height={750}
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, (max-width: 1440px) 20vw, 15vw"
              loading="lazy"
              onError={() => setFailedImagePath(item.posterPath)}
              className="poster-image"
            />
          ) : catalogLoading ? (
            <span className="poster-skeleton" aria-hidden="true" />
          ) : (
            <span className="poster-fallback" aria-hidden="true">
              <span className="poster-fallback__orbit" />
              <span className="poster-fallback__label">MULTIVERSE ARCHIVE</span>
              <strong>{getInitials(item.title)}</strong>
              <span className="poster-fallback__title">TMDB artwork unavailable</span>
            </span>
          )}
          <span className="poster-shade" aria-hidden="true" />
          <span className="poster-index">{String(item.timelinePosition).padStart(2, '0')}</span>
          <span className="poster-type">
            {item.season ? `S${item.season}` : item.mediaType === 'tv' ? <><Tv size={12} aria-hidden="true" /> Series</> : <><Film size={12} aria-hidden="true" /> Film</>}
          </span>
          {typeof item.rating === 'number' && item.rating > 0 && (
            <span className="poster-rating"><Star size={12} fill="currentColor" aria-hidden="true" />{item.rating.toFixed(1)}</span>
          )}
          {watched && (
            <span className="poster-watched-badge"><Check size={13} strokeWidth={3} aria-hidden="true" /> Watched</span>
          )}
          <span className="poster-open-hint"><Play size={13} fill="currentColor" aria-hidden="true" /> View details</span>
        </span>
        <span className="poster-copy">
          <span className="poster-title">{item.title}</span>
          <span className="poster-year">{item.releaseDate?.slice(0, 4) ?? item.releaseYear} <span aria-hidden="true">·</span> {item.mediaType === 'tv' ? 'Series' : 'Feature film'}</span>
        </span>
      </button>
      <button
        className="watched-toggle"
        type="button"
        aria-pressed={watched}
        onClick={onToggleWatched}
      >
        <span className={`watched-toggle__check${watched ? ' is-checked' : ''}`} aria-hidden="true">{watched && <Check size={12} strokeWidth={3} />}</span>
        {watched ? 'Watched' : 'Mark watched'}
      </button>
    </article>
  )
}
