import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import FeedbackDialog from '../components/FeedbackDialog'
import { getHeaderSummary, prefetchAdminDataForPath, warmAdminData } from '../lib/admin'
import { titleCaseWords } from '../lib/textFormat'
import { useAdminSession } from './useAdminSession'
import './admin.css'

function NavIcon({ type }) {
  switch (type) {
    case 'overview':
      return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
    case 'events':
      return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    case 'my-group':
      return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    case 'mass-times':
      return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    case 'news':
      return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 20H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1m2 13a2 2 0 0 1-2-2V7m2 13a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2m-4-3H9M7 8h6m-6 4h6m-6 4h4"/></svg>
    case 'newsletters':
      return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
    case 'gallery':
      return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
    case 'registrations':
      return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>
    case 'contact':
      return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
    case 'groups':
      return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
    case 'accounts':
      return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    case 'parish-council':
      return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>
    default:
      return null
  }
}

const navItems = [
  { to: '/dashboard', end: true, label: 'Overview', icon: 'overview', meta: 'Summary and quick access' },
  { to: '/dashboard/events', label: 'Events', icon: 'events', meta: 'Schedule and publish events' },
  { to: '/dashboard/my-group', label: 'My Group', icon: 'my-group', meta: 'Group admin workspace', groupAdminOnly: true },
  { to: '/dashboard/mass-times', label: 'Mass Times', icon: 'mass-times', meta: 'Manage weekly worship times', mainAdminOnly: true },
  { to: '/dashboard/news', label: 'News', icon: 'news', meta: 'Publish news and announcements', mainAdminOnly: true },
  { to: '/dashboard/newsletters', label: 'Newsletters', icon: 'newsletters', meta: 'Upload weekly PDFs', mainAdminOnly: true },
  { to: '/dashboard/gallery', label: 'Photo Gallery', icon: 'gallery', meta: 'Manage public gallery photos', mainAdminOnly: true },
  { to: '/dashboard/registrations', label: 'Registrations', icon: 'registrations', meta: 'Review parish records', mainAdminOnly: true },
  { to: '/dashboard/contact-messages', label: 'Contact', icon: 'contact', meta: 'Read website enquiries' },
  { to: '/dashboard/groups', label: 'Groups', icon: 'groups', meta: 'Manage groups and admins', mainAdminOnly: true },
  { to: '/dashboard/accounts', label: 'Admins', icon: 'accounts', meta: 'Review admin account assignments', mainAdminOnly: true },
  { to: '/dashboard/parish-council', label: 'Parish Council', icon: 'parish-council', meta: 'Manage council members', mainAdminOnly: true },
]
const dismissedAlertsStorageKey = 'admin-dismissed-alerts'
const alertFirstSeenStorageKey = 'admin-alert-first-seen'
const dismissedActivitiesStorageKey = 'admin-dismissed-activities'
const oneWeekMs = 7 * 24 * 60 * 60 * 1000

function loadStoredArray(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function loadStoredObject(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '{}')
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  } catch {
    return {}
  }
}

function saveStoredArray(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function saveStoredObject(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function alertKeyFor(item) {
  return `${item.key}:${item.count}`
}

function isWithinOneWeek(value) {
  if (!value) {
    return true
  }

  const time = new Date(value).getTime()
  return Number.isFinite(time) && Date.now() - time < oneWeekMs
}

function formatAuditDate(value) {
  if (!value) {
    return 'Just now'
  }

  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 16v-5a6 6 0 0 0-12 0v5l-2 2h16l-2-2Z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  )
}

function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 8v5l3 2" />
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v5h-5" />
    </svg>
  )
}

