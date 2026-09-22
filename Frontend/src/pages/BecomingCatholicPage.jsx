import PageHero from '../components/PageHero'
import { Link } from 'react-router-dom'

export default function BecomingCatholicPage() {
    return (
        <div>
            <PageHero title="Becoming a Catholic" subtitle="RCIA and enquiry support for those exploring the Catholic faith" centered={true} />
            <section className="section">
                <div className="container content-stack">
                    <div className="content-card">
                        <h3>RCIA</h3>
                        <p>RCIA, the Rite of Christian Initiation of Adults, is the sacramental journey by which people exploring faith in Jesus Christ enter into full communion with the Catholic Church.</p>
                    </div>
                    <div className="content-card">
                        <h3>How The Parish Programme Works</h3>
                        <p>The Cathedral parish offers an RCIA group with a series of meetings that normally begins in early October, with reception into the Catholic faith at Easter.</p>
                        <p>If you would like to know more about the Catholic faith, please contact the Cathedral office in the first instance and you will be put in touch with the RCIA coordinator.</p>
                    </div>
                    <div className="contact-strip">
                        <h3 style={{ marginBottom: '12px', fontFamily: 'Playfair Display, serif' }}>Contact</h3>
                        <p>Email: secretarywrexhamcathedral@rcdwxm.org.uk</p>
                        <p style={{ marginTop: '8px' }}>Telephone: 01978 263943</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <Link to="/contact?subject=Becoming a Catholic" className="btn-gold">Ask About RCIA</Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
