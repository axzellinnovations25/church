import { useEffect, useMemo, useState } from 'react'
import { ParishHero, ParishIntro, ParishInfoCards, ParishCTA, RelatedParishLinks } from '../components/parish/ParishSections'
import { getBackendUrl } from '../lib/auth'

const groupIcons = ['Choir', 'Prayer', 'Youth', 'Faith', 'Care', 'Serve']

const fallbackCards = [
  {
    icon: 'Choir',
    title: 'Choir and Musicians',
    content: 'The parish includes music, singing, and liturgical service opportunities for parishioners who want to share their gifts.',
  },
  {
    icon: 'Prayer',
    title: 'Prayer Groups',
    content: 'Prayer groups, rosary gatherings, and devotional life remain part of the parish rhythm throughout the year.',
  },
  {
    icon: 'Youth',
    title: 'Youth and Young Adults',
    content: 'Children, teenagers, and young adults can find formation, friendship, and support through parish life.',
  },
]

export default function ParishGroupsPage() {
  const [groups, setGroups] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadGroups() {
      try {
        const response = await fetch(getBackendUrl('/api/v1/groups'))
        const payload = await response.json()

        if (!ignore && response.ok && Array.isArray(payload.data)) {
          setGroups(payload.data)
        }
      } catch {
        if (!ignore) {
          setGroups([])
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadGroups()

    return () => {
      ignore = true
    }
  }, [])

  const groupCards = useMemo(() => {
    if (!groups.length) {
      return fallbackCards
    }

    return groups.map((group, index) => ({
      icon: groupIcons[index % groupIcons.length],
      title: group.name,
      content: group.description || 'This parish group is active and welcoming new enquiries through the cathedral office.',
      link: `/parish-groups/${group.slug}/join`,
    }))
  }, [groups])

  const featuredJoinLink = useMemo(() => {
    const youthGroup = groups.find(group => /youth/i.test(group.name) || /youth/i.test(group.slug))

    return youthGroup ? `/parish-groups/${youthGroup.slug}/join` : '/contact?subject=Joining%20a%20Group'
  }, [groups])

  return (
    <div className="parish-page">
      <ParishHero
        title="Parish Groups"
        subtitle="Join a group and become part of our vibrant cathedral community"
        image="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1600"
        breadcrumb="Parish Groups"
      />

      <ParishIntro
        title="Faith in Fellowship"
        text="Parish life at St Mary's Cathedral is vibrant, welcoming, supportive, and full of life. The parish brings together Catholics from many countries and cultures, and there are many ways to pray, serve, learn, and build friendship."
      />

      <ParishInfoCards cards={groupCards} columns={3} />

      <section className="section" style={{ background: '#fcfaf6' }}>
        <div className="container">
          <h2 className="section-title">Group Highlights</h2>
          <p className="section-subtitle">
            {isLoading
              ? 'Loading active parish groups...'
              : groups.length
                ? 'These highlights now reflect the active groups managed in the admin dashboard.'
                : 'The parish office can help you find the right place to get involved.'}
          </p>

          <div className="content-grid" style={{ marginTop: '40px' }}>
            <div className="content-card">
              <h3>How groups work</h3>
              <p>Each active parish group can now be managed from the admin dashboard, including its assigned admin and member list. Public enquiries are routed through the contact form so the right people can respond.</p>
            </div>

            <div className="content-card">
              <h3>Joining a group</h3>
              <p>Choose a group that interests you, then use its join page to send a structured registration enquiry. Group-join requests are routed to the correct parish team automatically.</p>
            </div>

            <div className="content-card">
              <h3>Serving together</h3>
              <p>Parish life includes prayer, liturgy, service, music, outreach, and support for families. Even if you are new to the parish, there is usually a welcoming place to begin.</p>
            </div>

            <div className="content-card">
              <h3>Need help choosing?</h3>
              <p>If you are unsure where to start, the parish office can help you find a suitable group based on your interests, availability, and the kind of support or service you are looking for.</p>
            </div>
          </div>
        </div>
      </section>

      <ParishCTA
        title="Want to Join a Group?"
        description="We would love to help you find the right group for your interests and schedule. Reach out to us today to get connected."
        buttons={[
          { text: 'Join a Parish Group', link: featuredJoinLink, primary: true },
          { text: 'Enquire Online', link: '/contact' },
        ]}
      />

      <RelatedParishLinks current="Parish Groups" />
    </div>
  )
}
