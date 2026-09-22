import { SacramentHero, SacramentIntro, SacramentInfoCards, SacramentSteps, SacramentCTA, RelatedSacraments } from '../components/sacraments/SacramentSections'

const confirmationCards = [
    { title: 'Who Can Join', content: 'Confirmation is open to young people from school year 8 who are baptised Catholics and have already received Holy Communion.' },
    { title: 'Parish Commitment', content: 'Families should be registered members of Cathedral parish and attending Mass regularly in the parish.' },
    { title: 'Programme Timing', content: 'Preparation usually starts in October or November, with Confirmation celebrated around Pentecost in the following year.' },
    { title: 'Registration', content: 'Registration is normally completed online from September each year, and candidates are expected to attend all sessions.' },
]

const confirmationSteps = [
    { title: 'Register In September', content: 'Follow the parish registration process when enrolment opens.' },
    { title: 'Attend Every Session', content: 'Candidates are expected to commit to the full programme of meetings and formation.' },
    { title: 'Stay Rooted In Worship', content: 'Regular Mass attendance is part of preparation for receiving the sacrament.' },
    { title: 'Celebrate Confirmation', content: 'The sacrament is usually planned for Pentecost Sunday in the following year.' },
]

export default function ConfirmationPage() {
    return (
        <div className="sacrament-page">
            <SacramentHero title="Confirmation" subtitle="Preparation for young people receiving the gifts of the Holy Spirit" image="https://images.unsplash.com/photo-1544427920-c49ccfb85579?q=80&w=1600" />
            <SacramentIntro title="Strengthened By The Spirit" text="Confirmation deepens baptismal grace and strengthens a young person's life in Christ and in the Church. Cathedral parish prepares candidates through formation, prayer, and regular participation in parish worship." />
            <SacramentInfoCards cards={confirmationCards} />
            <SacramentSteps title="The Path To Confirmation" steps={confirmationSteps} />
            <SacramentCTA title="Interested In The Next Confirmation Programme?" description="Use the contact form if you would like to ask about dates, eligibility, or registration." buttonText="Ask About Confirmation" link="/contact?subject=Confirmation Enquiry" />
            <RelatedSacraments current="Confirmation" />
        </div>
    )
}
