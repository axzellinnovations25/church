import { useMemo, useState } from 'react'
import './PhotoGallery.css'

function FallbackImage({ alt }) {
  return (
    <div className="pg-fallback" role="img" aria-label={alt}>
      <div className="pg-fallback-badge">Photo</div>
    </div>
  )
}

export default function PhotoGallery({ images, limit, className = '' }) {
  const [lightboxIdx, setLightboxIdx] = useState(null)
  const list = useMemo(() => (limit ? images.slice(0, limit) : images), [images, limit])

  return (
    <>
      <div className={`pg-grid ${className}`}>
        {list.map((img, idx) => (
          <button
            key={img.src}
            className="pg-card"
            type="button"
            onClick={() => setLightboxIdx(idx)}
            aria-label={`Open photo: ${img.title}`}
          >
            <img
              className="pg-img"
              src={img.src}
              alt={img.title}
              loading="lazy"
              onError={(e) => {
                // Hide broken <img> and render fallback via CSS background.
                e.currentTarget.style.display = 'none'
              }}
            />
            <div className="pg-img-fallback">
              <FallbackImage alt={img.title} />
            </div>
            <div className="pg-meta">
              <div className="pg-title">{img.title}</div>
              <div className="pg-caption">{img.caption}</div>
            </div>
          </button>
        ))}
      </div>

      {lightboxIdx !== null ? (
        <div className="pg-lightbox" role="dialog" aria-modal="true">
          <button
            className="pg-lightbox-backdrop"
            type="button"
            onClick={() => setLightboxIdx(null)}
            aria-label="Close"
          />
          <div className="pg-lightbox-inner">
            <div className="pg-lightbox-header">
              <div className="pg-lightbox-title">{list[lightboxIdx]?.title}</div>
              <button className="pg-close" type="button" onClick={() => setLightboxIdx(null)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="pg-lightbox-body">
              <img
                className="pg-lightbox-img"
                src={list[lightboxIdx]?.src}
                alt={list[lightboxIdx]?.title}
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div className="pg-lightbox-fallback">
                <FallbackImage alt={list[lightboxIdx]?.title || 'Photo'} />
              </div>
              <div className="pg-lightbox-caption">{list[lightboxIdx]?.caption}</div>
            </div>
            <div className="pg-lightbox-footer">
              <button
                type="button"
                className="pg-nav"
                onClick={() => setLightboxIdx((i) => (i === 0 ? list.length - 1 : i - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="pg-nav"
                onClick={() => setLightboxIdx((i) => (i === list.length - 1 ? 0 : i + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

