'use client'

import Image from 'next/image'
import { Check, Film, Tv } from 'lucide-react'
import { useState } from 'react'
import type { MCUItem } from '@/lib/mcu-timeline'

type MCUPosterCardProps = {
  item: MCUItem
  watched: boolean
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

export function MCUPosterCard({
  item,
  watched,
  onOpen,
  onToggleWatched,
}: MCUPosterCardProps) {
  const [posterFailed, setPosterFailed] = useState(false)

  return (
    <article className={`poster-card${watched ? ' is-watched' : ''}`}>
      <button className="poster-card__open" type="button" onClick={onOpen} aria-label={`Open details for ${item.title}`}>
        <span className="poster-frame">
          {item.posterSrc && !posterFailed ? (
            <Image
              src={item.posterSrc}
              alt=""
              width={500}
              height={750}
              sizes="(max-width: 640px) 46vw, (max-width: 1024px) 30vw, (max-width: 1440px) 20vw, 15vw"
              loading="lazy"
              onError={() => setPosterFailed(true)}
              className="poster-image"
            />
          ) : (
            <span className="poster-fallback" aria-hidden="true">
              <strong>{getInitials(item.title)}</strong>
              <span>ISSUE {String(item.timelinePosition).padStart(2, '0')}</span>
            </span>
          )}
          <span className="poster-shade" aria-hidden="true" />
          <span className="poster-index">#{String(item.timelinePosition).padStart(2, '0')}</span>
          <span className="poster-phase">P{item.phase}</span>
          <span className="poster-type">
            {item.season ? `S${item.season}` : item.mediaType === 'tv' ? <><Tv size={12} aria-hidden="true" /> SERIES</> : <><Film size={12} aria-hidden="true" /> FILM</>}
          </span>
          {watched && <span className="poster-watched-badge">Watched</span>}
        </span>
        <span className="poster-copy">
          <span className="poster-title">{item.title}</span>
          <span className="poster-year">{item.releaseDate?.slice(0, 4) ?? item.releaseYear}</span>
        </span>
      </button>
      <button
        className="watched-toggle"
        type="button"
        aria-pressed={watched}
        onClick={onToggleWatched}
      >
        <span className={`watched-toggle__check${watched ? ' is-checked' : ''}`} aria-hidden="true">
          {watched && <Check size={12} strokeWidth={3} />}
        </span>
        {watched ? 'Watched' : 'Mark watched'}
      </button>
    </article>
  )
}
