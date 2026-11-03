import { useQuery } from '@tanstack/react-query'
import { ParishHero, ParishIntro, ParishMembers, ParishCTA, RelatedParishLinks } from '../components/parish/ParishSections'
import wrecsam2029Image from '../assets/wrecsam-2029-city-of-culture.png'
import { getBackendUrl } from '../lib/auth'
import { publicQueries } from '../lib/publicData'
import './ParishCouncilPage.css'

const responsibilities = [
    { icon: 'PM', title: 'Pastoral Mission', content: 'Support the spiritual and practical life of the parish through prayerful consultation with the Parish Priest and the wider community.' },
    { icon: 'WG', title: 'Working Groups', content: 'Coordinate work across buildings, finance, formation, pastoral care, communications, income generation, community cohesion, and youth ministry.' },
    { icon: 'LC', title: 'Listening & Communication', content: 'Listen to parishioners, share information clearly, identify pastoral priorities, and help turn agreed plans into practical action.' },
]

const communityPartners = [
    { name: 'North Wales Interfaith Group', initials: 'IF', description: 'Interfaith dialogue and shared community understanding.' },
    { name: 'North Wales Multicultural Hub', initials: 'MH', description: 'Culture, inclusion, equality, and community connection.', url: 'https://racecouncilcymru.org.uk/rcc-multicultural-hubs' },
    { name: 'WCBC Community Cohesion Team', initials: 'CC', description: 'Local support for cohesion and participation across Wrexham.' },
    { name: 'Together Creating Communities', initials: 'TCC', description: 'Community organising, leadership, and collective action.', url: 'https://tcc-wales.org.uk/' },
    { name: 'EGIN Environmental Trust', initials: 'EG', description: 'Environmental learning and support for our Youth Group.', url: 'https://egin.org.uk/' },
]

export default function ParishCouncilPage() {
    const { data: councilMembers = [], isPending: isLoadingMembers } = useQuery(publicQueries.councilMembers)

    return (
        <div className="parish-page parish-council-page">
            <ParishHero title="Pastoral Parish Council" subtitle="Supporting the pastoral and community life of the Cathedral parish" image="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1600" breadcrumb="Pastoral Parish Council" />
            <ParishIntro title="Leadership Through Service" text="The Pastoral Parish Council supports the life and mission of St Mary's Cathedral through prayerful consultation, practical leadership, and service. It helps the parish respond to pastoral needs, formation, communications, safeguarding, community life, and future planning." />
            <ParishMembers members={councilMembers.map(member => ({
                ...member,
                photo: member.photo_url ? getBackendUrl(member.photo_url) : null,
            }))} isLoading={isLoadingMembers} />

            <section className="section council-responsibilities-section">
                <div className="container">
                    <div className="council-section-heading">
                        <p className="council-kicker">How we serve</p>
                        <h2>Core Responsibilities</h2>
                    </div>
                    <div className="council-responsibilities-grid">
                        {responsibilities.map((responsibility) => (
                            <article key={responsibility.title} className="council-responsibility-card">
                                <span className="council-card-icon" aria-hidden="true">{responsibility.icon}</span>
                                <h3>{responsibility.title}</h3>
                                <p>{responsibility.content}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section council-community-section">
                <div className="container">
                    <div className="council-community-intro">
                        <p className="council-kicker">Working across Wrexham</p>
                        <h2>Community Involvement</h2>
                        <p>We are active members of the North Wales Interfaith Group and the North Wales Multicultural Hub and are supported by the Community Cohesion Team of Wrexham County Borough Council.</p>
                        <p>We are also members of TCC (Together Creating Communities). Our Youth Group is supported by TCC and the EGIN Environmental Trust.</p>
                        <p>These relationships provide a platform for sharing experiences, interests, and concerns related to life in Wrexham, helping our parish listen, learn, and contribute constructively.</p>
                    </div>

                    <div className="community-partner-grid" aria-label="Community organisations working with the Pastoral Parish Council">
                        {communityPartners.map((partner) => {
                            const content = (
                                <>
                                    <span className="community-partner-mark" aria-hidden="true">{partner.initials}</span>
                                    <span className="community-partner-copy">
                                        <strong>{partner.name}</strong>
                                        <small>{partner.description}</small>
                                    </span>
                                    {partner.url ? <span className="community-partner-arrow" aria-hidden="true">↗</span> : null}
                                </>
                            )

                            return partner.url ? (
                                <a key={partner.name} className="community-partner-card" href={partner.url} target="_blank" rel="noopener noreferrer">{content}</a>
                            ) : (
                                <div key={partner.name} className="community-partner-card">{content}</div>
                            )
                        })}
                    </div>
                </div>
            </section>

            <section className="section city-culture-section">
                <div className="container city-culture-card">
                    <div className="city-culture-image-wrap">
                        <img src={wrecsam2029Image} alt="Wrecsam 2029 UK City of Culture bid community campaign" />
                    </div>
                    <div className="city-culture-copy">
                        <p className="council-kicker">Supporting our city</p>
                        <h2>Wrecsam 2029</h2>
                        <p>The Pastoral Parish Council supports Wrexham's bid to become UK City of Culture 2029. The community-led campaign celebrates local creativity, heritage, inclusion, and the people who make Wrexham distinctive.</p>
                        <a href="https://wrecsam2029.wales/en_gb/" target="_blank" rel="noopener noreferrer" className="city-culture-link">Explore the Wrecsam 2029 bid <span aria-hidden="true">↗</span></a>
                    </div>
                </div>
            </section>

            <section className="council-principle-section">
                <div className="container">
                    <blockquote>“To give witness to the truth, to save and not to judge, to serve and not to be served.”</blockquote>
                    <p>A guiding principle for the Council's service to the parish and wider community.</p>
                </div>
            </section>

            <ParishCTA title="Get in Touch with the Council" description="Do you have suggestions or concerns regarding parish life? The Pastoral Parish Council is here to listen and serve our community." buttons={[{ text: 'Contact Parish Office', link: '/contact', primary: true }]} />
            <RelatedParishLinks current="Pastoral Parish Council" />
        </div>
    )
}
