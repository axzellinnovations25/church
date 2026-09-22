import { useState } from 'react'
import { Link } from 'react-router-dom'
import { hasErrors, validateEmail } from '../../lib/validation'
import { getBackendUrl } from '../../lib/auth'
import './NewsEvents.css'

export const NewsHero = ({ title, subtitle, image, breadcrumb }) => (
    <section className="news-hero" style={{ backgroundImage: `url(${image})` }}>
        <div className="container">
            <div className="news-hero-content">
                <div className="news-hero-label">
                    <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
                    {breadcrumb && (
                        <>
                             / <Link to="/news-events" style={{ color: 'inherit', textDecoration: 'none' }}>News & Events</Link>
                             / <span>{breadcrumb}</span>
                        </>
                    )}
                    {!breadcrumb && <span> / News & Events</span>}
                </div>
                <h1 className="news-hero-title">{title}</h1>
                <p className="news-hero-subtitle">{subtitle}</p>
            </div>
        </div>
    </section>
)

export const NewsIntro = ({ title, text }) => (
    <section className="news-intro">
        <div className="container">
            <div className="news-intro-inner">
                <h2>{title}</h2>
                <p className="news-intro-text">{text}</p>
            </div>
        </div>
    </section>
)

export const FeatureCards = ({ cards }) => (
    <section className="feature-cards-section">
        <div className="container">
            <div className="grid-4">
                {cards.map((card, index) => (
                    <div key={index} className="feature-news-card">
                        <div className="feature-news-icon">{card.icon}</div>
                        <h3>{card.title}</h3>
                        <p>{card.description}</p>
                        <Link to={card.link} className="btn-gold-outline" style={{ fontSize: '0.9rem', padding: '10px 20px' }}>
                            View More
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    </section>
)

export const EventsList = ({ events, limit }) => {
    const displayedEvents = limit ? events.slice(0, limit) : events
    return (
        <section className="events-list-section">
            <div className="container">
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    {displayedEvents.map((event, index) => (
                        <div key={event.id || `${event.title}-${index}`} className="event-item-card">
                            <div className="event-date-box">
                                <span className="event-day">{event.day}</span>
                                <span className="event-month">{event.month}</span>
                            </div>
                            {event.image_url || event.image ? (
                                <img
                                    className="event-item-thumb"
                                    src={event.image_url ? getBackendUrl(event.image_url) : event.image}
                                    alt={event.title}
                                />
                            ) : null}
                            <div className="event-details">
                                <div className="event-meta">{event.time} | {event.location || 'Cathedral'}</div>
                                <h3>{event.title}</h3>
                                {event.description && <p className="text-mid" style={{ marginBottom: '16px', fontSize: '0.95rem' }}>{event.description}</p>}
                                <Link to={`/events/${event.id}`} className="text-gold" style={{ fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
                                    View Details →
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export const NewsGrid = ({ articles }) => (
    <section className="news-grid-section">
        <div className="container">
            <div className="grid-3">
                {articles.map((article, index) => (
                    <div key={article.id || `${article.title}-${index}`} className="news-article-card">
                        <div
                            className="news-article-image"
                            style={{ backgroundImage: `url(${article.image_url ? getBackendUrl(article.image_url) : article.image || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=800'})` }}
                        ></div>
                        <div className="news-article-content">
                            <div className="news-date">{article.date}</div>
                            <h3>{article.title}</h3>
                            <p className="text-mid" style={{ fontSize: '0.95rem', marginBottom: '20px' }}>{article.summary}</p>
                            <Link to={`/news/${article.id}`} className="btn-navy" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>Read More</Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
)

export const SubscribeSection = () => {
    const [email, setEmail] = useState('')
    const [errors, setErrors] = useState({})
    const [message, setMessage] = useState('')

    function handleSubmit(event) {
        event.preventDefault()
        const nextErrors = {}
        validateEmail(nextErrors, 'email', email)
        setErrors(nextErrors)

        if (hasErrors(nextErrors)) {
            setMessage('')
            return
        }

        setMessage('Thank you. Your email address is ready for newsletter subscription.')
        setEmail('')
    }

    return (
        <section className="subscribe-section">
            <div className="container">
                <div className="subscribe-container">
                    <h2 style={{ fontFamily: 'Playfair Display', fontSize: '2rem', marginBottom: '12px' }}>Stay Informed</h2>
                    <p style={{ opacity: 0.9 }}>Subscribe to receive weekly updates and digital newsletters from St Mary's Cathedral.</p>
                    <form className="subscribe-form" onSubmit={handleSubmit} noValidate>
                        <input
                            type="email"
                            placeholder="Your email address"
                            className="subscribe-input"
                            value={email}
                            onChange={event => {
                                const nextErrors = {}
                                validateEmail(nextErrors, 'email', event.target.value)

                                setEmail(event.target.value)
                                setErrors(nextErrors)
                                setMessage('')
                            }}
                            required
                            aria-invalid={Boolean(errors.email)}
                        />
                        <button type="submit" className="btn-gold">Subscribe</button>
                    </form>
                    {errors.email ? <span className="subscribe-feedback error">{errors.email[0]}</span> : null}
                    {message ? <span className="subscribe-feedback success">{message}</span> : null}
                </div>
            </div>
        </section>
    )
}

export const NewsCTA = ({ title, description, buttonText, buttonLink }) => (
    <section className="section" style={{ background: 'var(--navy)', color: 'var(--white)', textAlign: 'center', padding: '60px 0' }}>
        <div className="container">
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: '2rem', marginBottom: '16px' }}>{title}</h2>
            <p style={{ opacity: 0.8, maxWidth: '600px', margin: '0 auto 30px' }}>{description}</p>
            <Link to={buttonLink} className="btn-gold">{buttonText}</Link>
        </div>
    </section>
)
