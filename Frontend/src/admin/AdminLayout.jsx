import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import FeedbackDialog from '../components/FeedbackDialog'
import { getHeaderSummary, prefetchAdminDataForPath, warmAdminData } from '../lib/admin'
import { titleCaseWords } from '../lib/textFormat'
import { useAdminSession } from './useAdminSession'
import './admin.css'

const navItems = [
  { to: '/dashboard', end: true, label: 'Overview', meta: 'Summary and quick access' },
  { to: '/dashboard/events', label: 'Events', meta: 'Schedule and publish events' },
  { to: '/dashboard/my-group', label: 'My Group', meta: 'Group admin workspace', groupAdminOnly: true },
  { to: '/dashboard/mass-times', label: 'Mass Times', meta: 'Manage weekly worship times', mainAdminOnly: true },
  { to: '/dashboard/news', label: 'News', meta: 'Publish news and announcements', mainAdminOnly: true },
  { to: '/dashboard/newsletters', label: 'Newsletters', meta: 'Upload weekly PDFs', mainAdminOnly: true },
  { to: '/dashboard/gallery', label: 'Photo Gallery', meta: 'Manage public gallery photos', mainAdminOnly: true },
  { to: '/dashboard/registrations', label: 'Registrations', meta: 'Review parish records', mainAdminOnly: true },
  { to: '/dashboard/contact-messages', label: 'Contact', meta: 'Read website enquiries' },
  { to: '/dashboard/groups', label: 'Groups', meta: 'Manage groups and admins', mainAdminOnly: true },
  { to: '/dashboard/accounts', label: 'Admins', meta: 'Review admin account assignments', mainAdminOnly: true },
  { to: '/dashboard/parish-council', label: 'Parish Council', meta: 'Manage council members', mainAdminOnly: true },
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
              <p className="admin-kicker">Cathedral Admin</p>
              <h1>Website Management</h1>
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
                  {item.label}
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
