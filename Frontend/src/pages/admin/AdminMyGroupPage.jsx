import { useOutletContext } from 'react-router-dom'
import AdminGroupsPage from './AdminGroupsPage'

export default function AdminMyGroupPage() {
  const { user } = useOutletContext()

  if (user?.is_main_admin) {
    return (
      <article className="admin-surface">
        <div className="admin-section-head">
          <div>
            <h2>My Group</h2>
            <p>This workspace is only for assigned group admins.</p>
          </div>
        </div>
        <p className="admin-empty">Main admins can manage all groups from the main groups page.</p>
      </article>
    )
  }

  return <AdminGroupsPage />
}
