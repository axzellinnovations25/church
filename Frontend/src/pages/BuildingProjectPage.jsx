import { ParishHero, ParishIntro, ParishInfoCards, ParishTimeline, ParishCTA, RelatedParishLinks } from '../components/parish/ParishSections'

const projectCards = [
    {
        icon: 'P1',
        title: 'Priority Repairs',
        content: 'The Cathedral site is a diocesan priority, with urgent attention focused on the cathedral floor and the long-term restoration of this historic place of worship.'
    },
    {
        icon: 'P2',
        title: 'Heating Renewal',
        content: 'Stage 1 includes presbytery heating works, re-laying a new gas line, and disconnecting systems so future phases can proceed safely.'
    },
    {
        icon: 'P3',
        title: 'Floor And Asbestos Works',
        content: 'Stage 2 covers asbestos removal and installation of a new floor so the Cathedral can be secured for future generations.'
    },
    {
        icon: 'P4',
        title: 'Professional Oversight',
        content: 'Architects, engineers, surveyors, the Parish Pastoral Council, and the Cathedral Dean are working together to manage the programme responsibly.'
    }
]

const projectTimeline = [
    {
        date: 'Planning',
        title: 'Surveys And Design Work',
        content: 'The parish has invested in plans, designs, and professional advice to prepare a staged renovation programme across the Cathedral site.'
    },
    {
        date: 'Stage 1',
        title: 'Presbytery Heating',
        content: 'Heating renewal and associated gas-line works are intended to create a practical foundation for the wider restoration programme.'
    },
    {
        date: 'Stage 2',
        title: 'Floor Replacement',
        content: 'Asbestos removal and a new floor installation are planned as the next major stage in securing the building.'
    },
    {
        date: 'Funding',
        title: 'Grant Support And Parish Giving',
        content: 'The project has already secured significant support, including GBP 250,000 from the Albert Gubay Foundation and GBP 150,000 from a local funding organisation.'
    }
]

export default function BuildingProjectPage() {
    return (
        <div className="parish-page">
            <ParishHero 
                title="Building Project"
                subtitle="Preserving and future-proofing St Mary's Cathedral for generations to come"
                image="https://images.unsplash.com/photo-1548625361-195fe27741f2?q=80&w=1600"
                breadcrumb="Building Project"
            />
            
            <ParishIntro 
                title="A Vision for the Future"
                text="The Diocese of Wrexham is committed to a 5-to-10-year renovation plan for the Cathedral site. The aim is to restore and secure this historic place of worship through staged works that balance urgent repairs, professional planning, and sustainable funding."
            />

            <ParishInfoCards cards={projectCards} columns={2} />

            <ParishTimeline items={projectTimeline} />

            <ParishCTA 
                title="Support Our Heritage"
                description="Parishioner generosity, grant funding, and community support are helping the Cathedral move towards the next stage of renovation and long-term preservation."
                buttons={[
                    { text: 'Learn More', link: '/about', primary: true },
                    { text: 'Support the Project', link: '/donate' }
                ]}
            />

            <RelatedParishLinks current="Building Project" />
        </div>
    )
}
