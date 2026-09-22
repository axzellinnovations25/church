import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getOverview, updateOverviewItemVisibility } from '../../lib/admin'
import { useOutletContext } from 'react-router-dom'
import { titleCaseWords } from '../../lib/textFormat'

function formatDate(value) {
  if (!value) {
    return 'Not set'
  }

  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(value) {
  if (!value) {
    return 'Not set'
  }

  return value.slice(0, 5)
}

function formatDateTime(date, time) {
  if (!date) {
    return 'Not scheduled'
  }

  return `${formatDate(date)}${time ? ` at ${formatTime(time)}` : ''}`
}

function formatDisplayText(value, fallback = 'Not set') {
  return value ? titleCaseWords(value) : fallback
}

function buildSections({ events, massTimes, registrations, contactMessages, groupMembers }) {
  return [
    {
      id: 'events',
      title: 'Recent Events',
      description: 'Only new or pinned items stay here.',
      actionLabel: 'Open Events',
      actionTo: '/dashboard/events',
      emptyMessage: 'No new event tasks need your attention.',
      items: events,
      getLink: item => `/dashboard/events?edit=${item.id}`,
      getTitle: item => item.title,
      getSubtitle: item => {
        const base = formatDateTime(item.start_date, item.start_time)

        if (item.group_name) {
          return `${base} • ${formatDisplayText(item.group_name)} • ${formatDisplayText(item.status)}`
        }

        return base
      },
    },
    {
      id: 'mass-times',
      title: 'Mass Schedule',
      description: 'New timetable records appear here until you clear them.',
      actionLabel: 'Open Mass Times',
      actionTo: '/dashboard/mass-times',
      emptyMessage: 'No new Mass time tasks need your attention.',
      items: massTimes,
      getLink: item => `/dashboard/mass-times?edit=${item.id}`,
      getTitle: item => item.day,
      getSubtitle: item => `${formatTime(item.start_time)}${item.location ? ` • ${formatDisplayText(item.location)}` : ''}`,
    },
    {
      id: 'registrations',
      title: 'Latest Registrations',
      description: 'Review new parish records here first if needed.',
      actionLabel: 'Open Records',
      actionTo: '/dashboard/registrations',
      emptyMessage: 'No new registration tasks need your attention.',
      items: registrations,
      getLink: item => `/dashboard/registrations?selected=${item.id}`,
      getTitle: item => formatDisplayText(item.full_name),
      getSubtitle: item => `${item.member_id} • ${formatDate(item.signed_date)}`,
    },
    {
      id: 'contact-messages',
      title: 'Recent Enquiries',
      description: 'New contact messages appear here until you clear them.',
      actionLabel: 'Open Contact',
      actionTo: '/dashboard/contact-messages',
      emptyMessage: 'No new contact messages need your attention.',
      items: contactMessages,
      getLink: item => `/dashboard/contact-messages?message=${item.id}`,
      getTitle: item => formatDisplayText(item.subject, 'No Subject'),
      getSubtitle: item => `${formatDisplayText(item.name)} • ${item.email}`,
    },
    {
      id: 'group-members',
      title: 'Recent Group Members',
      description: 'New member registrations stay here until you clear them.',
      actionLabel: 'Open Groups',
      actionTo: '/dashboard/groups',
      emptyMessage: 'No new group members need your attention.',
      items: groupMembers,
      getLink: item => `/dashboard/groups?group=${item.group_id}&member=${item.id}`,
      getTitle: item => formatDisplayText(item.name),
      getSubtitle: item => {
        const details = []

        if (item.group_name) {
          details.push(formatDisplayText(item.group_name))
        }

        if (item.role) {
          details.push(formatDisplayText(item.role))
        } else if (item.email) {
          details.push(item.email)
        }

        return details.join(' • ')
      },
    },
  ]
}

export default function AdminOverviewPage() {
  const { user } = useOutletContext()
  const [events, setEvents] = useState([])
  const [eventMeta, setEventMeta] = useState({ total: 0, published: 0 })
  const [massTimes, setMassTimes] = useState([])
  const [massTimeMeta, setMassTimeMeta] = useState({ total: 0 })
  const [registrations, setRegistrations] = useState([])
  const [registrationMeta, setRegistrationMeta] = useState({ total: 0 })
  const [contactMessages, setContactMessages] = useState([])
  const [contactMeta, setContactMeta] = useState({ total: 0 })
  const [groupMembers, setGroupMembers] = useState([])
  const [groupMemberMeta, setGroupMemberMeta] = useState({ total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [busyItemKey, setBusyItemKey] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadData() {
      try {
        setErrorMessage('')
        const payload = await getOverview()

        if (ignore) {
          return
        }

        setEvents(payload.recent?.events || [])
        setEventMeta(payload.stats?.events || { total: 0, published: 0 })
        setMassTimes(payload.recent?.mass_times || [])
        setMassTimeMeta(payload.stats?.mass_times || { total: 0, published: 0 })
        setRegistrations(payload.recent?.registrations || [])
        setRegistrationMeta(payload.stats?.registrations || { total: 0 })
        setContactMessages(payload.recent?.contact_messages || [])
        setContactMeta(payload.stats?.contact_messages || { total: 0 })
        setGroupMembers(payload.recent?.group_members || [])
        setGroupMemberMeta(payload.stats?.group_members || { total: 0 })
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error.message || 'The overview could not be loaded.')
        }
      } finally {
        if (!ignore) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      ignore = true
    }
  }, [])

  async function handleVisibilityChange(itemKey, visibility) {
    const groups = [
      { items: events, setItems: setEvents },
      { items: massTimes, setItems: setMassTimes },
      { items: registrations, setItems: setRegistrations },
      { items: contactMessages, setItems: setContactMessages },
      { items: groupMembers, setItems: setGroupMembers },
    ]

    setBusyItemKey(itemKey)
    setErrorMessage('')

    const snapshots = groups.map(group => group.items)

    groups.forEach(group => {
      group.setItems(group.items.flatMap(item => {
        if (item.overview_item_key !== itemKey) {
          return [item]
        }

        if (visibility === 'dismissed') {
          return []
        }

        return [{ ...item, is_pinned: true }]
      }))
    })

    try {
      await updateOverviewItemVisibility(itemKey, visibility)
    } catch (error) {
      groups.forEach((group, index) => {
        group.setItems(snapshots[index])
      })
      setErrorMessage(error.message || 'The dashboard task could not be updated.')
    } finally {
      setBusyItemKey('')
    }
  }

  const publishedEvents = eventMeta.published || 0
  const publishedMassTimes = massTimeMeta.published || 0
  const sections = buildSections({ events, massTimes, registrations, contactMessages, groupMembers }).filter(section => (
    user?.is_main_admin || ['events', 'contact-messages', 'group-members'].includes(section.id)
  ))

  return (
    <div className="admin-page-grid">
      {errorMessage ? <div className="admin-notice error"><span>{errorMessage}</span></div> : null}

      <div className={`admin-overview-grid admin-overview-stats ${user?.is_main_admin ? 'is-main-admin' : 'is-group-admin'}`}>
        <article className="admin-surface admin-stat-card">
          <span>Events</span>
          <strong>{isLoading ? '—' : (eventMeta.total ?? 0)}</strong>
          <small>{publishedEvents} published right now</small>
        </article>
        {user?.is_main_admin ? <article className="admin-surface admin-stat-card">
          <span>Mass Times</span>
          <strong>{isLoading ? '—' : (massTimeMeta.total ?? 0)}</strong>
          <small>{publishedMassTimes} published on the current page</small>
        </article> : null}
        {user?.is_main_admin ? <article className="admin-surface admin-stat-card">
          <span>Registrations</span>
          <strong>{isLoading ? '—' : (registrationMeta.total ?? 0)}</strong>
          <small>Parish records available for review</small>
        </article> : null}
        <article className="admin-surface admin-stat-card">
          <span>Contact</span>
          <strong>{isLoading ? '—' : (contactMeta.total ?? 0)}</strong>
          <small>{user?.is_main_admin ? 'Messages received through the website' : 'Messages routed to your group'}</small>
        </article>
        {!user?.is_main_admin ? <article className="admin-surface admin-stat-card">
          <span>Group Members</span>
          <strong>{isLoading ? '—' : (groupMemberMeta.total ?? 0)}</strong>
          <small>Members registered in your group</small>
        </article> : null}
      </div>

      {isLoading ? <div className="admin-surface admin-loading">Loading new dashboard tasks...</div> : null}

      {!isLoading ? (
        <div className={`admin-overview-grid admin-overview-sections ${user?.is_main_admin ? 'is-main-admin' : 'is-group-admin'}`}>
          {sections
            .filter(section => user?.is_main_admin ? section.id !== 'group-members' : true)
            .map(section => (
            <article key={section.id} className="admin-surface">
              <div className="admin-section-head">
                <div>
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>
                <Link className="btn-outline" to={section.actionTo}>{section.actionLabel}</Link>
              </div>

              <div className="admin-list">
                {section.items.map(item => (
                  <div key={item.overview_item_key} className="admin-overview-item">
                    <Link className={`admin-list-row admin-list-row-link${item.is_pinned ? ' is-flagged-red' : ''}`} to={section.getLink(item)}>
                      <strong className="admin-overview-title">
                        {item.is_pinned ? <span className="admin-flagged-dot" aria-hidden="true" /> : null}
                        <span>{section.getTitle(item)}</span>
                      </strong>
                      <span>{section.getSubtitle(item)}</span>
                    </Link>

                    <div className="admin-overview-flags">
                      <button
                        className="admin-flag-toggle is-keep"
                        type="button"
                        onClick={() => handleVisibilityChange(item.overview_item_key, 'pinned')}
                        disabled={busyItemKey === item.overview_item_key}
                        title="Keep this item on the overview"
                        aria-label="Keep this item on the overview"
                      >
                        <span aria-hidden="true">⚑</span>
                      </button>
                      <button
                        className="admin-flag-toggle is-clear"
                        type="button"
                        onClick={() => handleVisibilityChange(item.overview_item_key, 'dismissed')}
                        disabled={busyItemKey === item.overview_item_key}
                        title="Clear this item from the overview"
                        aria-label="Clear this item from the overview"
                      >
                        <span aria-hidden="true">⚑</span>
                      </button>
                    </div>
                  </div>
                ))}

                {!section.items.length ? <p className="admin-empty">{section.emptyMessage}</p> : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}
