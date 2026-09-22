import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'
import { getBackendUrl } from '../lib/auth'
import './MassTimesPage.css'

const confessionTimes = [
    'Saturday: 10.30am to 11.30am',
    'Saturday: 5.00pm to 6.00pm',
    'Extra services of Reconciliation during Lent are announced in the newsletter',
]

const sacramentCards = [
    { title: 'Baptism', description: 'Preparation and reception for infants, children, and adults entering the Church.', link: '/baptism' },
    { title: 'First Holy Communion', description: 'Preparation for baptised Catholic children in school year 3 and above.', link: '/first-holy-communion' },
    { title: 'Confirmation', description: 'Preparation for young people from school year 8 who have received Holy Communion.', link: '/confirmation' },
    { title: 'Marriage', description: 'Preparation, meetings with clergy, and practical guidance for weddings in the parish.', link: '/marriage' },
    { title: 'Reconciliation', description: 'Regular confession times and guidance for the Sacrament of Reconciliation.', link: '/reconciliation' },
    { title: 'Becoming a Catholic', description: 'RCIA for those exploring the Catholic faith or seeking full communion with the Church.', link: '/becoming-catholic' },
]

const prayerSchedule = [
    { title: 'Ignatian Prayer Group', schedule: 'Fortnightly during term time, 7.00pm to 8.30pm', description: 'Praying with the Sunday Mass readings in person or online.' },
    { title: 'Rosary', schedule: 'Fridays at 6.00pm in Malayali and Saturdays after 9.00am Mass', description: 'All are welcome to join this regular parish devotion.' },
    { title: 'Exposition and Rosary', schedule: 'Every second Friday, 4.00pm to 5.45pm', description: 'Prayer and reflection before the Blessed Sacrament.' },
    { title: 'Stations of the Cross', schedule: 'During Lent at the Cathedral and Coedpoeth', description: 'See the weekly newsletter for published seasonal times.' },
]

export default function MassTimesPage() {
    const [massTimes, setMassTimes] = useState([])
    const [locationFilter, setLocationFilter] = useState('all')

    useEffect(() => {
        fetch(getBackendUrl('/api/v1/mass-times'))
            .then(res => res.json())
            .then(data => setMassTimes(Array.isArray(data?.data) ? data.data : []))
            .catch(err => console.log('Error loading mass times:', err))
    }, [])

    const normalized = massTimes
        .map(item => ({
            ...item,
            location: item.location || "St Mary's Cathedral",
            day: item.day || 'Day',
            start_time: item.start_time || '',
        }))

    const filtered = normalized.filter(item => {
        if (locationFilter === 'all') {
            return true
        }

        const isCoedpoeth = /coedpoeth/i.test(item.location) || /holy family/i.test(item.location)

        return locationFilter === 'coedpoeth' ? isCoedpoeth : !isCoedpoeth
    })

    const groupedByLocationThenDay = filtered.reduce((acc, item) => {
        const locationKey = item.location
        const locationGroup = acc[locationKey] || {}
        const times = locationGroup[item.day] || []
        locationGroup[item.day] = [...times, item.start_time].filter(Boolean)
        acc[locationKey] = locationGroup
        return acc
    }, {})

    return (
        <div className="mass-sac-page">
            <PageHero
                title="Mass & Sacraments"
                subtitle="Regular worship, confession, sacramental preparation, and prayer at St Mary's Cathedral"
                centered={true}
            />

            <div className="container">
                <section className="section">
                    <h2 className="section-title">Mass Times</h2>
                    <p className="section-subtitle">Please check the weekly newsletter for weekday updates and seasonal notices</p>

                    <div className="mt-filter-bar" role="tablist" aria-label="Filter mass times by location">
                        <button type="button" className={`mt-filter-tab ${locationFilter === 'all' ? 'active' : ''}`} onClick={() => setLocationFilter('all')}>
                            All
                        </button>
                        <button type="button" className={`mt-filter-tab ${locationFilter === 'cathedral' ? 'active' : ''}`} onClick={() => setLocationFilter('cathedral')}>
                            Cathedral
                        </button>
                        <button type="button" className={`mt-filter-tab ${locationFilter === 'coedpoeth' ? 'active' : ''}`} onClick={() => setLocationFilter('coedpoeth')}>
                            Coedpoeth
                        </button>
                    </div>

                    <div className="mt-schedule">
                        {Object.keys(groupedByLocationThenDay).length ? Object.entries(groupedByLocationThenDay).map(([location, days]) => (
                            <div key={location} className="mt-location-block">
                                <h3 className="mt-location-title">{location}</h3>
                                <div className="mt-day-grid">
                                    {Object.entries(days).map(([day, times]) => (
                                        <div key={`${location}-${day}`} className="mt-day-card">
                                            <div className="mt-day-head">
                                                <span className="mt-day-name">{day}</span>
                                                <span className="mt-day-count">{times.length} time{times.length === 1 ? '' : 's'}</span>
                                            </div>
                                            <div className="mt-time-list">
                                                {times.map((time) => (
                                                    <span key={`${location}-${day}-${time}`} className="mt-time-pill">{time}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )) : (
                            <div className="content-card" style={{ textAlign: 'center' }}>
                                <h3>No schedule yet</h3>
                                <p>Published Mass times will appear here automatically.</p>
                            </div>
                        )}
                    </div>

                    <div className="contact-strip" style={{ marginTop: '32px' }}>
                        <h3 style={{ marginBottom: '12px', fontFamily: 'Playfair Display, serif' }}>Confession Times</h3>
                        <ul className="bullet-list" style={{ color: 'var(--white)' }}>
                            {confessionTimes.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="text-center mt-48 newsletter-cta">
                        <Link to="/newsletter" className="newsletter-link-full">
                            See the weekly newsletter for the latest liturgical schedule and parish notices <span>&rarr;</span>
                        </Link>
                    </div>
                </section>

                <section className="section bg-light-full-width">
                    <div className="container">
                        <h2 className="section-title">Sacramental Life</h2>
                        <p className="section-subtitle">Preparation and guidance for the sacraments celebrated in Cathedral parish</p>

                        <div className="grid-3 sacrament-grid">
                            {sacramentCards.map((sac) => (
                                <div key={sac.title} className="card sacrament-card">
                                    <div className="sac-icon-box">
                                        <span className="sac-icon">{sac.title.slice(0, 2).toUpperCase()}</span>
                                    </div>
                                    <h3 className="sac-title">{sac.title}</h3>
                                    <p className="sac-desc">{sac.description}</p>
                                    <Link to={sac.link} className="btn-outline-sm">Learn More</Link>
                                </div>
                            ))}
                        </div>

                        <div className="info-banner">
                            <div className="info-banner-icon">i</div>
                            <div className="info-banner-content">
                                <h3>Other Sacramental Support</h3>
                                <p>
                                    Funerals, the Sacrament of the Sick, home Communion visits, vocations, and diaconate enquiries should begin with the parish office or clergy team.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section">
                    <h2 className="section-title">Prayer And Devotion</h2>

                    <div className="grid-2 other-services-grid">
                        {prayerSchedule.map((service) => (
                            <div key={service.title} className="card service-card">
                                <h3 className="service-title">{service.title}</h3>
                                <p className="service-schedule">{service.schedule}</p>
                                <p className="service-desc">{service.description}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '28px' }}>
                        <Link to="/prayer-devotions" className="btn-primary">Prayer & Devotions Page</Link>
                    </div>
                </section>
            </div>
        </div>
    )
}
