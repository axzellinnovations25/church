import { useEffect, useRef } from 'react'

export default function AdminModal({ isOpen, onClose, title, subtitle, children }) {
  const modalRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="admin-modal-overlay" role="presentation" onClick={onClose}>
      <article
        className="admin-surface admin-modal-container"
        role="dialog"
        aria-modal="true"
        ref={modalRef}
        onClick={e => e.stopPropagation()}
      >
        <div className="admin-section-head admin-modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="admin-modal-close" onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>
        <div className="admin-modal-body">
          {children}
        </div>
      </article>
    </div>
  )
}
