import { useEffect, useMemo, useState } from 'react'
import { NewsHero, NewsIntro, NewsCTA } from '../components/news/NewsEventsSections'
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

export default function NewsletterArchivePage() {
    const [newsletters, setNewsletters] = useState([])
    const [query, setQuery] = useState('')
    const [year, setYear] = useState('')
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
                console.log('Error loading newsletter archive:', error)
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

    const years = useMemo(() => (
        Array.from(new Set(newsletters.map(item => String(new Date(`${item.publication_date}T00:00:00`).getFullYear()))))
    ), [newsletters])

    const groupedNewsletters = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase()

        return newsletters
            .filter(item => {
                const itemYear = String(new Date(`${item.publication_date}T00:00:00`).getFullYear())
                const matchesYear = year ? itemYear === year : true
                const matchesQuery = normalizedQuery
                    ? `${item.title} ${item.description || ''} ${item.original_filename}`.toLowerCase().includes(normalizedQuery)
                    : true

                return matchesYear && matchesQuery
            })
            .reduce((groups, item) => {
                const itemYear = String(new Date(`${item.publication_date}T00:00:00`).getFullYear())
                return {
                    ...groups,
                    [itemYear]: [...(groups[itemYear] || []), item],
                }
            }, {})
    }, [newsletters, query, year])

    return (
        <div className="news-events-page">
            <NewsHero
                title="Newsletter Archive"
                subtitle="Browse past editions of the parish newsletter."
                image="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1600"
                breadcrumb="Newsletter Archive"
            />

            <NewsIntro
                title="Preserving Our Parish History"
                text="The digital archive allows you to look back at past announcements, event details, and community milestones. Use the list below to find, open, and download historical bulletins."
            />

            <section className="section">
                <div className="container">
                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                        <div style={{ marginBottom: '40px', display: 'flex', gap: '20px', background: '#f8f9fa', padding: '24px', borderRadius: '12px', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                placeholder="Search past newsletters..."
                                value={query}
                                onChange={event => setQuery(event.target.value)}
                                style={{ flexGrow: 1, minWidth: '220px', padding: '12px 20px', borderRadius: '8px', border: '1px solid #ddd' }}
                            />
                            <select value={year} onChange={event => setYear(event.target.value)} style={{ padding: '12px 20px', borderRadius: '8px', border: '1px solid #ddd' }}>
                                <option value="">Filter by Year</option>
                                {years.map(item => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </div>

                        {isLoading ? <p className="text-mid" style={{ textAlign: 'center' }}>Loading newsletter archive...</p> : null}

                        {!isLoading && !Object.keys(groupedNewsletters).length ? (
                            <p className="text-mid" style={{ textAlign: 'center' }}>No newsletters match your search.</p>
                        ) : null}

                        {Object.entries(groupedNewsletters).map(([groupYear, items]) => (
                            <div key={groupYear} className="archive-year-group">
                                <h2 className="archive-year-title">{groupYear}</h2>
                                {items.map(item => (
                                    <div key={item.id} className="archive-item">
                                        <div>
                                            <h4 style={{ color: 'var(--navy)', marginBottom: '4px' }}>{item.title}</h4>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-mid)' }}>{formatDate(item.publication_date)}</span>
                                            {item.description ? <p className="text-mid" style={{ margin: '8px 0 0' }}>{item.description}</p> : null}
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            <a href={getBackendUrl(item.view_url)} target="_blank" rel="noreferrer" className="btn-navy" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Open</a>
                                            <a href={getBackendUrl(item.download_url)} className="btn-gold" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Download PDF</a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <NewsCTA
                title="Need an Older Edition?"
                description="If you're looking for newsletters that are not listed here, please contact the Parish Office."
                buttonText="Contact Parish Office"
                buttonLink="/contact"
            />
        </div>
    )
}
