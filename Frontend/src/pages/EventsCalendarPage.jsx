import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { NewsHero, NewsIntro, EventsList, NewsCTA } from '../components/news/NewsEventsSections'
import { getBackendUrl } from '../lib/auth'

function formatEventDateParts(dateString) {
    if (!dateString) {
        return { day: 'TBC', month: '' }
    }

    const date = new Date(`${dateString}T00:00:00`)

    return {
        day: date.toLocaleDateString('en-GB', { day: '2-digit' }),
        month: date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase(),
    }
}

function formatTimeLabel(startTime, endTime) {
    const formatTime = timeString => {
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

    return from || to || 'Time TBC'
}

function toCalendarEvent(event) {
    const { day, month } = formatEventDateParts(event.start_date)

    return {
        ...event,
        day,
        month,
        time: formatTimeLabel(event.start_time, event.end_time),
        location: event.location || event.group_name || "St Mary's Cathedral",
        description: event.description || 'More details will be shared soon.',
    }
}

function isUpcoming(event) {
    if (!event.start_date) {
        return true
    }

    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const eventDate = new Date(`${event.start_date}T00:00:00`)

    return eventDate >= startOfToday
}

function compareEventDateDesc(left, right) {
    return String(right.start_date || '').localeCompare(String(left.start_date || ''))
}

export default function EventsCalendarPage() {
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
                    throw new Error(payload?.message || 'The event calendar could not be loaded.')
                }

                setEvents(payload.data)
            } catch (error) {
                if (!ignore) {
                    setErrorMessage(error.message || 'The event calendar could not be loaded.')
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

    const upcomingEvents = useMemo(() => events.filter(isUpcoming).map(toCalendarEvent), [events])
    const pastEvents = useMemo(() => events.filter(event => !isUpcoming(event)).sort(compareEventDateDesc).map(toCalendarEvent), [events])
    const featuredEvent = upcomingEvents[0] || null

    return (
        <div className="news-events-page">
            <NewsHero
                title="Events Calendar"
                subtitle="Stay updated with upcoming services, events, and community activities at St Mary's Cathedral."
                image="https://images.unsplash.com/photo-1510925758641-869d353cecc7?q=80&w=1600"
                breadcrumb="Events Calendar"
            />

            <NewsIntro
                title="Join Our Community"
                text="Below is a list of upcoming liturgical and social events. We welcome everyone to participate and grow together in faith and friendship. Please note that some events may require registration."
            />

            {featuredEvent ? (
                <section className="section" style={{ background: '#fcfaf6' }}>
                    <div className="container" style={{ textAlign: 'center' }}>
                        <div style={{ background: 'var(--white)', padding: '30px', borderRadius: '16px', display: 'inline-block', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
                            <h3 className="text-navy" style={{ marginBottom: '10px', fontSize: '1.2rem' }}>Featured Event</h3>
                            <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1.5rem', marginBottom: '8px' }}>{featuredEvent.title}</div>
                            <p className="text-mid" style={{ marginBottom: '0' }}>{featuredEvent.day} {featuredEvent.month} | {featuredEvent.time}</p>
                        </div>
                    </div>
                </section>
            ) : null}

            {isLoading ? (
                <section className="events-list-section">
                    <div className="container" style={{ textAlign: 'center' }}>
                        <p className="text-mid">Loading published events...</p>
                    </div>
                </section>
            ) : null}

            {!isLoading && errorMessage ? (
                <section className="events-list-section">
                    <div className="container" style={{ textAlign: 'center' }}>
                        <p className="text-mid">{errorMessage}</p>
                    </div>
                </section>
            ) : null}

            {!isLoading && !errorMessage && upcomingEvents.length ? <EventsList events={upcomingEvents} /> : null}

            {!isLoading && !errorMessage && !upcomingEvents.length ? (
                <section className="events-list-section">
                    <div className="container" style={{ textAlign: 'center' }}>
                        <p className="text-mid">No published upcoming events are available yet.</p>
                    </div>
                </section>
            ) : null}

            {!isLoading && !errorMessage && pastEvents.length ? (
                <>
                    <NewsIntro
                        title="Past Events"
                        text="Published events that have already taken place are kept here for reference."
                    />
                    <EventsList events={pastEvents} />
                </>
            ) : null}

            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                 <p className="text-mid" style={{ marginBottom: '24px' }}>Looking for regular Mass & Confession times?</p>
                 <Link to="/mass-sacraments" className="btn-gold">View Liturgical Schedule</Link>
            </div>

            <NewsCTA
                title="Organizing an Event?"
                description="If you are a member of a parish group or council and would like to list an event on the calendar, please get in touch with our office."
                buttonText="Submit Event Request"
                buttonLink="/contact"
            />
        </div>
    )
}
