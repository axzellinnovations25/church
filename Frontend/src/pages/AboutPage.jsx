import PageHero from '../components/PageHero'
import Container from '../components/ui/Container'
import Section from '../components/ui/Section'
import PhotoGallery from '../components/PhotoGallery'
import { galleryImages } from '../lib/galleryImages'
import { siteImageUrl } from '../lib/siteImages'
import './AboutPage.css'

const values = [
    { icon: 'F', title: 'Faith', desc: 'Rooted in worship, prayer, the sacraments, and devotion.' },
    { icon: 'C', title: 'Community', desc: 'A welcoming Cathedral parish serving Wrexham and Coedpoeth.' },
    { icon: 'S', title: 'Service', desc: 'Committed to pastoral care, home visits, safeguarding, and volunteering.' },
    { icon: 'G', title: 'Growth', desc: 'Growing through formation, schools, RCIA, and parish life.' },
]

const staff = [
    { role: 'Bishop of Wrexham', name: 'Bishop Peter Brignall', title: 'Diocesan Bishop', bio: 'Episcopal leadership for Catholic communities across North Wales.', image: siteImageUrl('leadership/bishop-peter-brignall.jpg') },
    { role: 'Cathedral Dean', name: 'Canon Nicholas Enzama', title: 'Cathedral Dean and Parish Priest', bio: 'Pastoral leadership for the Cathedral parish and Coedpoeth from 13 October 2026.', image: siteImageUrl('leadership/fr-nicolas-enzama.jpg') },
    { role: 'Permanent Deacon', name: 'Deacon Michael Schoonjans', title: 'Serving the Cathedral parish and Coedpoeth', bio: 'Supporting liturgy, pastoral care, and parish outreach.', initials: 'MS' },
    { role: 'Permanent Deacon', name: 'Deacon Steve Davies', title: 'Serving the Cathedral parish and Coedpoeth', bio: 'Supporting liturgy, pastoral care, and parish outreach.', initials: 'SD' },
]

const historyTimeline = [
    {
        date: '1584',
        title: 'Faith Under Pressure',
        content: 'Saint Richard Gwyn was executed in Wrexham for his Catholic faith and remains a local witness to conscience and courage.',
    },
    {
        date: '1828',
        title: 'Catholic Worship Re-established',
        content: "Saint David's Chapel was built on King Street as the Catholic community grew and worship life became more visible.",
    },
    {
        date: '1857',
        title: "St Mary's Opens",
        content: "Edward Welby Pugin designed the church on Regent Street, which opened on 19 November 1857 and was dedicated to Our Lady of Sorrows. Richard Thompson funded the building, and the rose window was donated by his daughter.",
    },
    {
        date: '1907–1987',
        title: 'From Pro-cathedral to Cathedral',
        content: 'The church became the pro-cathedral in 1907 and was raised to cathedral status in 1987 with the creation of the Diocese of Wrexham.',
    },
]

