import PageHero from '../components/PageHero'
import './SchoolsPage.css'

const schools = [
    {
        title: "St Mary's Catholic Primary School",
        website: 'https://stmarys-wrexham.co.uk',
        websiteLabel: 'stmarys-wrexham.co.uk',
        phone: '01978 352406',
        phoneHref: 'tel:01978352406',
    },
    {
        title: "St Joseph's Catholic and Anglican High School",
        website: 'https://stjosephs.wales',
        websiteLabel: 'stjosephs.wales',
        phone: '01978 360310',
        phoneHref: 'tel:01978360310',
    },
]

export default function SchoolsPage() {
    return (
        <div className="schools-page">
            <PageHero title="Schools Links" subtitle="Parish-linked Catholic schools and admissions guidance" centered={true} />
            <section className="section">
                <div className="container schools-content">
                    <div className="schools-note">
                        <h3>Important Note</h3>
                        <p>Please follow the instructions on each school&apos;s own website regarding admissions procedures.</p>
                    </div>
                    <div className="schools-grid">
                        {schools.map((school) => (
                            <article key={school.title} className="school-card">
                                <h3>{school.title}</h3>
                                <dl className="school-contact-list">
                                    <div className="school-contact-row">
                                        <dt>Telephone</dt>
                                        <dd><a href={school.phoneHref}>{school.phone}</a></dd>
                                    </div>
                                    <div className="school-contact-row">
                                        <dt>Website</dt>
                                        <dd>
                                            <a href={school.website} target="_blank" rel="noopener noreferrer">
                                                {school.websiteLabel}
                                            </a>
                                        </dd>
                                    </div>
                                </dl>
                                <p className="school-guidance">Visit the school website for admissions procedures and current guidance.</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
