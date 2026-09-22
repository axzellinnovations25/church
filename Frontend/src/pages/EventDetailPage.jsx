import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHero from '../components/PageHero'
import { getBackendUrl } from '../lib/auth'
import './EventDetailPage.css'

function formatEventDate(dateString) {
  if (!dateString) {
    return 'Date to be confirmed'
  }

  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatEventTime(timeString) {
  if (!timeString) {
    return ''
  }

  const [hours, minutes] = timeString.split(':')
  const date = new Date()
  date.setHours(Number(hours), Number(minutes))

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function buildSchedule(event) {
  const startDate = formatEventDate(event.start_date)
  const startTime = formatEventTime(event.start_time)
  const endDate = event.end_date ? formatEventDate(event.end_date) : ''
  const endTime = event.end_time ? formatEventTime(event.end_time) : ''

  if (endDate && event.end_date !== event.start_date) {
    return `${startDate}${startTime ? ` at ${startTime}` : ''} to ${endDate}${endTime ? ` at ${endTime}` : ''}`
  }

  if (startTime && endTime) {
    return `${startDate} from ${startTime} to ${endTime}`
  }

  if (startTime) {
    return `${startDate} at ${startTime}`
  }

  return startDate
}

export default function EventDetailPage() {
  const { eventId } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadEvent() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(getBackendUrl(`/api/v1/events/${eventId}`))
        const payload = await response.json()

        if (ignore) {
          return
        }

        if (!response.ok || !payload?.data) {
          setEvent(null)
          setError(payload?.message || 'We could not find that event.')
          return
        }

        setEvent(payload.data)
      } catch {
        if (!ignore) {
          setEvent(null)
          setError('The event details could not be loaded right now.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadEvent()

    return () => {
      ignore = true
    }
  }, [eventId])

  return (
    <div className="event-detail-page">
      <PageHero
        title={event?.title || 'Event Details'}
        subtitle={event ? 'Find the full schedule, location, and details for this parish event.' : 'Loading the selected parish event.'}
        centered={true}
      />

      <section className="section event-detail-section">
        <div className="container">
          {loading ? (
            <div className="event-detail-card event-detail-state">
              <p className="event-detail-eyebrow">Loading</p>
              <h2 className="event-detail-heading">Fetching event information</h2>
              <p className="event-detail-copy">Please wait while we load the latest published event details.</p>
            </div>
          ) : null}

          {!loading && error ? (
            <div className="event-detail-card event-detail-state">
              <p className="event-detail-eyebrow">Unavailable</p>
              <h2 className="event-detail-heading">This event could not be opened</h2>
              <p className="event-detail-copy">{error}</p>
              <div className="event-detail-actions">
                <Link to="/news-events" className="btn-primary">Back to News & Events</Link>
                <Link to="/events" className="btn-outline">View Calendar</Link>
              </div>
            </div>
          ) : null}

          {!loading && event ? (
            <div className="event-detail-layout">
              <article className="event-detail-card event-detail-main">
                {event.image_url ? (
                  <img
                    className="event-detail-poster"
                    src={getBackendUrl(event.image_url)}
                    alt={event.title}
                  />
                ) : null}
                <div className="event-detail-meta">
                  <span className="event-detail-badge">{event.category || 'Parish Event'}</span>
                  <span className="event-detail-meta-item">{formatEventDate(event.start_date)}</span>
                </div>

                <h2 className="event-detail-title">{event.title}</h2>
                <p className="event-detail-description">
                  {event.description || 'More information about this event will be shared soon. Please contact the parish office if you need anything in the meantime.'}
                </p>

                <div className="event-detail-actions">
                  <Link to="/news-events" className="btn-primary">Back to News & Events</Link>
                  <Link to="/contact" className="btn-outline">Contact the Parish Office</Link>
                </div>
              </article>

              <aside className="event-detail-card event-detail-sidebar">
                <h3 className="event-detail-side-title">Event Information</h3>

                <div className="event-detail-info-list">
                  <div className="event-detail-info-item">
                    <span className="event-detail-label">When</span>
                    <span className="event-detail-value">{buildSchedule(event)}</span>
                  </div>

                  <div className="event-detail-info-item">
                    <span className="event-detail-label">Location</span>
                    <span className="event-detail-value">{event.location || "St Mary's Cathedral"}</span>
                  </div>

                  <div className="event-detail-info-item">
                    <span className="event-detail-label">Category</span>
                    <span className="event-detail-value">{event.category || 'Parish Event'}</span>
                  </div>
                </div>

                <div className="event-detail-note">
                  <p className="event-detail-note-title">Planning to attend?</p>
                  <p className="event-detail-note-copy">
                    Please arrive a little early for liturgical events and contact the parish office if you need accessibility or schedule guidance.
                  </p>
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