export default function AboutPage() {
    return (
        <div className="about-page">
            <PageHero
                title="About St Mary's Cathedral"
                subtitle="Mother church of the Diocese of Wrexham and home to a welcoming parish community"
            />

            <div className="about-subnav">
                <Container>
                    <a href="#welcome">Welcome</a>
                    <a href="#leadership">Leadership</a>
                    <a href="#history">History</a>
                    <a href="#artefacts">Art</a>
                    <a href="#values">Values</a>
                    <a href="#mission">Mission</a>
                </Container>
            </div>

            <Section id="welcome">
                <Container className="about-history">
                    <div className="history-text">
                        <h2 className="about-heading">Croeso / Welcome</h2>
                        <p>
                            Welcome to our parish which consists of the Cathedral Church of Our Lady of Sorrows, known as St Mary&apos;s Cathedral, and the Church of the Holy Family, Coedpoeth.
                        </p>
                        <p>
                            The Cathedral is both the mother church of the Diocese of Wrexham and a living parish community serving worship, formation, pastoral care, and outreach.
                        </p>
                    </div>
                    <div className="history-image">
                        <img
                            src={siteImageUrl('cathedral-photo.png')}
                            alt="Cathedral exterior"
                        />
                    </div>
                </Container>
            </Section>

            <Section id="leadership" className="about-band">
                <Container>
                    <h2 className="section-title">Cathedral Leadership</h2>
                    <div className="leadership-grid">
                        {staff.map((person) => (
                            <div key={person.name} className="card staff-card">
                                <div className="staff-avatar">
                                    {person.image ? (
                                        <img src={person.image} alt={person.name} loading="lazy" />
                                    ) : (
                                        <span className="staff-initials" aria-hidden="true">{person.initials}</span>
                                    )}
                                </div>
                                <h3 className="staff-role">{person.role}</h3>
                                <p className="staff-name">{person.name}</p>
                                <p className="staff-title">{person.title}</p>
                                {person.bio ? <p className="staff-bio">{person.bio}</p> : null}
                            </div>
                        ))}
                    </div>
                    <div className="religious-communities content-card">
                        <div className="religious-communities-heading">
                            <span className="religious-communities-kicker">Prayer, presence and service</span>
                            <h3>Religious Communities</h3>
                            <p>Two religious communities share in the prayer, pastoral life and mission of the Cathedral parish and Coedpoeth.</p>
                        </div>
                        <div className="religious-community-grid">
                            <article className="religious-community">
                                <div className="religious-community-mark" aria-hidden="true">HF</div>
                                <div>
                                    <h4>Sisters of the Holy Family of Bordeaux</h4>
                                    <p>The Sisters of the Holy Family Convent have been part of the Cathedral parish for over 75 years. The present community includes Sr Maria, Sr Celine and Sr Sheila.</p>
                                    <a href="https://www.holyfamilybordeaux.org/" target="_blank" rel="noopener noreferrer">Visit the Holy Family of Bordeaux website <span aria-hidden="true">→</span></a>
                                </div>
                            </article>
                            <article className="religious-community">
                                <div className="religious-community-mark" aria-hidden="true">ESM</div>
                                <div>
                                    <h4>Missionary Congregation of the Evangelizing Sisters of Mary</h4>
                                    <p>In 2025, the parish welcomed Sr Triphosa, Sr Jacqueline and Sr Annalydia from the Missionary Congregation of the Evangelizing Sisters of Mary (MCESM).</p>
                                    <a href="https://www.mcesmm.org/" target="_blank" rel="noopener noreferrer">Visit the MCESM website <span aria-hidden="true">→</span></a>
                                </div>
                            </article>
                        </div>
                    </div>
                    <div className="content-card cathedral-people-card">
                        <h3>People of the Cathedral</h3>
                        <p>
                            The Cathedral is much more than a building. It is a community of clergy, deacons, religious sisters, families, schools, parish groups, volunteers and visitors who bring faith to life through worship, welcome and service.
                        </p>
                        <p>
                            Generations of local families worship alongside people who have made Wrexham their home from Poland, Italy, the Philippines and many other places. Readers, altar servers, musicians, catechists, extraordinary ministers, the SVP, hospitality teams, cleaners, gardeners and many others each contribute to the life and mission of the parish.
                        </p>
                    </div>
                </Container>
            </Section>

            <Section id="history">
                <Container>
                    <h2 className="section-title">History of the Cathedral</h2>
                    <ol className="about-timeline">
                        {historyTimeline.map((item) => (
                            <li key={item.date} className="about-timeline-item">
                                <div className="about-timeline-date">{item.date}</div>
                                <div className="about-timeline-card">
                                    <h3>{item.title}</h3>
                                    <p>{item.content}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                    <blockquote className="quote-panel about-quote">
                        <p>“This beautiful structure, which has attracted so much attention and caused so much admiration in the town, is one of the most beautiful specimens of church architecture in the Principality.”</p>
                        <cite>Wrexham Advertiser, 1857</cite>
                    </blockquote>
                </Container>
            </Section>

            <Section id="artefacts" className="about-band">
                <Container>
                    <h2 className="section-title">Art and Artefacts</h2>
                    <div className="about-gallery">
                        <PhotoGallery images={galleryImages.filter((img) => (
                            [
                                'Pieta Statue',
                                'Stained Glass Panel',
                                'Saint Richard Gwyn Artwork',
                                'Icon of Our Lady of Częstochowa',
                                'Santo Nino Display',
                            ].includes(img.title)
                        ))} />
                    </div>
                    <div className="content-grid" style={{ marginTop: '40px' }}>
                        <div className="content-card">
                            <h3>Stained Glass</h3>
                            <p>
                                The Cathedral&apos;s stained glass is one of its most striking artistic features, much of it produced by Hardman &amp; Co. in the late nineteenth century. The rose window portrays the sorrow of the Virgin Mary at the death of Jesus, and a more recent window by students from Wrexham Art College depicts Saint Richard Gwyn.
                            </p>
                        </div>
                        <div className="content-card">
                            <h3>Memorials And Sacred Objects</h3>
                            <p>
                                Highlights include the tomb of Ellen Thompson, a relic shrine of Saint Richard Gwyn, a memorial to Flight Lieutenant David Lord VC, the Polish icon of Our Lady of Częstochowa, a statue of Santo Niño, and the baptismal font.
                            </p>
                        </div>
                    </div>
                    <div style={{ marginTop: '22px' }}>
                        <a className="btn-outline" href="/gallery">View Photo Gallery</a>
                    </div>
                </Container>
            </Section>

            <Section>
                <Container>
                    <h2 className="section-title">Saint Richard Gwyn</h2>
                    <div className="content-card" style={{ marginTop: '40px' }}>
                        <h3>Wrexham&apos;s Martyr</h3>
                        <p>
                            Richard Gwyn was a Welsh schoolteacher known for his learning, poetry, wit, and steadfast Catholic faith during the upheaval of the Reformation. He was imprisoned several times and eventually executed in Wrexham in 1584 for remaining loyal to the Catholic Church and supporting missionary priests.
                        </p>
                        <p>
                            Witnesses remembered his calmness, forgiveness, and courage. He was canonised by Pope Paul VI in 1970 and remains a powerful example of conscience, integrity, and faith. The parish notes a commemorative Mass each year near 15 October.
                        </p>
                    </div>
                </Container>
            </Section>

            <Section id="values" className="about-band">
                <Container>
                    <h2 className="section-title">Our Values</h2>
                    <div className="grid-4" style={{ marginTop: '40px' }}>
                        {values.map((value) => (
                            <div key={value.title} className="card value-card">
                                <div className="value-icon">{value.icon}</div>
                                <h3 className="value-title">{value.title}</h3>
                                <p className="value-desc">{value.desc}</p>
                            </div>
                        ))}
                    </div>
                </Container>
            </Section>

            <section className="mission-banner" id="mission">
                <Container style={{ textAlign: 'center' }}>
                    <h2 className="mission-title">Our Mission</h2>
                    <p className="mission-quote">
                        To be a welcoming Cathedral parish, centred on Christ and the Eucharist, helping people grow in faith, prayer, service, and fellowship.
                    </p>
                </Container>
            </section>
        </div>
    )
}
