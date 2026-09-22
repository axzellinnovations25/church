import PageHero from '../components/PageHero'

export default function ParkingPage() {
    return (
        <div>
            <PageHero title="Parking at the Cathedral" subtitle="Important parking guidance for clergy, parishioners, permit holders, and visitors" centered={true} />
            <section className="section">
                <div className="container content-stack">
                    <div className="content-card">
                        <h3>Who Can Use The Car Park</h3>
                        <p>The Cathedral car park is for clergy, parishioners, permit holders, and visitors attending functions.</p>
                    </div>
                    <div className="content-card">
                        <h3>Vehicle Registration</h3>
                        <p>It is important to register your vehicle details using the car park tablets situated in the Cathedral porch, hall, and Catholic Club.</p>
                        <p>Penalty notices will be issued automatically if cars are not registered or if the permitted stay is exceeded.</p>
                    </div>
                    <div className="content-card notice-card">
                        <h3>Please Note</h3>
                        <p>Clergy House is not responsible for addressing penalty notices. Vehicle owners should follow the instructions printed on the notice.</p>
                        <p>Please park responsibly, use designated spaces, and keep clear access for emergency vehicles.</p>
                    </div>
                </div>
            </section>
        </div>
    )
}
