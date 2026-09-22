import { SacramentHero, SacramentIntro, SacramentInfoCards, SacramentSteps, SacramentCTA, RelatedSacraments } from '../components/sacraments/SacramentSections'

const marriageCards = [
    { title: 'Initial Enquiry', content: 'Marriage enquiries should begin with the parish office. An appointment is then arranged with the Parish Priest or a Deacon.' },
    { title: 'Who Can Marry Here', content: 'At least one partner should be a baptised Catholic regularly practising the faith. If one partner is not Catholic, diocesan permission may be needed.' },
    { title: 'Timing', content: 'The first meeting should ideally happen 12 months before the proposed date so the parish can confirm freedom to marry and practical availability.' },
    { title: 'Civil And Church Requirements', content: 'The couple must complete church paperwork, marriage preparation, and registration with the Registrar of Marriages for Wrexham.' },
]

const marriageSteps = [
    { title: 'Contact The Parish Office', content: 'Email secretarywrexhamcathedral@rcdwxm.org.uk to begin the process.' },
    { title: 'Attend A Preliminary Meeting', content: 'Clergy will discuss freedom to marry, Catholic status, documents, and the proposed date.' },
    { title: 'Complete Further Meetings', content: 'At least two more meetings are needed, together with the Marriage Care programme.' },
    { title: 'Provide Civil Registration Schedule', content: 'Before the marriage takes place, the Cathedral office must receive the registrar’s schedule.' },
]

export default function MarriagePage() {
    return (
        <div className="sacrament-page">
            <SacramentHero title="Marriage" subtitle="Preparation for Catholic marriage at St Mary's Cathedral" image="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1600" />
            <SacramentIntro title="Planning Marriage In The Church" text="Marriage in the Catholic Church is a sacramental covenant and requires both pastoral preparation and legal arrangements. Cathedral parish asks couples to begin early so the spiritual, practical, and civil elements can all be completed carefully." />
            <SacramentInfoCards cards={marriageCards} />
            <SacramentSteps title="Marriage Preparation Process" steps={marriageSteps} />
            <SacramentCTA title="Planning To Marry?" description="If you are considering marriage at St Mary's Cathedral, please contact the parish office to arrange an initial appointment." buttonText="Enquire About Marriage" link="/contact?subject=Marriage Enquiry" />
            <RelatedSacraments current="Marriage" />
        </div>
    )
}
