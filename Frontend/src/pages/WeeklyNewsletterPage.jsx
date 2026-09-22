import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { NewsHero, NewsIntro, NewsCTA, SubscribeSection } from '../components/news/NewsEventsSections'
import { getBackendUrl } from '../lib/auth'

function formatDate(value) {
    if (!value) {
        return 'Date not set'
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    })
}

function formatBytes(value) {
    if (!value) {
        return 'PDF'
    }

    const mb = value / 1024 / 1024
    return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB PDF`
}

export default function WeeklyNewsletterPage() {
    const [newsletters, setNewsletters] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let ignore = false

        async function loadNewsletters() {
            try {
                const response = await fetch(getBackendUrl('/api/v1/newsletters'))
                const payload = await response.json()

                if (!ignore && response.ok && Array.isArray(payload.data)) {
                    setNewsletters(payload.data)
                }
            } catch (error) {
                console.log('Error loading newsletters:', error)
            } finally {
                if (!ignore) {
                    setIsLoading(false)
                }
            }
        }

        loadNewsletters()

        return () => {
            ignore = true
        }
    }, [])

    const latestNewsletter = newsletters[0]

    return (
        <div className="news-events-page">
            <NewsHero
                title="Weekly Newsletter"
                subtitle="Stay informed about parish life, Mass times, and upcoming events."
                image="https://images.unsplash.com/photo-1504173010664-32509aeebb62?q=80&w=1600"
                breadcrumb="Weekly Newsletter"
            />
            <NewsIntro
                title="Digital Cathedral Bulletin"
                text="The weekly newsletter is the main place to check weekday Mass times, extra services of Reconciliation during Lent, annual commemorations, pilgrimages, social events, and parish notices."
            />

            <div className="container" style={{ padding: '40px 0' }}>
                <div className="newsletter-preview-card">
                    <div style={{ textAlign: 'center', borderBottom: '2px solid var(--gold)', paddingBottom: '20px', marginBottom: '30px' }}>
                        <h2 className="text-navy" style={{ fontFamily: 'Playfair Display' }}>Parish Newsletter</h2>
                        <p style={{ color: 'var(--gold)', fontWeight: 700 }}>
                            {latestNewsletter ? formatDate(latestNewsletter.publication_date) : 'Weekly parish notices and liturgical updates'}
                        </p>
                    </div>

                    {isLoading ? <p className="text-mid" style={{ textAlign: 'center' }}>Loading the latest newsletter...</p> : null}

                    {!isLoading && latestNewsletter ? (
                        <>
                            <div className="newsletter-inner-section">
                                <h4>{latestNewsletter.title}</h4>
                                <p className="text-mid" style={{ lineHeight: '1.6' }}>
                                    {latestNewsletter.description || 'Open or download the latest parish newsletter PDF for Mass updates, notices, and community news.'}
                                </p>
                                <p className="text-mid" style={{ marginTop: '12px' }}>
                                    {formatBytes(latestNewsletter.file_size)} | {latestNewsletter.original_filename}
                                </p>
                            </div>

                            <div className="newsletter-inner-section">
                                <div className="newsletter-viewer-header">
                                    <div>
                                        <h4 style={{ marginBottom: '6px' }}>Latest issue open on this page</h4>
                                        <p className="text-mid" style={{ margin: 0 }}>
                                            The newest newsletter is shown below and can be read without leaving this page.
                                        </p>
                                    </div>
                                    <span className="newsletter-date-pill">
                                        {formatDate(latestNewsletter.publication_date)}
                                    </span>
                                </div>

                                <div className="newsletter-pdf-frame">
                                    <iframe
                                        key={latestNewsletter.id}
                                        title={latestNewsletter.title}
                                        src={getBackendUrl(latestNewsletter.view_url)}
                                    />
                                </div>
                            </div>

                            <div className="newsletter-primary-actions">
                                <a className="btn-navy" href={getBackendUrl(latestNewsletter.view_url)} target="_blank" rel="noreferrer">Open in New Tab</a>
                                <a className="btn-gold" href={getBackendUrl(latestNewsletter.download_url)}>Download PDF</a>
                            </div>
                        </>
                    ) : null}

                    {!isLoading && !latestNewsletter ? (
                        <p className="text-mid" style={{ textAlign: 'center' }}>No newsletters have been published yet. Please check back soon.</p>
                    ) : null}
                </div>
            </div>

            <SubscribeSection />

            <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <h3 className="text-navy" style={{ fontFamily: 'Playfair Display', marginBottom: '20px' }}>Looking for Past Editions?</h3>
                <Link to="/newsletter-archive" className="btn-gold-outline">Browse Newsletter Archive</Link>
            </div>

            <NewsCTA
                title="Church Life in Your Inbox"
                description="Subscribe to receive weekly updates from St Mary's Cathedral directly to your device."
                buttonText="Subscribe Now"
                buttonLink="/contact"
            />
        </div>
    )
}
