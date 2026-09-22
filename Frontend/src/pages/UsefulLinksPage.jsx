import { Link } from 'react-router-dom'
import PageHero from '../components/PageHero'
import './UsefulLinksPage.css'

const categories = [
    {
        title: 'Diocese & Local',
        icon: 'DL',
        links: [
            { title: 'Diocese of Wrexham', desc: 'Official website for the Catholic Diocese of Wrexham.', url: 'https://www.wrexhamdiocese.org.uk/' },
            { title: 'North East Wales Multicultural Hub', desc: 'A community link referenced in the PPC Community Group material.', url: 'https://newmh.org.uk/' },
            { title: 'Churches Together', desc: 'Part of the community involvement links referenced in the parish material.', url: 'https://www.ctbi.org.uk/' },
        ],
    },
    {
        title: 'Schools',
        icon: 'SC',
        links: [
            { title: "St Mary's Catholic Primary School", desc: "Please follow the school's own instructions regarding admissions procedures.", url: 'https://stmarys-wrexham.co.uk' },
            { title: "St Joseph's Catholic and Anglican High School", desc: 'School information and admissions guidance.', url: 'https://stjosephs.wales' },
            { title: 'Schools Links Page', desc: 'A summary of school-related information on this website.', url: '/schools' },
        ],
    },
    {
        title: 'Prayer & Formation',
        icon: 'PF',
        links: [
            { title: 'Universalis', desc: 'Daily Mass readings, Liturgy of the Hours, and spiritual resources.', url: 'https://universalis.com/' },
            { title: 'EWTN', desc: 'Global Catholic television, radio, and news network.', url: 'https://www.ewtn.com/' },
            { title: 'CatholicCulture.org', desc: 'Resources for liturgy, Church history, saints, and Catholic life.', url: 'https://www.catholicculture.org/' },
        ],
    },
    {
        title: 'Charities & Organisations',
        icon: 'CO',
        links: [
            { title: 'CAFOD', desc: 'Catholic Agency for Overseas Development supporting global relief and development.', url: 'https://cafod.org.uk/' },
            { title: "Catholic Children's Society", desc: 'Supporting disadvantaged children and families.', url: 'https://www.cathchild.org.uk/' },
            { title: 'St Vincent de Paul Society', desc: 'Voluntary organisation dedicated to tackling poverty and supporting those in need.', url: 'https://www.svp.org.uk/' },
            { title: 'CHARIS', desc: 'Charismatic renewal resource referenced in the parish prayer material.', url: 'https://www.charisuk.com/' },
        ],
    },
]

export default function UsefulLinksPage() {
    return (
        <div className="links-page">
            <PageHero title="Useful Links" subtitle="A curated collection of resources, organisations, and information for our Catholic community." centered={true} />

            <section className="section">
                <div className="container">
                    <div className="links-summary-grid">
                        <div className="links-feature-card">
                            <img
                                className="links-feature-image"
                                src="/leadership/bishop-peter.jfif"
                                alt="Bishop Peter Brignall"
                            />
                            <h2 className="links-feature-title">Diocese of Wrexham</h2>
                            <p className="links-feature-desc">Access diocesan news, pastoral letters, pilgrimages, and official information from the Diocese of Wrexham.</p>
                            <a href="https://www.wrexhamdiocese.org.uk/" target="_blank" rel="noopener noreferrer" className="links-feature-btn">View Links →</a>
                        </div>
                        <div className="links-feature-card" style={{ background: 'var(--navy-light)' }}>
                            <div className="links-feature-icon">SF</div>
                            <h2 className="links-feature-title">Schools & Formation</h2>
                            <p className="links-feature-desc">Quick access to parish school links, faith resources, and useful formation websites.</p>
                            <Link to="/schools" className="links-feature-btn">View Links →</Link>
                        </div>
                    </div>

                    <div className="links-categories-container">
                        {categories.map((cat) => (
                            <div key={cat.title} className="links-category-card">
                                <h2 className="links-category-title">
                                    <span style={{ fontSize: '1.2em' }}>{cat.icon}</span>
                                    {cat.title}
                                </h2>
                                <ul className="links-list">
                                    {cat.links.map((link) => (
                                        <li key={link.title} className="links-item">
                                            <a href={link.url} className="links-link" target="_blank" rel="noopener noreferrer">
                                                <div className="link-external-icon">↗</div>
                                                <div className="link-content">
                                                    <h3 className="link-title">{link.title}</h3>
                                                    <p className="link-desc">{link.desc}</p>
                                                </div>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="suggestion-section">
                        <h2 className="suggestion-title">Have a Suggestion?</h2>
                        <p className="suggestion-desc">If you know of a valuable Catholic resource that should be added to our Useful Links page, please let us know.</p>
                        <Link to="/contact" className="btn-primary" style={{ padding: '14px 40px', borderRadius: '30px' }}>Contact Us</Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
