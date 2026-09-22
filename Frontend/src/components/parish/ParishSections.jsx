import { Link } from 'react-router-dom'
import './Parish.css'

export function ParishHero({ title, subtitle, image, breadcrumb }) {
    return (
        <section className="parish-hero" style={{ backgroundImage: `url(${image})` }}>
            <div className="container parish-hero-content">
                <div className="parish-hero-label">St Mary's Cathedral</div>
                <h1 className="parish-hero-title">{title}</h1>
                <p className="parish-hero-subtitle">{subtitle}</p>
                {breadcrumb && (
                    <div style={{ marginTop: '24px', opacity: 0.8, fontSize: '0.9rem' }}>
                        <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
                        <span style={{ margin: '0 10px' }}>/</span>
                        <Link to="/parish" style={{ color: 'white', textDecoration: 'none' }}>Parish</Link>
                        <span style={{ margin: '0 10px' }}>/</span>
                        <span style={{ color: 'var(--gold-light)' }}>{breadcrumb}</span>
                    </div>
                )}
            </div>
        </section>
    )
}

export function ParishIntro({ title, text }) {
    return (
        <section className="parish-intro">
            <div className="container parish-intro-inner">
                {title && <h2>{title}</h2>}
                <p className="parish-intro-text">{text}</p>
            </div>
        </section>
    )
}

export function ParishInfoCards({ cards, columns = 3 }) {
    return (
        <section className="parish-info-grid">
            <div className="container">
                <div className={`grid-${columns}`}>
                    {cards.map((card, index) => (
                        <div key={index} className="parish-card">
                            {card.icon && <div className="parish-card-icon">{card.icon}</div>}
                            <h3>{card.title}</h3>
                            <p>{card.content}</p>
                            {card.link && (
                                <Link to={card.link} className="read-more" style={{ marginTop: 'auto' }}>
                                    Learn More →
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export function ParishMembers({ members, isLoading = false }) {
    return (
        <section className="section">
            <div className="container">
                <h2 className="section-title">Council Members</h2>
                <div className="members-grid">
                    {isLoading ? <p className="text-mid">Loading council members...</p> : null}
                    {members.map((member, index) => (
                        <div key={index} className="member-card">
                            <div className="member-photo-placeholder">
                                {member.photo ? <img src={member.photo} alt={member.name} className="member-photo-image" /> : '👤'}
                            </div>
                            <h3>{member.name}</h3>
                            <div className="member-role">{member.role}</div>
                            {member.bio ? <p className="member-bio">{member.bio}</p> : null}
                        </div>
                    ))}
                    {!isLoading && !members.length ? <p className="text-mid">Parish council members will be listed here soon.</p> : null}
                </div>
            </div>
        </section>
    )
}

export function ParishTimeline({ items }) {
    return (
        <section className="section" style={{ background: '#fcfaf6' }}>
            <div className="container">
                <h2 className="section-title">Project Timeline</h2>
                <div className="timeline-container">
                    {items.map((item, index) => (
                        <div key={index} className="timeline-item">
                            <div className="timeline-date">{item.date}</div>
                            <div className="timeline-content">
                                <h3>{item.title}</h3>
                                <p>{item.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export function ParishCTA({ title, description, buttons }) {
    return (
        <section className="parish-cta">
            <div className="container parish-cta-inner">
                <h2>{title}</h2>
                <p>{description}</p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {buttons.map((btn, index) => (
                        <Link 
                            key={index} 
                            to={btn.link} 
                            className={btn.primary ? 'btn-gold' : 'btn-outline-white'}
                        >
                            {btn.text}
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}

export function RelatedParishLinks({ current }) {
    const links = [
        { name: 'Our Parish', path: '/parish', icon: '⛪' },
        { name: 'Parish Council', path: '/parish-council', icon: '👥' },
        { name: 'Parish Groups', path: '/parish-groups', icon: '♡' },
        { name: 'Building Project', path: '/building-project', icon: '🏢' },
        { name: 'Fundraising', path: '/fundraising', icon: '💰' },
        { name: 'Safeguarding', path: '/safeguarding', icon: '🛡️' },
    ].filter(l => l.name !== current)

    return (
        <section className="related-parish-links">
            <div className="container">
                <h2 className="section-title">Explore Our Parish</h2>
                <div className="related-grid">
                    {links.map(link => (
                        <Link key={link.name} to={link.path} className="related-link-card">
                            <div className="related-link-icon">{link.icon}</div>
                            <h4>{link.name}</h4>
                            <span>Visit Page →</span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
