import { useEffect } from 'react'
import './FeedbackDialog.css'

export default function FeedbackDialog({
  open,
  tone = 'neutral',
  variant = 'alert',
  title,
  message,
  confirmLabel = 'Close',
  cancelLabel = 'Cancel',
  secondaryLabel = '',
  onConfirm,
  onSecondary,
  onClose,
}) {
  useEffect(() => {
    if (!open) {
      return undefined
    }

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
  }, [open, onClose])

  if (!open) {
    return null
  }

  const isConfirm = variant === 'confirm'

  return (
    <div className="feedback-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`feedback-dialog feedback-dialog--${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-dialog-title"
        onClick={event => event.stopPropagation()}
      >
        <div className="feedback-dialog__badge">{tone}</div>
        <h2 id="feedback-dialog-title" className="feedback-dialog__title">{title}</h2>
        <div className="feedback-dialog__message">{message}</div>
        <div className="feedback-dialog__actions">
          {isConfirm ? (
            <>
              <button type="button" className="btn-outline" onClick={onClose}>
                {cancelLabel}
              </button>
              <button type="button" className="btn-primary" onClick={onConfirm}>
                {confirmLabel}
              </button>
            </>
          ) : (
            <>
              {secondaryLabel ? (
                <button type="button" className="btn-outline" onClick={onSecondary || onClose}>
                  {secondaryLabel}
                </button>
              ) : null}
              <button type="button" className="btn-primary" onClick={onClose}>
                {confirmLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
