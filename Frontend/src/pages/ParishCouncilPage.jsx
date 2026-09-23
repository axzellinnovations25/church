import { ParishHero, ParishIntro, ParishMembers, ParishCTA, RelatedParishLinks } from '../components/parish/ParishSections'
import { useQuery } from '@tanstack/react-query'
import { getBackendUrl } from '../lib/auth'
import { publicQueries } from '../lib/publicData'

const responsibilities = [
    { title: 'Pastoral Parish Council', content: 'The PPC supports the spiritual and practical life of the parish in consultation with the Parish Priest and wider community.' },
    { title: 'Sub-Committees', content: 'Current areas include Building, Finance, Spiritual Formation, Pastoral Care, Communications, Fundraising, Community Cohesion, and Youth Group.' },
    { title: 'Community Group', content: 'The PPC Community Group encourages community involvement, integration, equality, culture, and social justice in Wrexham and beyond.' },
]

export default function ParishCouncilPage() {
    const { data: councilMembers = [], isPending: isLoadingMembers } = useQuery(publicQueries.councilMembers)

    return (
        <div className="parish-page">
            <ParishHero title="Parish Council" subtitle="Supporting the pastoral and community life of the cathedral" image="https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1600" breadcrumb="Parish Council" />
            <ParishIntro title="Leadership Through Service" text="The Parish Pastoral Council supports the life and mission of St Mary's Cathedral through prayerful consultation, practical leadership, and service. It helps the parish respond to pastoral needs, community life, formation, communications, safeguarding, and future planning." />
            <ParishMembers members={councilMembers.map(member => ({
                ...member,
                photo: member.photo_url ? getBackendUrl(member.photo_url) : null,
            }))} isLoading={isLoadingMembers} />

            <section className="section" style={{ background: '#fcfaf6' }}>
                <div className="container">
                    <h2 className="section-title">Core Responsibilities</h2>
                    <div className="grid-3" style={{ marginTop: '48px' }}>
                        {responsibilities.map((res) => (
                            <div key={res.title} className="card" style={{ textAlign: 'center' }}>
                                <h3 className="text-navy" style={{ marginBottom: '16px', fontFamily: 'Playfair Display' }}>{res.title}</h3>
                                <p className="text-mid" style={{ lineHeight: '1.6' }}>{res.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container content-grid">
                    <div className="content-card">
                        <h3>Community Involvement</h3>
                        <p>
                            The PPC Community Group is dedicated to fostering a safe and respectful environment for all individuals and communities within the parish. It provides a platform for sharing experiences, interests, and concerns related to life in Wrexham.
                        </p>
                        <p>
                            It also promotes integration, cohesion, equality, culture, and social justice through collaboration with other organisations and community groups.
                        </p>
                    </div>
                    <div className="content-card">
                        <h3>Additional Notes</h3>
                        <p>
                            The PowerPoint lists resignations for 2026 as Elizabeth Roberts and Helen Schoonjans.
                        </p>
                        <p>
                            The group&apos;s guiding principles are inspired by the Church&apos;s call "to give witness to the truth, to save and not to judge, to serve and not to be served."
                        </p>
                    </div>
                </div>
            </section>

            <ParishCTA title="Get in Touch with the Council" description="Do you have suggestions or concerns regarding parish life? We are here to listen and serve our community." buttons={[{ text: 'Contact Parish Office', link: '/contact', primary: true }]} />
            <RelatedParishLinks current="Parish Council" />
        </div>
    )
}
