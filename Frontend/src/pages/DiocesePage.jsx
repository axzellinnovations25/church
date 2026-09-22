import { ParishHero, ParishIntro, ParishInfoCards, ParishCTA } from '../components/parish/ParishSections'
import './DiocesePage.css'

export default function DiocesePage() {
    const resourceCards = [
        {
            icon: 'DN',
            title: 'Diocesan News',
            content: 'Follow diocesan news, pilgrimages, parish updates, and wider Church announcements through Cathedral and diocesan communications.',
            link: '/news-events'
        },
        {
            icon: 'PL',
            title: 'Pastoral Leadership',
            content: 'Learn more about the bishop, Cathedral clergy, deacons, and the pastoral mission that serves communities across North Wales.',
            link: '/about'
        },
        {
            icon: 'CE',
            title: 'Catholic Education',
            content: 'St Marys Catholic Primary School and St Josephs Catholic and Anglican High School are part of the wider faith life of the diocese.',
            link: '/links'
        },
        {
            icon: 'SG',
            title: 'Safeguarding',
            content: 'Safeguarding is everyones business, and the Cathedral is committed to providing a safe environment for all.',
            link: '/safeguarding'
        }
    ]

    const parishDirectoryCards = [
        {
            icon: 'CP',
            title: 'Cathedral Parish',
            content: 'St Marys Cathedral Parish includes the Cathedral in Wrexham and the Church of the Holy Family in Coedpoeth.',
            link: '/parish'
        },
        {
            icon: 'PC',
            title: 'Parish Pastoral Council',
            content: 'The PPC supports building, finance, formation, pastoral care, communications, fundraising, community cohesion, and youth ministry.',
            link: '/parish-council'
        },
        {
            icon: 'ML',
            title: 'Mass And Parish Life',
            content: 'Mass times, prayer groups, sacramental preparation, and parish activities root diocesan life in worship and service.',
            link: '/mass-times'
        }
    ]

    return (
        <div className="diocese-page">
            <ParishHero
                title="Diocese of Wrexham"
                subtitle="Information, resources, and pastoral life from the Catholic Diocese of Wrexham."
                image="https://images.unsplash.com/photo-1548625313-0404975d49bb?q=80&w=1600"
                breadcrumb="Diocese"
            />

            <ParishIntro
                title="About the Diocese"
                text="The Diocese of Wrexham serves Catholic communities across North Wales. St Mary's Cathedral is the mother church of the diocese and the episcopal seat of Bishop Peter Brignall. Cathedral life is supported by Fr Nicolas Enzama, Deacons Michael Schoonjans and Steve Davies, the Sisters of the Holy Family Convent, and the wider parish community."
            />

            <section className="bishop-section">
                <div className="container bishop-container">
                    <div className="bishop-card">
                        <img
                            className="bishop-image"
                            src="/leadership/bishop-peter.jfif"
                            alt="Bishop Peter Brignall"
                        />
                        <h3 className="bishop-name">Bishop Peter Brignall</h3>
                        <div className="bishop-title">Bishop of Wrexham</div>
                    </div>
                    <div className="bishop-content">
                        <h2>Diocesan Leadership</h2>
                        <p>
                            The bishop provides spiritual leadership and pastoral care for the whole Diocese of Wrexham. At Cathedral level, that leadership is lived out with clergy, deacons, sisters, schools, volunteers, and parish groups serving communities across North Wales.
                        </p>
                        <ul className="bishop-list">
                            <li>Leading diocesan worship, celebrations, and pastoral initiatives</li>
                            <li>Supporting clergy, religious, schools, and parish communities</li>
                            <li>Encouraging safeguarding, formation, and Catholic witness</li>
                            <li>Working with the Cathedral community as the mother church of the diocese</li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <h2 className="section-title">Diocesan Resources</h2>
                    <p className="section-subtitle">Access important information, links, and key areas of diocesan life</p>
                    <ParishInfoCards cards={resourceCards} columns={2} />
                </div>
            </section>

            <section className="section" style={{ backgroundColor: '#f8f9fa' }}>
                <div className="container">
                    <h2 className="section-title">Parish And Community Life</h2>
                    <p className="section-subtitle">Explore some of the ways Cathedral parish life supports the wider diocese</p>
                    <ParishInfoCards cards={parishDirectoryCards} columns={3} />
                </div>
            </section>

            <ParishCTA
                title="Stay Connected with the Diocese"
                description="For more detailed information, diocesan news, and key parish updates, please explore the Cathedral website or contact the parish office."
                buttons={[
                    { text: 'Visit Diocese Website', link: 'https://www.wrexhamdiocese.org.uk/', primary: true },
                    { text: 'Contact Parish Office', link: '/contact', primary: false }
                ]}
            />
        </div>
    )
}
