import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBackendUrl } from '../lib/auth'
import './HomePage.css'

import churchIcon from '../assets/icons/church_sketch.png'
import bibleIcon from '../assets/icons/bible_sketch.png'
import doveIcon from '../assets/icons/dove_sketch.png'
import PhotoGallery from '../components/PhotoGallery'
import { fetchGalleryImages, galleryImages } from '../lib/galleryImages'

const publicAsset = (path) => encodeURI(`${import.meta.env.BASE_URL}${path}`)

const heroSlides = [
  {
    image: [publicAsset('gallery/hero-interior.jpg'), publicAsset('image 01.jpg')],
    label: 'MASS TIMES',
    title: 'Join Us For Worship',
    desc: "Find weekday and weekend Mass times at St Mary's Cathedral and the Church of the Holy Family, Coedpoeth.",
    btnText: 'View Mass Times',
    link: '/mass-times',
  },
  {
    image: [publicAsset('gallery/thumbnail_IMG_7226.jpg'), publicAsset('image 02.jpg')],
    label: 'UPCOMING EVENTS',
    title: 'See What Is Happening',
    desc: 'Keep up with parish events, special celebrations, and community gatherings across cathedral life.',
    btnText: 'Explore Events',
    link: '/news-events',
  },
  {
    image: [publicAsset('gallery/IMG_4020.jpeg'), publicAsset('image 03.jpg')],
    label: 'PARISH REGISTRATION',
    title: 'Become Part Of Our Parish',
    desc: 'Register with the parish so we can welcome you, support your household, and help you stay connected.',
    btnText: 'Register Now',
    link: '/registration',
  },
  {
    image: [publicAsset('gallery/IMG_5236 (1).jpeg'), publicAsset('image 04.jpg')],
    label: 'NEWSLETTER',
    title: 'Stay In Touch Each Week',
    desc: 'Read the weekly newsletter for parish notices, Mass updates, diocesan news, and seasonal services.',
    btnText: 'View Newsletter',
    link: '/newsletter',
  },
]

const services = [
  {
    icon: churchIcon,
    title: 'Parish Registration',
    desc: 'Register with the parish so we can stay connected, support your family, and welcome you fully into Cathedral life.',
  },
  {
    icon: bibleIcon,
    title: 'Sacramental Life',
    desc: 'Preparation is available for Baptism, First Holy Communion, Reconciliation, Confirmation, Marriage, and becoming a Catholic through RCIA.',
  },
  {
    icon: doveIcon,
    title: 'Prayer And Parish Life',
    desc: 'Join prayer groups, youth ministry, volunteers, fundraising, and pastoral outreach that help our parish live and serve together.',
  },
]

