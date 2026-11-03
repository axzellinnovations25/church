import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ParishHero, ParishIntro, ParishCTA, RelatedParishLinks } from '../components/parish/ParishSections'
import { publicQueries } from '../lib/publicData'
import './ParishGroupsPage.css'

const ministryCategories = [
  {
    icon: 'FF',
    title: 'Faith & Spiritual Formation',
    description: 'Grow in faith through prayer, learning, preparation, and shared reflection.',
    groups: ['Spiritual Formation', 'Prayer Groups', 'Catechists'],
  },
  {
    icon: 'LW',
    title: 'Liturgy & Worship',
    description: 'Help the parish celebrate Mass prayerfully, reverently, and with full participation.',
    groups: ['Extraordinary Ministers', 'Choir', 'Altar Servers', 'Readers'],
  },
  {
    icon: 'CO',
    title: 'Community & Outreach',
    description: 'Build friendship, welcome others, and serve people within the parish and across Wrexham.',
    groups: ['Community Cohesion', 'Youth Group', 'SVP', 'Hospitality Volunteers', 'Tour Guides'],
  },
  {
    icon: 'CC',
    title: 'Caring for Our Cathedral',
    description: 'Use practical skills and shared stewardship to care for our buildings, grounds, and future.',
    groups: ['Cleaning Teams', 'Gardeners', 'Building & Maintenance', 'Safety & Security', 'Fundraising Group'],
  },
]

export default function ParishGroupsPage() {
  const { data: groups = [], isPending: isLoading } = useQuery(publicQueries.groups)

  return (
    <div className="parish-page parish-groups-page">
      <ParishHero
        title="Community"
        subtitle="Pray, learn, serve, and build friendships through parish life"
        image="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1600"
        breadcrumb="Community"
      />

      <ParishIntro
        title="Find Your Place in Parish Life"
        text="St Mary's Cathedral brings together people of many ages, backgrounds, cultures, and gifts. Whether you want to deepen your faith, support worship, help others, or care for the Cathedral, there is a welcoming way to get involved."
      />

      <section className="section ministry-categories-section">
        <div className="container">
          <div className="community-section-heading">
            <p className="community-kicker">Ways to take part</p>
            <h2>Groups & Ministries</h2>
            <p>Activities are organised below by their main area of parish life, making it easier to find the right place for your interests.</p>
          </div>
          <div className="ministry-category-grid">
            {ministryCategories.map((category) => (
              <article key={category.title} className="ministry-category-card">
                <span className="ministry-category-icon" aria-hidden="true">{category.icon}</span>
                <h3>{category.title}</h3>
                <p>{category.description}</p>
                <ul>
                  {category.groups.map((group) => <li key={group}>{group}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section active-groups-section">
        <div className="container">
          <div className="community-section-heading">
            <p className="community-kicker">Currently listed online</p>
            <h2>Active Parish Groups</h2>
            <p>{isLoading ? 'Loading active parish groups…' : 'Select an active group for more information, or use the general Join Group form for any ministry listed above.'}</p>
          </div>

          {!isLoading && groups.length ? (
            <div className="active-groups-grid">
              {groups.map((group) => (
                <article key={group.id} className="active-group-card">
                  <h3>{group.name}</h3>
                  <p>{group.description || 'This parish group welcomes new enquiries through the parish office.'}</p>
                  <Link to={`/parish-groups/${group.slug}/join`} className="active-group-link">Join or enquire <span aria-hidden="true">→</span></Link>
                </article>
              ))}
            </div>
          ) : null}

          {!isLoading && !groups.length ? (
            <div className="community-empty-card">
              <p>The parish office can help you connect with any group or ministry.</p>
              <Link to="/parish-groups/join">Open the Join Group form</Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="section join-group-explainer-section">
        <div className="container join-group-explainer">
          <div>
            <p className="community-kicker">Not sure where to begin?</p>
            <h2>Join a Group or Ask for More Information</h2>
            <p>Choose the group or ministry you are interested in, tell us whether you want to join or simply know more, and your enquiry will be passed to the appropriate parish team.</p>
          </div>
          <Link to="/parish-groups/join" className="join-group-button">Join Group</Link>
        </div>
      </section>

      <ParishCTA
        title="Become Part of Our Community"
        description="Choose a group, ask a question, or tell us where you would like to help."
        buttons={[
          { text: 'Join Group', link: '/parish-groups/join', primary: true },
          { text: 'Contact Parish Office', link: '/contact' },
        ]}
      />

      <RelatedParishLinks current="Parish Groups" />
    </div>
  )
}
