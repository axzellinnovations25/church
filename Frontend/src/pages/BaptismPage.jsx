import { SacramentHero, SacramentIntro, SacramentInfoCards, SacramentSteps, SacramentCTA, RelatedSacraments } from '../components/sacraments/SacramentSections'
import baptismHero from '../assets/baptism-hero.jpg'

const baptismCards = [
    { title: 'Who Can Apply', content: 'Infant or child Baptism is normally for children under the age of 7 where at least one parent is a baptised, regularly practising Catholic registered in the parish.' },
    { title: 'Older Children', content: 'Children or young people over 8 need to attend a preparation programme accompanied by an adult before a date is arranged.' },
    { title: 'Adult Baptism', content: 'Adult Baptism is prepared for through the RCIA journey for those becoming Catholic.' },
    { title: 'How To Begin', content: 'The process starts with the parish office, a Baptism request form, and attendance at the Baptism Preparation Programme.' },
]

const baptismSteps = [
    { title: 'Email The Parish Office', content: 'Begin with an enquiry to secretarywrexhamcathedral@rcdwxm.org.uk.' },
    { title: 'Complete The Form', content: 'The office will guide you through the initial request and details needed.' },
    { title: 'Attend Preparation', content: 'Attendance at the Baptism Preparation Programme is required.' },
    { title: 'Arrange The Date', content: 'After preparation, the parish will confirm the celebration arrangements.' },
]

export default function BaptismPage() {
    return (
        <div className="sacrament-page">
            <SacramentHero title="Baptism" subtitle="Preparation and reception of Baptism in Cathedral parish" image={baptismHero} />
            <SacramentIntro title="Sacrament of New Life" text="Baptism is the foundation of Christian life and the gateway to the other sacraments. Cathedral parish offers preparation for infants, children, young people, and adults according to age and circumstance." />
            <SacramentInfoCards cards={baptismCards} />
            <SacramentSteps title="How Baptism Is Arranged" steps={baptismSteps} />
            <SacramentCTA title="Start A Baptism Enquiry" description="If you would like to arrange Baptism or ask about the preparation programme, please contact the parish office." buttonText="Contact Parish Office" link="/contact?subject=Baptism Enquiry" />
            <RelatedSacraments current="Baptism" />
        </div>
    )
}