export default function AdminLayout() {
  const { user, isLoading, isLoggingOut, refreshUser, handleLogout } = useAdminSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const [openPanel, setOpenPanel] = useState('')
  const [notifications, setNotifications] = useState([])
  const [dismissedAlerts, setDismissedAlerts] = useState(() => loadStoredArray(dismissedAlertsStorageKey))
  const [alertFirstSeen, setAlertFirstSeen] = useState(() => loadStoredObject(alertFirstSeenStorageKey))
  const [auditLogs, setAuditLogs] = useState([])
  const [dismissedActivities, setDismissedActivities] = useState(() => loadStoredArray(dismissedActivitiesStorageKey))
  const visibleNotifications = notifications.filter(item => {
    const alertKey = alertKeyFor(item)
    const firstSeen = alertFirstSeen[alertKey] || new Date().toISOString()

    return !dismissedAlerts.includes(alertKey) && isWithinOneWeek(firstSeen)
  })
  const visibleAuditLogs = auditLogs.filter(item => (
    !dismissedActivities.includes(String(item.id)) && isWithinOneWeek(item.created_at)
  ))

  useEffect(() => {
    let ignore = false

    async function loadTopbarPanels() {
      if (!user) {
        return
      }

      try {
        warmAdminData(user)
        const payload = await getHeaderSummary()

        if (!ignore) {
          const nextNotifications = payload.notifications || []
          const activeAlertKeys = nextNotifications.map(alertKeyFor)
          const storedFirstSeen = loadStoredObject(alertFirstSeenStorageKey)
          const storedDismissedAlerts = loadStoredArray(dismissedAlertsStorageKey)
          const now = new Date().toISOString()
          const nextFirstSeen = {}
          const nextDismissedAlerts = storedDismissedAlerts.filter(key => activeAlertKeys.includes(key))

          activeAlertKeys.forEach(key => {
            nextFirstSeen[key] = storedFirstSeen[key] || now
          })

          saveStoredObject(alertFirstSeenStorageKey, nextFirstSeen)
          saveStoredArray(dismissedAlertsStorageKey, nextDismissedAlerts)

          setNotifications(nextNotifications)
          setAlertFirstSeen(nextFirstSeen)
          setDismissedAlerts(nextDismissedAlerts)
          setAuditLogs(payload.recent_audit_logs || [])
        }
      } catch {
        if (!ignore) {
          setNotifications([])
          setAuditLogs([])
        }
      }
    }

    loadTopbarPanels()

    return () => {
      ignore = true
    }
  }, [user])

  useEffect(() => {
    if (!openPanel) {
      return undefined
    }

    function handleOutsideClick(event) {
      if (event.target.closest('.admin-topbar-panel') || event.target.closest('.admin-topbar-actions')) {
        return
      }

      setOpenPanel('')
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setOpenPanel('')
      }
    }

    document.addEventListener('click', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('click', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [openPanel])

  function requestLogout() {
    setIsMenuOpen(false)
    setOpenPanel('')
    setIsLogoutConfirmOpen(true)
  }

  function togglePanel(panel) {
    setOpenPanel(current => current === panel ? '' : panel)
  }

  function clearAlert(item) {
    const alertKey = alertKeyFor(item)
    setDismissedAlerts(current => {
      const next = Array.from(new Set([...current, alertKey]))
      saveStoredArray(dismissedAlertsStorageKey, next)
      return next
    })
  }

  function clearAllAlerts() {
    setDismissedAlerts(current => {
      const next = Array.from(new Set([
        ...current,
        ...visibleNotifications.map(alertKeyFor),
      ]))
      saveStoredArray(dismissedAlertsStorageKey, next)
      return next
    })
  }

  function clearActivity(item) {
    setDismissedActivities(current => {
      const next = Array.from(new Set([...current, String(item.id)]))
      saveStoredArray(dismissedActivitiesStorageKey, next)
      return next
    })
  }

  function clearAllActivities() {
    setDismissedActivities(current => {
      const next = Array.from(new Set([
        ...current,
        ...visibleAuditLogs.map(item => String(item.id)),
      ]))
      saveStoredArray(dismissedActivitiesStorageKey, next)
      return next
    })
  }

  function confirmLogout() {
    setIsLogoutConfirmOpen(false)
    handleLogout()
  }

  if (isLoading) {
    return (
      <section className="admin-page">
        <div className="container admin-loading">Loading the admin workspace...</div>
      </section>
    )
  }

  return (
    <section className="admin-page">
      <div className="admin-shell">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-head">
            <div className="admin-brand">
              <span className="admin-brand-badge">ADMIN</span>
              <h1>Cathedral Workspace</h1>
            </div>

            <button
              className="admin-menu-toggle"
              type="button"
              aria-expanded={isMenuOpen}
              aria-controls="admin-mobile-menu"
              onClick={() => setIsMenuOpen(current => !current)}
            >
              <span className="admin-menu-toggle-bars" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span>{isMenuOpen ? 'Close' : 'Menu'}</span>
            </button>
          </div>

          <div id="admin-mobile-menu" className={`admin-sidebar-menu ${isMenuOpen ? 'is-open' : ''}`}>
            <nav className="admin-sidenav">
              {navItems.map(item => (
                item.mainAdminOnly && !user?.is_main_admin ? null : item.groupAdminOnly && user?.is_main_admin ? null : (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onMouseEnter={() => prefetchAdminDataForPath(item.to)}
                  onFocus={() => prefetchAdminDataForPath(item.to)}
                  onTouchStart={() => prefetchAdminDataForPath(item.to)}
                  onClick={() => setIsMenuOpen(false)}
                  className={({ isActive }) => `admin-sidenav-link ${isActive ? 'active' : ''}`}
                >
                  <span className="admin-nav-icon"><NavIcon type={item.icon} /></span>
                  <span className="admin-nav-label">{item.label}</span>
                </NavLink>
                )
              ))}
            </nav>
          </div>
        </aside>

        <div className="admin-content-wrapper">
          <header className="admin-topbar-small">
            <div className="admin-topbar-actions">
              <button className="admin-icon-button" type="button" onClick={() => togglePanel('alerts')} aria-expanded={openPanel === 'alerts'} aria-label="Open alerts">
                <BellIcon />
                {visibleNotifications.length ? <span className="admin-icon-badge">{visibleNotifications.length}</span> : null}
              </button>
              <button className="admin-icon-button" type="button" onClick={() => togglePanel('activity')} aria-expanded={openPanel === 'activity'} aria-label="Open recent activity">
                <ActivityIcon />
              </button>
            </div>
            
            <div className="admin-user-inline">
              <div className="admin-user-meta">
                <span>{user?.name ? titleCaseWords(user.name) : 'Admin User'}</span>
                <small>{user?.email || 'No email available'}</small>
              </div>
              <NavLink className={({ isActive }) => `btn-outline admin-profile-link ${isActive ? 'active' : ''}`} to="/dashboard/profile" onClick={() => setIsMenuOpen(false)}>
                Profile
              </NavLink>
              <button className="btn-outline admin-logout-inline" type="button" onClick={requestLogout} disabled={isLoggingOut}>
                {isLoggingOut ? 'Signing Out...' : 'Logout'}
              </button>
            </div>
          </header>

        {openPanel ? (
          <div className="admin-topbar-panel">
            {openPanel === 'alerts' ? (
              <>
                <div className="admin-topbar-panel-head">
                  <strong>Alerts</strong>
                  <div className="admin-topbar-panel-controls">
                    {visibleNotifications.length ? <button type="button" onClick={clearAllAlerts}>Clear all</button> : null}
                    <button type="button" onClick={() => setOpenPanel('')} aria-label="Close alerts">×</button>
                  </div>
                </div>
                <div className="admin-topbar-panel-list">
                  {visibleNotifications.map(item => (
                    <div key={item.key} className="admin-panel-alert-item">
                      <Link className={`admin-alert-row is-${item.tone || 'blue'}`} to={item.link} onClick={() => setOpenPanel('')}>
                        <strong>{item.title}</strong>
                        <span>{item.message}</span>
                      </Link>
                      <button type="button" className="admin-clear-alert" onClick={() => clearAlert(item)}>Clear</button>
                    </div>
                  ))}
                  {!visibleNotifications.length ? <p className="admin-empty">No alerts right now.</p> : null}
                </div>
              </>
            ) : (
              <>
                <div className="admin-topbar-panel-head">
                  <strong>Recent Activity</strong>
                  <div className="admin-topbar-panel-controls">
                    {visibleAuditLogs.length ? <button type="button" onClick={clearAllActivities}>Clear all</button> : null}
                    <button type="button" onClick={() => setOpenPanel('')} aria-label="Close recent activity">×</button>
                  </div>
                </div>
                <div className="admin-topbar-panel-list">
                  {visibleAuditLogs.map(item => (
                    <div key={item.id} className="admin-panel-activity-item">
                      <div className="admin-audit-row">
                        <strong>{titleCaseWords(item.action || 'Updated record')}</strong>
                        <span>{item.subject_title || 'Record'} • {item.admin_name} • {formatAuditDate(item.created_at)}</span>
                      </div>
                      <button type="button" className="admin-clear-alert" onClick={() => clearActivity(item)}>Clear</button>
                    </div>
                  ))}
                  {!visibleAuditLogs.length ? <p className="admin-empty">No recent activity yet.</p> : null}
                </div>
              </>
            )}
          </div>
        ) : null}

        <main className="admin-main">
          <div className="admin-main-inner">
            <Outlet context={{ user, refreshUser, isLoggingOut, requestLogout }} />
          </div>
        </main>
        
        </div>

        <FeedbackDialog
          open={isLogoutConfirmOpen}
          tone="neutral"
          variant="confirm"
          title="Logout of admin?"
          message="You will need to sign in again before making more website changes."
          confirmLabel={isLoggingOut ? 'Signing Out...' : 'Logout'}
          cancelLabel="Stay signed in"
          onClose={() => setIsLogoutConfirmOpen(false)}
          onConfirm={confirmLogout}
        />
      </div>
    </section>
  )
}
