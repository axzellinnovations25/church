import { SacramentHero, SacramentIntro, SacramentInfoCards, SacramentSteps, SacramentCTA } from '../components/sacraments/SacramentSections'

const communionCards = [
    { title: 'Who Can Join', content: 'The programme is open to baptised Catholic children in school year 3 or above.' },
    { title: 'Parish Requirement', content: 'Children should come from families registered in the parish who regularly practise their faith and attend Mass.' },
    { title: 'Programme Structure', content: 'Preparation includes First Reconciliation and usually runs from October until May.' },
    { title: 'Meeting Pattern', content: 'Meetings are held on a two-weekly cycle on Saturday mornings, and families are asked to commit to every session.' },
]

const communionSteps = [
    { title: 'Register In September', content: 'Programme registration normally takes place in September each year.' },
    { title: 'Attend Preparation Meetings', content: 'Families and children are expected to attend the full formation programme.' },
    { title: 'Prepare For Reconciliation', content: 'The programme also includes preparation for the Sacrament of Reconciliation.' },
    { title: 'Celebrate First Holy Communion', content: 'The celebration usually takes place in May at the end of the programme.' },
]

export default function FirstHolyCommunionPage() {
    return (
        <div className="sacrament-page">
            <SacramentHero title="First Holy Communion" subtitle="Preparation for children receiving Holy Communion for the first time" image="https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=1600" />
            <SacramentIntro title="Growing In Eucharistic Life" text="Cathedral parish prepares children and families for First Holy Communion through a structured programme of catechesis, prayer, and participation in parish life." />
            <SacramentInfoCards cards={communionCards} />
            <SacramentSteps title="Programme Journey" steps={communionSteps} />
            <SacramentCTA title="Want To Ask About Registration?" description="Please contact the parish office if you would like more information about the next programme." buttonText="Ask About First Holy Communion" link="/contact?subject=First Holy Communion Enquiry" />
        </div>
    )
}
