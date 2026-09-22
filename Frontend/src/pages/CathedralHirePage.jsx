import PageHero from '../components/PageHero'
import { Link } from 'react-router-dom'

export default function CathedralHirePage() {
    return (
        <div>
            <PageHero title="Cathedral Hire" subtitle="Information about hiring the Cathedral for suitable events" centered={true} />
            <section className="section">
                <div className="container content-stack">
                    <div className="content-card">
                        <h3>Available For Special Events</h3>
                        <p>The Cathedral is available for hire for special events such as concerts and exhibitions, in addition to liturgical celebrations.</p>
                    </div>
                    <div className="content-card">
                        <h3>Hire Conditions</h3>
                        <p>A hire fee applies to help cover additional heating and lighting costs. Terms and conditions of hire will also apply.</p>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <Link to="/contact?subject=Cathedral Hire Enquiry" className="btn-gold">Enquire About Hire</Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
