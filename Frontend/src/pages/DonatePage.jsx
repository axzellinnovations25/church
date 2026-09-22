import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'
import Container from '../components/ui/Container'
import Section from '../components/ui/Section'
import './DonatePage.css'

const donationOptions = [
    { icon: 'OG', title: 'Offertory Giving', desc: 'Support the day-to-day running of the Cathedral through cash at Mass, the Dona machine, or regular standing orders.', amounts: 'Any amount' },
    { icon: 'BP', title: 'Building Project', desc: "Support the Cathedral's Anniversary Fund and the long-term renovation of the historic site.", amounts: 'Any amount' },
    { icon: 'MS', title: 'Mass Stipends', desc: 'Mass stipends and Foundation Masses may be offered with a suggested donation of GBP 10.', amounts: 'GBP 10 suggested' },
    { icon: 'FD', title: 'Funeral Donations', desc: 'Families may choose to support the Cathedral through funeral donations and memorial giving.', amounts: 'Any amount' },
    { icon: 'LG', title: 'Legacies', desc: 'You can remember the Cathedral in your will and leave a lasting legacy for future generations.', amounts: 'Planned gift' },
    { icon: 'GS', title: 'Grant Support', desc: 'Grant fund makers and community supporters also sustain parish life and renovation work.', amounts: 'Community support' },
]

const otherWays = [
    { title: 'Standing Order', desc: 'This is the parish preferred method for regular support and helps provide dependable income for ministry and maintenance.', btn: 'Contact Office' },
    { title: 'Gift Aid', desc: 'If you are a UK taxpayer, Gift Aid allows the parish to receive an extra 25p for every GBP 1 donated at no additional cost to you.', btn: 'Gift Aid Help' },
    { title: 'EasyFundraising', desc: 'If you shop online, many retailers will donate a percentage to the Cathedral when you nominate the parish through EasyFundraising.', btn: 'Learn More' },
]

export default function DonatePage() {
    return (
        <div>
            <PageHero icon="SM" title="Support Our Cathedral" subtitle="The Cathedral parish depends on donations from parishioners, visitors, and grant funders to sustain worship, outreach, maintenance, and future development." />

            <Section>
                <Container>
                    <h2 className="section-title">Ways to Donate</h2>
                    <div className="grid-3" style={{ marginTop: '40px' }}>
                        {donationOptions.map((option) => (
                            <div key={option.title} className="card donate-card">
                                <div className="donate-icon">{option.icon}</div>
                                <h3 className="donate-card-title">{option.title}</h3>
                                <p className="donate-card-desc">{option.desc}</p>
                                <p className="donate-amounts">Support: <span>{option.amounts}</span></p>
                                <Link to="/contact?subject=Donation%20Enquiry" className="btn-gold donate-btn">Ask How To Give</Link>
                            </div>
                        ))}
                    </div>
                </Container>
            </Section>

            <Section style={{ background: 'var(--off-white)' }}>
                <Container>
                    <div className="gift-aid-card">
                        <div className="gift-aid-left">
                            <h2 className="gift-aid-title"><span>i</span> Gift Aid</h2>
                            <p className="gift-aid-desc">If you are a UK taxpayer, the Cathedral can receive an extra 25p for every GBP 1 you donate, at no extra cost to you.</p>
                            <p className="gift-aid-desc">Signing up for Gift Aid is one of the simplest ways to strengthen parish finances and make every donation go further.</p>
                        </div>
                        <div className="gift-aid-right">
                            <h3 className="gift-aid-how">How it works:</h3>
                            <ul className="gift-aid-list">
                                <li>You must be a UK taxpayer</li>
                                <li>Complete a Gift Aid declaration</li>
                                <li>We claim 25p for every GBP 1 you donate</li>
                                <li>No additional cost to you</li>
                            </ul>
                            <Link to="/contact?subject=Gift%20Aid" className="btn-gold" style={{ marginTop: '16px' }}>Gift Aid Declaration Help</Link>
                        </div>
                    </div>
                </Container>
            </Section>

            <Section>
                <Container>
                    <h2 className="section-title">Other Ways to Give</h2>
                    <div className="grid-3" style={{ marginTop: '40px' }}>
                        {otherWays.map((item) => (
                            <div key={item.title} className="card other-way-card">
                                <h3 className="other-way-title">{item.title}</h3>
                                <p className="other-way-desc">{item.desc}</p>
                                <Link to="/contact?subject=Support%20the%20Cathedral" className="btn-outline" style={{ marginTop: '16px', fontSize: '0.82rem', padding: '8px 20px' }}>{item.btn}</Link>
                            </div>
                        ))}
                    </div>
                    <div className="content-card notice-card" style={{ marginTop: '24px' }}>
                        <h3>Supporting The Cathedral</h3>
                        <p>The Cathedral parish depends on donations from parishioners, visitors, and grant funders for daily ministry, maintenance, and development projects. Thank you for contributing in any way you can.</p>
                    </div>
                </Container>
            </Section>

            <Section style={{ background: 'var(--off-white)' }}>
                <Container style={{ textAlign: 'center' }}>
                    <h2 className="section-title">Questions About Donating?</h2>
                    <p className="section-subtitle">If you have questions about supporting the Cathedral, Gift Aid, legacies, or the building project, please get in touch with the parish office.</p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <Link to="/contact" className="btn-primary">Contact Us</Link>
                        <a href="tel:01978263943" className="btn-outline">01978 263943</a>
                    </div>
                </Container>
            </Section>
        </div>
    )
}
