import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'
import { getBackendUrl } from '../lib/auth'
import './NewsEventsPage.css'

function formatDateLabel(dateString) {
  if (!dateString) {
    return 'Date TBC'
  }

  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTimeLabel(startTime, endTime) {
  const formatTime = (timeString) => {
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

  const from = formatTime(startTime)
  const to = formatTime(endTime)

  if (from && to) {
    return `${from} - ${to}`
  }

  return from || to || 'Time to be confirmed'
}

export default function NewsEventsPage() {
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadEvents() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await fetch(getBackendUrl('/api/v1/events'))
        const payload = await response.json()

        if (ignore) {
          return
        }

        if (!response.ok || !Array.isArray(payload?.data)) {
          throw new Error(payload?.message || 'Published events could not be loaded.')
        }

        setEvents(payload.data.filter(event => {
          if (!event.start_date) {
            return true
          }

          const today = new Date()
          const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
          const eventDate = new Date(`${event.start_date}T00:00:00`)

          return eventDate >= startOfToday
        }))
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error.message || 'Published events could not be loaded.')
          setEvents([])
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadEvents()

    return () => {
      ignore = true
    }
  }, [])

  return (
    <div className="news-events-page">
      <PageHero
        title="News & Events"
        subtitle="Stay connected with the life of our parish. Discover upcoming events, read the latest news, and never miss what is happening at St Mary's Cathedral."
        centered={true}
      />

      <section className="section" style={{ background: 'var(--off-white)' }}>
        <div className="container">
          <div className="card">
            <h2 className="ne-events-title">Upcoming Events</h2>

            <div className="ne-events-list">
              {isLoading ? (
                <div className="ne-event-row">
                  <span className="ne-event-date">...</span>
                  <div className="ne-event-info">
                    <span className="ne-event-name">Loading published events</span>
                    <span className="ne-event-time">Please wait while the latest events are loaded from the backend.</span>
                  </div>
                </div>
              ) : null}

              {!isLoading && errorMessage ? (
                <div className="ne-event-row">
                  <span className="ne-event-date">!</span>
                  <div className="ne-event-info">
                    <span className="ne-event-name">Events could not be loaded</span>
                    <span className="ne-event-time">{errorMessage}</span>
                  </div>
                </div>
              ) : null}

              {!isLoading && !errorMessage ? events.map((event) => (
                <div key={event.id} className="ne-event-row">
                  {event.image_url ? (
                    <img
                      className="ne-event-thumb"
                      src={getBackendUrl(event.image_url)}
                      alt={event.title}
                    />
                  ) : (
                    <span className="ne-event-thumb ne-event-thumb-placeholder" aria-hidden="true" />
                  )}
                  <span className="ne-event-date">{formatDateLabel(event.start_date)}</span>

                  <div className="ne-event-info">
                    <span className="ne-event-name">{event.title}</span>
                    <span className="ne-event-time">{formatTimeLabel(event.start_time, event.end_time)}</span>
                    <span className="ne-event-time">{event.location || "St Mary's Cathedral"}</span>
                  </div>

                  <Link to={`/events/${event.id}`} className="ne-event-details">Details</Link>
                </div>
              )) : null}

              {!isLoading && !errorMessage && !events.length ? (
                <div className="ne-event-row">
                  <span className="ne-event-date">Soon</span>
                  <div className="ne-event-info">
                    <span className="ne-event-name">Upcoming parish events will appear here</span>
                    <span className="ne-event-time">Published events from the backend will show up automatically.</span>
                  </div>
                </div>
              ) : null}
            </div>

            <div style={{ textAlign: 'center', marginTop: '24px' }}>
              <Link to="/events" className="btn-primary">View Full Calendar</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
