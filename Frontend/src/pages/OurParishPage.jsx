import { ParishHero, ParishIntro, ParishInfoCards, ParishCTA, RelatedParishLinks } from '../components/parish/ParishSections'
import { siteImageUrl } from '../lib/siteImages'

const parishLifeCards = [
    {
        icon: '⛪',
        title: 'Parish Life',
        content: 'Discover the rich liturgical life, traditions, and community events that define our cathedral family.',
        link: '/about'
    },
    {
        icon: '🙏',
        title: 'Worship',
        content: 'Join us for daily Mass, Adoration, and specialized prayer services throughout the year.',
        link: '/mass-sacraments'
    },
    {
        icon: '🤝',
        title: 'Community',
        content: 'We offer support, friendship, and many opportunities to gather in faith and fellowship.',
        link: '/parish-groups'
    },
    {
        icon: '✨',
        title: 'Get Involved',
        content: 'Your talents and time are a gift to our parish. Explore the many ways you can serve the Cathedral.',
        link: '/contact'
    }
]

export default function OurParishPage() {
    return (
        <div className="parish-page">
            <ParishHero 
                title="Our Parish"
                subtitle="A vibrant community of faith, worship, and service in the heart of Wrexham"
                image={siteImageUrl('assets/parish-hero.jpg')}
            />
            
            <ParishIntro 
                title="Welcome to St Mary's Cathedral"
                text="Welcome to our parish which consists of the Cathedral Church of Our Lady of Sorrows, known as St Mary's Cathedral, and the Church of the Holy Family, Coedpoeth. The Cathedral is both the mother church of the Diocese of Wrexham and a living parish community serving worship, formation, pastoral care, and outreach."
            />

            <ParishInfoCards cards={parishLifeCards} columns={4} />

            <section className="section" style={{ background: '#fcfaf6', textAlign: 'center', padding: '60px 0' }}>
                <div className="container" style={{ maxWidth: '800px' }}>
                    <h2 className="section-title" style={{ fontSize: '1.8rem', marginBottom: '16px' }}>New to Our Parish?</h2>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-mid)', marginBottom: '24px', lineHeight: '1.6' }}>
                        Whether you are new to Wrexham, returning to the faith, or just visiting, we are delighted to have you with us. We invite you to join our community and register as a parishioner.
                    </p>
                </div>
            </section>

            <ParishCTA 
                title="Become Part of Our Family"
                description="Join our parish registration to receive updates and participate in community events."
                buttons={[
                    { text: 'Register as Parishioner', link: '/registration', primary: true },
                    { text: 'Contact Us', link: '/contact' }
                ]}
            />

            <RelatedParishLinks current="Our Parish" />
        </div>
    )
}
