import { Link } from 'react-router-dom'
import { ParishHero, ParishIntro, ParishCTA, RelatedParishLinks } from '../components/parish/ParishSections'
import './FundraisingPage.css'

const creativeFundraising = [
    {
        icon: 'GA',
        title: 'Gift Aid',
        content: 'If you are a UK taxpayer, Gift Aid can add 25p to every £1 you donate without costing you anything extra.',
        label: 'Get Gift Aid help',
        url: '/contact?subject=Gift%20Aid',
        internal: true,
    },
    {
        icon: 'EF',
        title: 'Easyfundraising',
        content: 'Raise free donations when you shop online. Participating retailers give a portion of your purchase to your chosen cause.',
        label: 'Visit Easyfundraising',
        url: 'https://www.easyfundraising.org.uk/',
    },
    {
        icon: 'GF',
        title: 'GoFundMe',
        content: "Support and share the Cathedral's public campaign for urgent repairs and a more sustainable building.",
        label: 'View the Cathedral campaign',
        url: 'https://www.gofundme.com/f/help-save-wrexhams-cathedral-ptjxb',
    },
    {
        icon: 'VC',
        title: 'Vintage Cash Cow',
        content: 'Turn unwanted jewellery, watches, silver, cameras, coins, and other vintage items into funds that can be donated to the parish.',
        label: 'See how it works',
        url: 'https://www.vintage.com/',
    },
    {
        icon: 'SB',
        title: 'Sell Your Books',
        content: 'Use WeBuyBooks to value and sell unwanted books, CDs, DVDs, and games, then donate the proceeds to support the Cathedral.',
        label: 'Sell books online',
        url: 'https://www.webuybooks.co.uk/sell-books/',
    },
]

const supportOutcomes = [
    'Daily parish operations and liturgy',
    'Maintenance of Cathedral buildings',
    'Youth and family formation',
    'Building projects and future development',
]

function FundraisingLink({ item }) {
    const content = <>{item.label}<span aria-hidden="true">→</span></>

    if (item.internal) {
        return <Link to={item.url} className="income-card-link">{content}</Link>
    }

    return <a href={item.url} target="_blank" rel="noopener noreferrer" className="income-card-link">{content}</a>
}

export default function FundraisingPage() {
    return (
        <div className="parish-page fundraising-page">
            <ParishHero
                title="Fundraising & Income Generation"
                subtitle="Practical and creative ways to support our parish mission"
                image="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=1600"
                breadcrumb="Fundraising & Income Generation"
            />
            <ParishIntro
                title="Building a Legacy of Care"
                text="The mission of St Mary's Cathedral depends on the generosity and collaborative spirit of parishioners. Every pound raised helps support worship, community life, maintenance, and the future of this historic Cathedral site."
            />

            <section className="section income-overview-section">
                <div className="container income-overview-grid">
                    <article className="income-overview-card">
                        <span className="income-overview-icon" aria-hidden="true">EV</span>
                        <div>
                            <h2>Fundraising Events</h2>
                            <p>Seasonal fairs, raffles, cake sales, concerts, exhibitions, and social events bring the parish together while generating valuable support.</p>
                        </div>
                    </article>
                    <article className="income-overview-card">
                        <span className="income-overview-icon" aria-hidden="true">ID</span>
                        <div>
                            <h2>Parish Ideas</h2>
                            <p>Parishioners are invited to join the fundraising group, suggest an income-generating idea, volunteer, or organise an approved event.</p>
                        </div>
                    </article>
                </div>
            </section>

            <section className="section creative-fundraising-section">
                <div className="container">
                    <div className="income-section-heading">
                        <p className="income-kicker">More ways to help</p>
                        <h2>Creative Fundraising</h2>
                        <p>Small, practical actions can create dependable extra income for the Cathedral throughout the year.</p>
                    </div>
                    <div className="creative-income-grid">
                        {creativeFundraising.map((item) => (
                            <article key={item.title} className="income-method-card">
                                <span className="income-method-icon" aria-hidden="true">{item.icon}</span>
                                <h3>{item.title}</h3>
                                <p>{item.content}</p>
                                <FundraisingLink item={item} />
                            </article>
                        ))}
                    </div>
                    <p className="income-scheme-note">For parish-specific account details or help directing proceeds to St Mary's Cathedral, please contact the parish office before completing a transaction.</p>
                </div>
            </section>

            <section className="section legacy-section">
                <div className="container legacy-panel">
                    <div className="legacy-mark" aria-hidden="true">LW</div>
                    <div className="legacy-content">
                        <p className="income-kicker">A gift for future generations</p>
                        <h2>Legacies in Wills</h2>
                        <p>A gift in your will can help sustain worship, parish life, outreach, and the Cathedral building for generations to come. Gifts of every size can make a lasting difference.</p>
                        <p>For a confidential conversation about remembering St Mary's Cathedral in your will, please contact the parish office. The parish cannot provide legal advice, so you may also wish to speak with a solicitor.</p>
                        <Link to="/contact?subject=Legacy%20Giving" className="legacy-button">Ask about legacy giving</Link>
                    </div>
                </div>
            </section>

            <section className="section support-impact-section">
                <div className="container support-impact-grid">
                    <div>
                        <p className="income-kicker">Your support in action</p>
                        <h2>How Support Helps</h2>
                        <p>Parish support strengthens both daily Cathedral life and long-term projects.</p>
                        <ul className="support-outcome-list">
                            {supportOutcomes.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                    </div>
                    <div className="support-action-card">
                        <h3>Make a Difference Today</h3>
                        <p>Choose a way to support that works for you, from one-off donations to regular giving.</p>
                        <Link to="/donate" className="btn-gold">Go to Donation Page</Link>
                    </div>
                </div>
            </section>

            <ParishCTA
                title="Get Involved in Fundraising & Income Generation"
                description="Have an idea for an event or another way to raise funds? We would love to hear from you."
                buttons={[{ text: 'Donate Now', link: '/donate', primary: true }, { text: 'Share an Idea', link: '/contact?subject=Fundraising%20Idea' }]}
            />
            <RelatedParishLinks current="Fundraising & Income Generation" />
        </div>
    )
}