function formatNewsDate(value) {
  if (!value) {
    return 'Recent update'
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(timeString) {
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

export default function HomePage() {
  const [heroIdx, setHeroIdx] = useState(0)
  const [homeMassTimes, setHomeMassTimes] = useState([])
  const [homeNewsPosts, setHomeNewsPosts] = useState([])
  const [homeGalleryImages, setHomeGalleryImages] = useState(galleryImages)

  useEffect(() => {
    const timer = setInterval(() => setHeroIdx((i) => (i + 1) % heroSlides.length), 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let ignore = false

    async function loadGalleryImages() {
      const images = await fetchGalleryImages()

      if (!ignore) {
        setHomeGalleryImages(images)
      }
    }

    loadGalleryImages()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    let ignore = false

    async function loadHomeData() {
      try {
        const massTimesResponse = await fetch(getBackendUrl('/api/v1/mass-times'))
        const massTimesPayload = await massTimesResponse.json()

        if (ignore) {
          return
        }

        if (massTimesResponse.ok && Array.isArray(massTimesPayload.data)) {
          setHomeMassTimes(massTimesPayload.data.slice(0, 6))
        }
      } catch {
        if (!ignore) {
          setHomeMassTimes([])
        }
      }

      try {
        const newsResponse = await fetch(getBackendUrl('/api/v1/news'))
        const newsPayload = await newsResponse.json()

        if (ignore) {
          return
        }

        if (newsResponse.ok && Array.isArray(newsPayload.data)) {
          setHomeNewsPosts(newsPayload.data.slice(0, 3))
        } else {
          setHomeNewsPosts([])
        }
      } catch {
        if (!ignore) {
          setHomeNewsPosts([])
        }
      }
    }

    loadHomeData()

    return () => {
      ignore = true
    }
  }, [])

  const groupedMassTimes = homeMassTimes
    .reduce((groups, item) => {
      const location = item.location || "St Mary's Cathedral"
      const existing = groups.find((group) => group.day === item.day && group.location === location)

      if (existing) {
        existing.times.push(formatTime(item.start_time))
        return groups
      }

      groups.push({
        day: item.day,
        location,
        times: [formatTime(item.start_time)],
      })

      return groups
    }, [])
    .slice(0, 3)

  return (
    <div className="home">
      <section className="hero full-width-hero">
        <div className="hero-bg-slider">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`hero-bg-slide ${index === heroIdx ? 'active' : ''}`}
              style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.62), rgba(0,0,0,0.62)), ${slide.image
                  .map((imgUrl) => `url('${imgUrl}')`)
                  .join(', ')}`,
              }}
            />
          ))}
        </div>

        <div className="container hero-content-centered">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`hero-text-layer ${index === heroIdx ? 'active' : ''}`}
            >
              <p className="hero-label-stately">{slide.label} • EST. 1857</p>
              <h1 className="hero-title-grand">{slide.title}</h1>
              <p className="hero-desc">{slide.desc}</p>
              <div className="hero-btns">
                <Link to={slide.link} className="btn-primary-grand">{slide.btnText}</Link>
                <Link to="/contact" className="btn-outline-white hero-secondary-btn">Contact Us</Link>
              </div>
            </div>
          ))}

          <div className="hero-dots">
            {heroSlides.map((_, index) => (
              <button
                key={index}
                className={`hero-dot-stately ${index === heroIdx ? 'active' : ''}`}
                onClick={() => setHeroIdx(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="info-bar">
        <div className="container info-bar-grid">
          <div className="info-bar-item">
            <span className="info-bar-icon">1857</span>
            <div className="info-bar-text">
              <h3>Est. 1857</h3>
              <p>A Rich History</p>
            </div>
          </div>
          <div className="info-bar-divider"></div>
          <div className="info-bar-item">
            <span className="info-bar-icon">ALL</span>
            <div className="info-bar-text">
              <h3>Parish Family</h3>
              <p>Growing Together</p>
            </div>
          </div>
          <div className="info-bar-divider"></div>
          <div className="info-bar-item">
            <span className="info-bar-icon">OK</span>
            <div className="info-bar-text">
              <h3>100% Welcome</h3>
              <p>Open To Everyone</p>
            </div>
          </div>
          <div className="info-bar-divider"></div>
          <div className="info-bar-item">
            <span className="info-bar-icon">WX</span>
            <div className="info-bar-text">
              <h3>Wrexham</h3>
              <p>Diocese Seat</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section about-snippet">
        <div className="container about-inner">
          <div className="about-video-wrapper">
            <video className="about-video" controls autoPlay muted loop>
              <source src={publicAsset('video.mp4')} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="about-text">
            <p className="section-label">ABOUT US</p>
            <h2 className="section-title" style={{ textAlign: 'left' }}>Welcome to our Cathedral parish family</h2>
            <p style={{ color: 'var(--text-mid)', marginBottom: '16px', lineHeight: '1.7' }}>
              St Mary's Cathedral is the mother church of the Diocese of Wrexham and the home of a welcoming parish community. Alongside the Church of the Holy Family in Coedpoeth, we serve parishioners from many backgrounds through worship, sacramental life, prayer, service, and practical support.
            </p>
            <Link to="/about" className="btn-gold">MORE ABOUT US</Link>
          </div>
        </div>
      </section>

      <section className="section-sm" style={{ background: 'var(--white)' }}>
        <div className="container">
          <p className="section-label">OUR SERVICES</p>
          <h2 className="section-title">Keeping our church running smoothly</h2>
          <div className="grid-3 services-redesign" style={{ marginBottom: '24px' }}>
            {services.map((service) => (
              <div key={service.title} className="card service-card redesigned">
                <div className="service-icon-img-wrapper">
                  <img src={service.icon} alt={service.title} className="service-icon-img" />
                </div>
                <h3 className="service-title">{service.title}</h3>
                <p className="service-desc">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">Mass Times</h2>
          <p className="section-subtitle">Join us for worship</p>
          <div className="grid-3 mass-cards">
            {groupedMassTimes.length ? (
              groupedMassTimes.map((mass, index) => (
                <div key={`${mass.day}-${index}`} className="mass-card">
                  <div className="mass-card-header">
                    <div className={`mass-icon mass-icon-variant-${(index % 3) + 1}`}>
                      <span className={`mass-clock mass-clock-${(index % 3) + 1}`} aria-hidden="true"></span>
                    </div>
                    <div className="mass-card-header-copy">
                      <div className="mass-location">{mass.location}</div>
                      <div className="mass-day">{mass.day}</div>
                    </div>
                    <div className="mass-count">{mass.times.length} time{mass.times.length > 1 ? 's' : ''}</div>
                  </div>
                  <div className="mass-sub">
                    {mass.location === "St Mary's Cathedral"
                      ? 'Cathedral schedule'
                      : 'Community worship location'}
                  </div>
                  <div className="mass-section-label">Service Times</div>
                  <div className="mass-times-list">
                    {mass.times.map((time) => (
                      <span key={`${mass.day}-${time}`}>{time}</span>
                    ))}
                  </div>
                  <div className="mass-card-footer">
                    <span className="mass-footer-day">{mass.day}</span>
                    <Link to="/mass-times" className="mass-highlight">See full schedule</Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="mass-card">
                <div className="mass-card-header">
                  <div className="mass-icon mass-icon-variant-1">
                    <span className="mass-clock mass-clock-1" aria-hidden="true"></span>
                  </div>
                  <div className="mass-card-header-copy">
                    <div className="mass-location">Mass Times</div>
                    <div className="mass-day">Latest schedule updates</div>
                  </div>
                </div>
                <div className="mass-sub">Published schedule updates will appear here automatically.</div>
                <div className="mass-section-label">Schedule</div>
                <div className="mass-times-list">
                  <Link to="/mass-times" className="mass-highlight" style={{ textDecoration: 'underline', cursor: 'pointer' }}>
                    See Schedule
                  </Link>
                </div>
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link to="/mass-times" className="btn-outline">View Full Mass Schedule</Link>
          </div>
        </div>
      </section>

      <section className="section home-news-section">
        <div className="container news-newsletter-grid">
          <div className="news-col">
            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: '24px' }}>Latest News</h2>
            {homeNewsPosts.length ? homeNewsPosts.map((item) => (
              <Link key={item.id} to={`/news/${item.id}`} className="news-item-link">
                <div className="news-item">
                  <p className="news-date">{formatNewsDate(item.published_at)}</p>
                  <h3 className="news-title">{item.title}</h3>
                  <p className="news-desc">{item.summary || 'Read the full update from St Mary\'s Cathedral.'}</p>
                  <span className="read-more">Read More →</span>
                </div>
              </Link>
            )) : (
              <div className="news-item">
                <p className="news-date">Updates</p>
                <h3 className="news-title">News posts will appear here</h3>
                <p className="news-desc">Published news and announcements from the admin dashboard will show here automatically.</p>
              </div>
            )}
            <div style={{ marginTop: '18px' }}>
              <Link to="/news" className="btn-outline">View All News</Link>
            </div>
          </div>
          <div className="newsletter-box">
            <div className="newsletter-icon">News</div>
            <h3 className="newsletter-title">Weekly Newsletter</h3>
            <p className="newsletter-desc">
              Keep up with weekly Mass updates, parish notices, diocesan news, social events, and seasonal services through the parish newsletter and the Clarion diocesan newsletter.
            </p>
            <Link className="btn-gold" style={{ width: '100%', justifyContent: 'center', marginBottom: '12px' }} to="/newsletter">
              View Newsletter
            </Link>
            <p className="newsletter-note">
              We respect your privacy. You may unsubscribe at any time. View our privacy policy.
            </p>
          </div>
        </div>
      </section>

      <section className="section home-gallery-section">
        <div className="container">
          <p className="section-label" style={{ textAlign: 'center' }}>GALLERY</p>
          <h2 className="section-title">A Glimpse of Cathedral Life</h2>
          <p className="section-desc" style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 28px' }}>
            Worship, welcome, and community moments from around St Mary&apos;s Cathedral.
          </p>
          <PhotoGallery images={homeGalleryImages} limit={6} />
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link to="/gallery" className="btn-outline">View Full Gallery</Link>
          </div>
        </div>
      </section>

      <section className="donate-cta">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="donate-heart">Support</div>
          <h2 className="donate-title">Supporting The Cathedral</h2>
          <p className="donate-desc">
            The Cathedral parish depends on parishioners, visitors, and grant funders to support daily ministry, ongoing maintenance, and future development projects. Every contribution helps sustain parish life.
          </p>
          <Link to="/donate" className="btn-gold">Donate to Support the Cathedral</Link>
        </div>
      </section>

      <section className="visit-us-section">
        <div className="container">
          <p className="section-label" style={{ textAlign: 'center' }}>FIND US</p>
          <h2 className="section-title">Visit St Mary's Cathedral</h2>
          <div className="visit-cards-row">
            <div className="visit-card">
              <div className="visit-card-icon">WX</div>
              <h4>Address</h4>
              <p>St Mary's Cathedral<br />Regent Street<br />Wrexham, LL11 1RB</p>
            </div>
            <div className="visit-card">
              <div className="visit-card-icon">Hrs</div>
              <h4>Office Hours</h4>
              <p>Tuesday, Wednesday and Friday<br />9:30 AM - 2:30 PM<br />Please email ahead where possible</p>
            </div>
            <div className="visit-card">
              <div className="visit-card-icon">Tel</div>
              <h4>Contact</h4>
              <p>01978 263943<br />secretarywrexhamcathedral@rcdwxm.org.uk</p>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: '28px' }}>
            <Link to="/contact" className="btn-primary">Get in Touch</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
