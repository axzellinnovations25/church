import PageHero from '../components/PageHero'

const prayerItems = [
    { title: 'Ignatian Prayer Group', body: 'Praying with the Sunday Mass readings. Meetings are held fortnightly from 7.00pm to 8.30pm during term time and can be attended online or in person. Contact Carol on 07730 813847.' },
    { title: 'Charismatic Renewal', body: 'Retreat details will be posted when available. The parish material references CHARIS UK for this stream of renewal.' },
    { title: 'Rosary', body: 'Fridays at 6.00pm in Malayali, and Saturdays after the 9.00am Mass. All are welcome.' },
    { title: 'Exposition and Rosary', body: 'Every second Friday from 4.00pm to 5.45pm.' },
    { title: 'Stations of the Cross', body: 'During Lent at the Cathedral and Coedpoeth. See the weekly newsletter for published times.' },
]

export default function PrayerDevotionsPage() {
    return (
        <div>
            <PageHero title="Prayer & Devotions" subtitle="Regular prayer opportunities that deepen the spiritual life of Cathedral parish" centered={true} />
            <section className="section">
                <div className="container">
                    <div className="grid-2">
                        {prayerItems.map((item) => (
                            <div key={item.title} className="content-card">
                                <h3>{item.title}</h3>
                                <p>{item.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
