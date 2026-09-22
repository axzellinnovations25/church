import { Link } from 'react-router-dom'
import './Sacraments.css'
import baptismImg from '../../assets/baptism-hero.jpg'
import reconciliationImg from '../../assets/reconciliation-hero.jpg'

export function SacramentHero({ title, subtitle, image }) {
    return (
        <section className="sacrament-hero" style={{ backgroundImage: `url(${image})` }}>
            <div className="container sacrament-hero-content">
                <div className="section-label" style={{ color: 'var(--gold-light)' }}>Sacraments</div>
                <h1 className="sacrament-hero-title">{title}</h1>
                <p className="sacrament-hero-subtitle">{subtitle}</p>
            </div>
        </section>
    )
}

export function SacramentIntro({ title, text }) {
    return (
        <section className="sacrament-intro">
            <div className="container intro-inner">
                <h2 className="section-title">{title}</h2>
                <p className="intro-text">{text}</p>
            </div>
        </section>
    )
}

export function SacramentInfoCards({ cards }) {
    return (
        <section className="sacrament-info-cards">
            <div className="container">
                <div className="grid-2">
                    {cards.map((card, index) => (
                        <div key={index} className="sacrament-info-card">
                            <h3>{card.title}</h3>
                            <p>{card.content}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export function SacramentSchedule({ title, content }) {
    return (
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
            <div className="schedule-box">
                <div className="schedule-title">{title}</div>
                <p className="text-navy" style={{ fontWeight: 600 }}>{content}</p>
            </div>
        </div>
    )
}

export function SacramentSteps({ title, steps }) {
    return (
        <section className="sacrament-steps">
            <div className="container">
                <h2 className="section-title">{title}</h2>
                <div className="steps-container" style={{ marginTop: '48px' }}>
                    {steps.map((step, index) => (
                        <div key={index} className="step-card">
                            <div className="step-number">{index + 1}</div>
                            <div className="step-content">
                                <h3>{step.title}</h3>
                                <p>{step.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export function SacramentCTA({ title, description, buttonText, link }) {
    return (
        <section className="sacrament-cta">
            <div className="container">
                <h2>{title}</h2>
                <p>{description}</p>
                <Link to={link} className="btn-gold">
                    {buttonText}
                </Link>
            </div>
        </section>
    )
}

export function RelatedSacraments({ current }) {
    const sacraments = [
        { name: 'Baptism', path: '/baptism', image: baptismImg },
        { name: 'Confirmation', path: '/confirmation', image: 'https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=800' },
        { name: 'Marriage', path: '/marriage', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800' },
        { name: 'Reconciliation', path: '/reconciliation', image: reconciliationImg },
    ].filter(s => s.name !== current)

    return (
        <section className="related-sacraments">
            <div className="container">
                <h2 className="section-title">Other Sacraments</h2>
                <div className="related-grid" style={{ marginTop: '48px' }}>
                    {sacraments.map(sac => (
                        <Link key={sac.name} to={sac.path} className="related-card">
                            <img src={sac.image} alt={sac.name} />
                            <span>{sac.name}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
