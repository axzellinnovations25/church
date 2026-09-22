import PageHero from '../components/PageHero'

const schools = [
    { title: "St Mary's Catholic Primary School", text: 'Website: https://stmarys-wrexham.co.uk. Telephone: 01978 352406. Please follow the school website for admissions procedures and current guidance.' },
    { title: "St Joseph's Catholic and Anglican High School", text: 'Website: https://stjosephs.wales. Please follow the school website for admissions procedures and current guidance.' },
]

export default function SchoolsPage() {
    return (
        <div>
            <PageHero title="Schools Links" subtitle="Parish-linked Catholic schools and admissions guidance" centered={true} />
            <section className="section">
                <div className="container content-stack">
                    <div className="content-card">
                        <h3>Important Note</h3>
                        <p>Please follow the instructions on each school&apos;s own website regarding admissions procedures.</p>
                    </div>
                    <div className="grid-2">
                        {schools.map((school) => (
                            <div key={school.title} className="content-card">
                                <h3>{school.title}</h3>
                                <p>{school.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
