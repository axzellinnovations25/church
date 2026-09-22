import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHero from '../components/PageHero'
import { getBackendUrl } from '../lib/auth'
import './EventDetailPage.css'

function formatDate(value) {
  if (!value) {
    return 'Date to be confirmed'
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatType(value) {
  if (!value) {
    return 'News'
  }

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(word => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ')
}

export default function NewsDetailPage() {
  const { newsId } = useParams()
  const [newsPost, setNewsPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadNewsPost() {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(getBackendUrl(`/api/v1/news/${newsId}`))
        const payload = await response.json()

        if (ignore) {
          return
        }

        if (!response.ok || !payload?.data) {
          setNewsPost(null)
          setError(payload?.message || 'We could not find that news post.')
          return
        }

        setNewsPost(payload.data)
      } catch {
        if (!ignore) {
          setNewsPost(null)
          setError('The news details could not be loaded right now.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    loadNewsPost()

    return () => {
      ignore = true
    }
  }, [newsId])

  return (
    <div className="event-detail-page">
      <PageHero
        title={newsPost?.title || 'News Details'}
        subtitle={newsPost ? 'Read the full update from St Mary\'s Cathedral.' : 'Loading the selected news post.'}
        centered={true}
      />

      <section className="section event-detail-section">
        <div className="container">
          {loading ? (
            <div className="event-detail-card event-detail-state">
              <p className="event-detail-eyebrow">Loading</p>
              <h2 className="event-detail-heading">Fetching news information</h2>
              <p className="event-detail-copy">Please wait while we load the latest published news details.</p>
            </div>
          ) : null}

          {!loading && error ? (
            <div className="event-detail-card event-detail-state">
              <p className="event-detail-eyebrow">Unavailable</p>
              <h2 className="event-detail-heading">This news post could not be opened</h2>
              <p className="event-detail-copy">{error}</p>
              <div className="event-detail-actions">
                <Link to="/news" className="btn-primary">Back to News</Link>
                <Link to="/news-events" className="btn-outline">News & Events</Link>
              </div>
            </div>
          ) : null}

          {!loading && newsPost ? (
            <div className="event-detail-layout">
              <article className="event-detail-card event-detail-main">
                {newsPost.image_url ? (
                  <img
                    className="event-detail-poster"
                    src={getBackendUrl(newsPost.image_url)}
                    alt={newsPost.title}
                  />
                ) : null}

                <div className="event-detail-meta">
                  <span className="event-detail-badge">{formatType(newsPost.type)}</span>
                  <span className="event-detail-meta-item">{formatDate(newsPost.published_at)}</span>
                </div>

                <h2 className="event-detail-title">{newsPost.title}</h2>
                {newsPost.summary ? <p className="event-detail-description">{newsPost.summary}</p> : null}
                <p className="event-detail-description">
                  {newsPost.content || 'More information about this news post will be shared soon.'}
                </p>

                <div className="event-detail-actions">
                  <Link to="/news" className="btn-primary">Back to News</Link>
                  <Link to="/contact" className="btn-outline">Contact the Parish Office</Link>
                </div>
              </article>

              <aside className="event-detail-card event-detail-sidebar">
                <h3 className="event-detail-side-title">Post Information</h3>

                <div className="event-detail-info-list">
                  <div className="event-detail-info-item">
                    <span className="event-detail-label">Published</span>
                    <span className="event-detail-value">{formatDate(newsPost.published_at)}</span>
                  </div>

                  <div className="event-detail-info-item">
                    <span className="event-detail-label">Type</span>
                    <span className="event-detail-value">{formatType(newsPost.type)}</span>
                  </div>
                </div>
              </aside>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}
