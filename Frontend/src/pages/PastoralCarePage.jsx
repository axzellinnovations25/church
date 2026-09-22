import PageHero from '../components/PageHero'
import { Link } from 'react-router-dom'

export default function PastoralCarePage() {
    return (
        <div>
            <PageHero title="Pastoral Care" subtitle="Home visits, Holy Communion for the sick, and support for housebound parishioners" centered={true} />
            <section className="section">
                <div className="container content-stack">
                    <div className="content-card">
                        <h3>Home And Hospital Visits</h3>
                        <p>Holy Communion can be taken to people who are sick or housebound, whether temporarily or permanently.</p>
                        <p>Extraordinary Ministers of the Eucharist, together with the Priest and Deacons, can visit people in their own homes, care homes, or hospitals.</p>
                    </div>
                    <div className="content-card">
                        <h3>Information To Provide</h3>
                        <ul className="bullet-list">
                            <li>Name and address of the person needing a visit</li>
                            <li>Contact telephone number for the person and main contact</li>
                            <li>Any helpful practical information about the visit location</li>
                        </ul>
                    </div>
                    <div className="contact-strip">
                        <h3 style={{ marginBottom: '12px', fontFamily: 'Playfair Display, serif' }}>Request A Visit</h3>
                        <p>Email secretarywrexhamcathedral@rcdwxm.org.uk to arrange a home, care home, or hospital visit.</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <Link to="/contact?subject=Pastoral Care Request" className="btn-gold">Request Pastoral Care</Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
