import { ParishHero, ParishIntro, ParishInfoCards, ParishCTA, RelatedParishLinks } from '../components/parish/ParishSections'
import parishHeroImg from '../assets/parish-hero.jpg'

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
                image={parishHeroImg}
            />
            
            <ParishIntro 
                title="Welcome to St Mary's Cathedral"
                text="St Mary's Cathedral is more than just a magnificent building; it is a spiritual home for a diverse and welcoming community. Rooted in the Catholic faith, we strive to be a light for all through our worship, service, and commitment to love one another as Christ has loved us."
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
