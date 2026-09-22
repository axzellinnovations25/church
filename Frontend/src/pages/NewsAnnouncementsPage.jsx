import { useEffect, useMemo, useState } from 'react'
import { NewsHero, NewsIntro, NewsGrid, NewsCTA, SubscribeSection } from '../components/news/NewsEventsSections'
import { getBackendUrl } from '../lib/auth'

function formatDate(value) {
    if (!value) {
        return 'Date TBC'
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    })
}

function formatShortDate(value) {
    if (!value) {
        return 'TBC'
    }

    const date = new Date(`${value}T00:00:00`)
    return `${date.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase()} ${date.toLocaleDateString('en-GB', { day: '2-digit' })}`
}

function toArticle(newsPost) {
    return {
        ...newsPost,
        date: formatDate(newsPost.published_at),
        summary: newsPost.summary || 'More details will be shared soon.',
    }
}

export default function NewsAnnouncementsPage() {
    const [newsPosts, setNewsPosts] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        let ignore = false

        async function loadNews() {
            setIsLoading(true)
            setErrorMessage('')

            try {
                const response = await fetch(getBackendUrl('/api/v1/news'))
                const payload = await response.json()

                if (ignore) {
                    return
                }

                if (!response.ok || !Array.isArray(payload?.data)) {
                    throw new Error(payload?.message || 'News posts could not be loaded.')
                }

                setNewsPosts(payload.data)
            } catch (error) {
                if (!ignore) {
                    setErrorMessage(error.message || 'News posts could not be loaded.')
                    setNewsPosts([])
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false)
                }
            }
        }

        loadNews()

        return () => {
            ignore = true
        }
    }, [])

    const articles = useMemo(() => newsPosts.map(toArticle), [newsPosts])
    const recentPosts = articles.slice(0, 3)

    return (
        <div className="news-events-page">
            <NewsHero
                title="News & Announcements"
                subtitle="Read the latest updates and announcements from St Mary's Cathedral."
                image="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1600"
                breadcrumb="News & Announcements"
            />

            <NewsIntro
                title="Latest from the Cathedral"
                text="Stay up to date with the stories that shape our parish life. From major announcements to community highlights, this is your source for what's happening at St Mary's."
            />

            {isLoading ? (
                <section className="news-grid-section">
                    <div className="container" style={{ textAlign: 'center' }}>
                        <p className="text-mid">Loading published news and announcements...</p>
                    </div>
                </section>
            ) : null}

            {!isLoading && errorMessage ? (
                <section className="news-grid-section">
                    <div className="container" style={{ textAlign: 'center' }}>
                        <p className="text-mid">{errorMessage}</p>
                    </div>
                </section>
            ) : null}

            {!isLoading && !errorMessage && articles.length ? <NewsGrid articles={articles} /> : null}

            {!isLoading && !errorMessage && !articles.length ? (
                <section className="news-grid-section">
                    <div className="container" style={{ textAlign: 'center' }}>
                        <p className="text-mid">No published news or announcements are available yet.</p>
                    </div>
                </section>
            ) : null}

            <section className="section" style={{ background: '#fcfaf6', padding: '60px 0' }}>
                <div className="container">
                    <div className="grid-2" style={{ gap: '60px', alignItems: 'center' }}>
                        <div>
                            <h2 className="text-navy" style={{ fontFamily: 'Playfair Display', marginBottom: '20px' }}>Recent Posts</h2>
                            <ul style={{ listStyle: 'none', padding: 0 }}>
                                {recentPosts.map(post => (
                                    <li key={post.id} style={{ padding: '15px 0', borderBottom: '1px solid #eee' }}>
                                        <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.85rem' }}>{formatShortDate(post.published_at)}</span>
                                        <h4 style={{ color: 'var(--navy)', marginTop: '5px' }}>{post.title}</h4>
                                    </li>
                                ))}
                                {!recentPosts.length ? (
                                    <li style={{ padding: '15px 0' }}>
                                        <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '0.85rem' }}>SOON</span>
                                        <h4 style={{ color: 'var(--navy)', marginTop: '5px' }}>Published posts will appear here.</h4>
                                    </li>
                                ) : null}
                            </ul>
                        </div>
                        <SubscribeSection />
                    </div>
                </div>
            </section>

            <NewsCTA
                title="Want to Stay Notified?"
                description="Sign up for our digital alerts to receive the latest announcements directly in your inbox as they happen."
                buttonText="Sign Up for Digital Alerts"
                buttonLink="/contact"
            />
        </div>
    )
}
