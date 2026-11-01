import { SacramentHero, SacramentIntro, SacramentInfoCards, SacramentSchedule, SacramentSteps, SacramentCTA, RelatedSacraments } from '../components/sacraments/SacramentSections'
import { siteImageUrl } from '../lib/siteImages'

const reconciliationCards = [
    { title: 'Regular Confession Times', content: 'Confessions are normally heard on Saturdays from 10.30am to 11.30am. Additional and seasonal times are published in the weekly newsletter.' },
    { title: 'Seasonal Services', content: 'Additional services of Reconciliation during Lent are announced in the weekly newsletter.' },
    { title: 'Part Of Sacramental Preparation', content: 'Preparation for First Holy Communion in Cathedral parish includes preparation for the Sacrament of Reconciliation.' },
    { title: 'Pastoral Support', content: 'If you need guidance about confession or have been away for some time, the clergy team will be happy to help.' },
]

const reconciliationSteps = [
    { title: 'Examine Your Conscience', content: 'Spend time in prayer and honest reflection before approaching the sacrament.' },
    { title: 'Come During The Published Times', content: 'Attend one of the regular Saturday times or a seasonal penitential service.' },
    { title: 'Confess With Trust In God’s Mercy', content: 'The priest will guide you if you are unsure of the form.' },
    { title: 'Receive Absolution', content: 'Complete your penance and leave renewed in grace and peace.' },
]

export default function ReconciliationPage() {
    return (
        <div className="sacrament-page">
            <SacramentHero title="Reconciliation" subtitle="Regular confession times and guidance for the Sacrament of Reconciliation" image={siteImageUrl('assets/reconciliation-hero.jpg')} />
            <SacramentIntro title="God's Mercy And Healing" text="The Sacrament of Reconciliation restores us to grace, renews our friendship with God, and strengthens us to live the Christian life. Cathedral parish provides regular confession times and extra seasonal opportunities during Lent." />
            <SacramentInfoCards cards={reconciliationCards} />
        <SacramentSchedule title="Confession Times" content="Saturday 10.30am to 11.30am. Please check the weekly newsletter for additional or seasonal times." />
            <SacramentSteps title="Approaching Confession" steps={reconciliationSteps} />
            <SacramentCTA title="Need To Speak To A Priest?" description="If you would like pastoral help or guidance about confession, please contact the parish office." buttonText="Contact Parish Office" link="/contact?subject=Reconciliation Enquiry" />
            <RelatedSacraments current="Reconciliation" />
        </div>
    )
}
