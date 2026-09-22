import { ParishHero, ParishIntro, ParishInfoCards, ParishCTA, RelatedParishLinks } from '../components/parish/ParishSections'

const policyCards = [
    { title: 'Safe Environment', content: 'The purpose of safeguarding is to provide a safe environment for everyone. All people should be valued, supported, and protected from harm.' },
    { title: "Everyone's Business", content: "Safeguarding is everyone's business across parish worship, pastoral care, youth ministry, sacramental preparation, and volunteering." },
    { title: 'Volunteer Requirements', content: 'Volunteers who have direct contact with children or vulnerable adults require a DBS check, even if they already hold one for another role.' },
    { title: 'Culture Of Care', content: 'The parish aims to be a respectful, welcoming, and responsible community where concerns can be raised promptly and taken seriously.' },
]

export default function SafeguardingPage() {
    return (
        <div className="parish-page">
            <ParishHero title="Policies & Safeguarding" subtitle="Protecting the wellbeing and safety of our entire parish community" image="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1600" breadcrumb="Safeguarding" />
            <ParishIntro title="Our Commitment to Safety" text="St Mary's Cathedral is committed to the safeguarding of all children, young people, and vulnerable adults. We believe everyone should be valued, supported, and protected from harm within parish life." />
            <ParishInfoCards cards={policyCards} columns={2} />

            <section className="section" style={{ background: '#fcfaf6' }}>
                <div className="container">
                    <div className="card" style={{ maxWidth: '800px', margin: '0 auto', borderLeft: '5px solid var(--gold)' }}>
                        <h2 className="text-navy" style={{ marginBottom: '24px' }}>Contact Our Safeguarding Officer</h2>
                        <p style={{ marginBottom: '24px' }}>If you have any concerns regarding the safety or wellbeing of a child or adult in the parish, please contact us immediately.</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <h4 style={{ color: 'var(--gold)', margin: 0, fontSize: '0.8rem', textTransform: 'uppercase' }}>Name</h4>
                                <p style={{ fontWeight: 700, fontSize: '1.2rem', margin: '4px 0 0' }}>Carol Bayliss</p>
                            </div>
                            <div>
                                <h4 style={{ color: 'var(--gold)', margin: 0, fontSize: '0.8rem', textTransform: 'uppercase' }}>Phone</h4>
                                <p style={{ fontWeight: 700, fontSize: '1.2rem', margin: '4px 0 0' }}>07730 813847</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <ParishCTA title="Need More Information?" description="Additional resources and guidance from the Diocese of Wrexham are also available." buttons={[{ text: 'Contact Safeguarding Officer', link: '/contact?subject=Safeguarding Enquiry', primary: true }]} />
            <RelatedParishLinks current="Safeguarding" />
        </div>
    )
}
