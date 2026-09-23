import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import FeedbackDialog from '../../components/FeedbackDialog'
import { createAdminAccount, deleteAdminAccount, listGroups, updateAdminAccount } from '../../lib/admin'
import { focusAdminEditor } from '../../lib/adminEditorFocus'
import { titleCaseWords } from '../../lib/textFormat'
import { asError, validateEmail, validateMaxLength, validateNameText } from '../../lib/validation'
import AdminModal from '../../components/AdminModal'

const emptyAdminForm = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  group_id: '',
}

const passwordRequirements = [
  { id: 'length', label: 'At least 12 characters', test: value => value.length >= 12 },
  { id: 'lowercase', label: 'One lowercase letter', test: value => /[a-z]/.test(value) },
  { id: 'uppercase', label: 'One uppercase letter', test: value => /[A-Z]/.test(value) },
  { id: 'number', label: 'One number', test: value => /\d/.test(value) },
  { id: 'symbol', label: 'One symbol', test: value => /[^A-Za-z0-9]/.test(value) },
]

function validatePassword(errors, password) {
  if (!password) {
    errors.password = asError('Password is required.')
    return
  }

  const unmet = passwordRequirements.filter(requirement => !requirement.test(password))

  if (unmet.length) {
    errors.password = asError(`Password must include: ${unmet.map(item => item.label.toLowerCase()).join(', ')}.`)
  }
}

function buildAssignmentMap(groups) {
  return new Map(
    groups
      .filter(group => group.admin_user)
      .map(group => [
        group.admin_user.id,
        {
          groupId: group.id,
          groupName: group.name,
        },
      ]),
  )
}

function formatDisplayText(value, fallback = 'Not set') {
  return value ? titleCaseWords(value) : fallback
}

export default function AdminAccountsPage() {
  const { user } = useOutletContext()
  const editorRef = useRef(null)
  const [groups, setGroups] = useState([])
  const [availableAdmins, setAvailableAdmins] = useState([])
  const [editingAdminId, setEditingAdminId] = useState(null)
  const [adminForm, setAdminForm] = useState(emptyAdminForm)
  const [adminErrors, setAdminErrors] = useState({})
  const [adminSearch, setAdminSearch] = useState('')
  const [adminAssignmentFilter, setAdminAssignmentFilter] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [isSavingAdmin, setIsSavingAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [dialogState, setDialogState] = useState({
    open: false,
    tone: 'neutral',
    title: '',
    message: '',
  })

  useEffect(() => {
    let ignore = false

    async function loadData() {
      if (!user?.is_main_admin) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setErrorMessage('')

      try {
        const payload = await listGroups()

        if (ignore) {
          return
        }

        setGroups(payload.groups || [])
        setAvailableAdmins(payload.available_admins || [])
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error.message || 'The admin accounts workspace could not be loaded.')
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
  }, [user?.is_main_admin])

  const assignmentMap = useMemo(() => buildAssignmentMap(groups), [groups])
  const adminAccounts = useMemo(() => (
    [...availableAdmins]
      .sort((left, right) => left.name.localeCompare(right.name))
  ), [availableAdmins])
  const filteredAdminAccounts = useMemo(() => adminAccounts.filter(admin => {
    const assignment = assignmentMap.get(admin.id)
    const query = adminSearch.trim().toLowerCase()
    const matchesQuery = query
      ? `${admin.name || ''} ${admin.email || ''} ${assignment?.groupName || ''}`.toLowerCase().includes(query)
      : true
    const matchesAssignment = adminAssignmentFilter === 'assigned'
      ? Boolean(assignment)
      : adminAssignmentFilter === 'not_assigned'
        ? !assignment
        : true

    return matchesQuery && matchesAssignment
  }), [adminAccounts, adminAssignmentFilter, adminSearch, assignmentMap])

  async function refreshAccounts() {
    const payload = await listGroups()
    setGroups(payload.groups || [])
    setAvailableAdmins(payload.available_admins || [])
  }

  function openDialog(tone, title, message) {
    setDialogState({ open: true, tone, title, message })
  }

  function closeDialog() {
    setDialogState(current => ({ ...current, open: false }))
  }

  function startEditAdmin(admin) {
    setEditingAdminId(admin.id)
    setAdminForm({
      name: admin.name || '',
      email: admin.email || '',
      password: '',
      password_confirmation: '',
      group_id: admin.group_id ? String(admin.group_id) : '',
    })
    setAdminErrors({})
    setIsEditorOpen(true)
    focusAdminEditor(editorRef)
  }

  function startNewAdmin() {
    setEditingAdminId(null)
    setAdminForm(emptyAdminForm)
    setAdminErrors({})
    setIsEditorOpen(true)
    focusAdminEditor(editorRef)
  }

  function closeEditor() {
    setIsEditorOpen(false)
  }

  function handleAdminChange(event) {
    const { name, value } = event.target
    setAdminForm(current => ({ ...current, [name]: value }))
    setAdminErrors(current => ({ ...current, [name]: undefined }))
  }

  async function submitAdmin(event) {
    event.preventDefault()

    const nextErrors = {}

    validateNameText(nextErrors, 'name', adminForm.name, 'Admin name', true)
    validateMaxLength(nextErrors, 'name', adminForm.name, 255, 'Admin name')
    validateEmail(nextErrors, 'email', adminForm.email)

    if (!editingAdminId) {
      validatePassword(nextErrors, adminForm.password)
    }

    if (!editingAdminId && !adminForm.password_confirmation) {
      nextErrors.password_confirmation = asError('Please confirm your password.')
    } else if (!editingAdminId && adminForm.password !== adminForm.password_confirmation) {
      nextErrors.password_confirmation = asError('Passwords do not match.')
    }

    setAdminErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      return
    }

    setIsSavingAdmin(true)

    try {
      const payload = editingAdminId ? await updateAdminAccount(editingAdminId, {
        name: adminForm.name,
        email: adminForm.email,
        group_id: adminForm.group_id ? Number(adminForm.group_id) : null,
      }) : await createAdminAccount({
        name: adminForm.name,
        email: adminForm.email,
        password: adminForm.password,
        password_confirmation: adminForm.password_confirmation,
        group_id: adminForm.group_id ? Number(adminForm.group_id) : null,
      })
      await refreshAccounts()
      setIsEditorOpen(false)
      openDialog('success', editingAdminId ? 'Admin updated' : 'Admin registered', payload.message || 'The admin account has been saved.')
    } catch (error) {
      setAdminErrors(error.errors || {})
      openDialog('error', editingAdminId ? 'Unable to update admin' : 'Unable to register admin', error.message || 'Please review the admin details and try again.')
    } finally {
      setIsSavingAdmin(false)
    }
  }

  async function removeAdmin(id) {
    try {
      const payload = await deleteAdminAccount(id)
      await refreshAccounts()
      if (editingAdminId === id) {
        setIsEditorOpen(false)
      }
      openDialog('success', 'Admin deleted', payload.message || 'The admin account has been deleted.')
    } catch (error) {
      openDialog('error', 'Unable to delete admin', error.message || 'The admin account could not be deleted.')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  if (!user?.is_main_admin) {
    return (
      <article className="admin-surface">
        <div className="admin-section-head">
          <div>
            <h2>Admin Accounts</h2>
            <p>Only the main admin can review and organise admin account assignments.</p>
          </div>
        </div>
        <p className="admin-empty">Your account can still update its own details from the profile page.</p>
      </article>
    )
  }

  if (isLoading) {
    return <div className="admin-surface admin-loading">Loading admin accounts...</div>
  }

  const assignedCount = adminAccounts.filter(admin => assignmentMap.has(admin.id)).length
  const unassignedCount = adminAccounts.length - assignedCount
  const totalAdminCount = availableAdmins.length + 1

  return (
    <div className="admin-page-grid">
      {errorMessage ? <div className="admin-notice error"><span>{errorMessage}</span></div> : null}

      <div className="admin-detail-grid">
        <div className="admin-detail-card">
          <span>Total admin accounts</span>
          <strong>{totalAdminCount}</strong>
        </div>
        <div className="admin-detail-card">
          <span>Assigned group admins</span>
          <strong>{assignedCount}</strong>
        </div>
        <div className="admin-detail-card">
          <span>Unassigned admins</span>
          <strong>{unassignedCount}</strong>
        </div>
        <div className="admin-detail-card">
          <span>Active groups</span>
          <strong>{groups.length}</strong>
        </div>
      </div>

      <article className="admin-surface">
        <div className="admin-section-head">
          <div>
            <h2>Main Admin Account</h2>
            <p>This account maintains global access across all parish services and admin permissions.</p>
          </div>
          <Link className="btn-outline" to="/dashboard/profile">Manage Profile</Link>
        </div>

        <div className="admin-data-table">
          <div className="admin-table-header admin-row-accounts" aria-hidden="true">
            <span>Admin Name & Email</span>
            <span>Role & Access</span>
            <span>Assigned Scope</span>
            <span className="text-right">Actions</span>
          </div>
          <div className="admin-row admin-row-accounts">
            <div className="admin-col-main">
              <strong>{formatDisplayText(user?.name, 'Main Admin')}</strong>
              <span className="admin-subtext">{user?.email || 'No email available'}</span>
            </div>
            <div className="admin-col-status">
              <span className="admin-badge">Main Admin</span>
            </div>
            <div className="admin-col-group">
              <span className="admin-subtext">All Parish Services</span>
            </div>
            <div className="admin-row-actions">
              <Link className="btn-outline" to="/dashboard/profile">Edit</Link>
            </div>
          </div>
        </div>
      </article>

      <article className="admin-surface">
        <div className="admin-section-head">
          <div>
            <h2>Group Administrators</h2>
            <p>Review role-based group admins and manage group assignments.</p>
          </div>
          <div className="admin-actions">
            <Link className="btn-outline" to="/dashboard/groups">Manage Groups</Link>
            <button className="btn-primary" type="button" onClick={startNewAdmin}>New Admin</button>
          </div>
        </div>

        <div className="admin-filter-bar">
          <input
            type="search"
            className="admin-filter-input"
            placeholder="Search admin accounts..."
            value={adminSearch}
            onChange={event => setAdminSearch(event.target.value)}
          />
          <select className="admin-filter-select" value={adminAssignmentFilter} onChange={event => setAdminAssignmentFilter(event.target.value)}>
            <option value="">All assignments</option>
            <option value="assigned">Assigned</option>
            <option value="not_assigned">Not assigned</option>
          </select>
        </div>

        <div className="admin-data-table">
          {filteredAdminAccounts.length ? (
            <div className="admin-table-header admin-row-accounts" aria-hidden="true">
              <span>Admin Name & Email</span>
              <span>Status</span>
              <span>Assigned Group</span>
              <span className="text-right">Actions</span>
            </div>
          ) : null}
          {filteredAdminAccounts.map(admin => {
            const assignment = assignmentMap.get(admin.id)

            return (
              <div key={admin.id} className="admin-row admin-row-accounts">
                <div className="admin-col-main">
                  <strong>{formatDisplayText(admin.name)}</strong>
                  <span className="admin-subtext">{admin.email}</span>
                </div>
                <div className="admin-col-status">
                  <span className={`admin-badge ${!assignment ? 'is-warning' : ''}`}>{assignment ? 'Assigned' : 'Not assigned'}</span>
                </div>
                <div className="admin-col-group">
                  {assignment ? (
                    <Link to={`/dashboard/groups?group=${assignment.groupId}`}>{formatDisplayText(assignment.groupName)}</Link>
                  ) : (
                    <span className="admin-subtext">Unassigned</span>
                  )}
                </div>
                <div className="admin-row-actions">
                  <button type="button" onClick={() => startEditAdmin(admin)}>Edit</button>
                  <button type="button" className="danger" onClick={() => setConfirmDeleteId(admin.id)}>Delete</button>
                </div>
              </div>
            )
          })}
          {!filteredAdminAccounts.length ? <p className="admin-empty">{adminAccounts.length ? 'No admin accounts match the current filters.' : 'No admin accounts exist yet.'}</p> : null}
        </div>
      </article>

      <AdminModal
        isOpen={isEditorOpen}
        onClose={closeEditor}
        title={editingAdminId ? 'Edit Admin' : 'Create Admin'}
        subtitle={editingAdminId ? 'Update the admin name, email, or group assignment.' : 'Create a group administrator account with secure login details and assign group access if required.'}
      >
        <form className="admin-form" onSubmit={submitAdmin} noValidate ref={editorRef}>
          <div className="admin-form-group">
            <h3 className="admin-form-group-head">Account Info</h3>
            <label>
              <span>Admin name <span className="admin-required-star">*</span></span>
              <input name="name" value={adminForm.name} onChange={handleAdminChange} aria-invalid={Boolean(adminErrors.name)} placeholder="e.g. John Smith" />
              {adminErrors.name ? <p className="admin-field-error">{adminErrors.name[0]}</p> : null}
            </label>

            <label>
              <span>Email <span className="admin-required-star">*</span></span>
              <input name="email" type="email" value={adminForm.email} onChange={handleAdminChange} aria-invalid={Boolean(adminErrors.email)} placeholder="e.g. john@stmaryscathedral.org" />
              {adminErrors.email ? <p className="admin-field-error">{adminErrors.email[0]}</p> : null}
            </label>
          </div>

          {!editingAdminId ? (
            <div className="admin-form-group">
              <h3 className="admin-form-group-head">Security Credentials</h3>
              <div className="admin-form-grid">
                <label>
                  <span>Password <span className="admin-required-star">*</span></span>
                  <input name="password" type="password" value={adminForm.password} onChange={handleAdminChange} aria-invalid={Boolean(adminErrors.password)} />
                  {adminErrors.password ? <p className="admin-field-error">{adminErrors.password[0]}</p> : null}
                </label>

                <label>
                  <span>Confirm password <span className="admin-required-star">*</span></span>
                  <input name="password_confirmation" type="password" value={adminForm.password_confirmation} onChange={handleAdminChange} aria-invalid={Boolean(adminErrors.password_confirmation)} />
                  {adminErrors.password_confirmation ? <p className="admin-field-error">{adminErrors.password_confirmation[0]}</p> : null}
                </label>
              </div>
            </div>
          ) : null}

          <div className="admin-form-group">
            <h3 className="admin-form-group-head">Group Access</h3>
            <label>
              <span>Assigned group</span>
              <select name="group_id" value={adminForm.group_id} onChange={handleAdminChange}>
                <option value="">Not assigned</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{formatDisplayText(group.name)}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-form-actions">
            <button className="btn-primary" type="submit" disabled={isSavingAdmin}>{isSavingAdmin ? 'Saving...' : editingAdminId ? 'Save Admin' : 'Register Admin'}</button>
            <button className="btn-outline" type="button" onClick={closeEditor}>Cancel</button>
          </div>
        </form>
        </AdminModal>

      <FeedbackDialog
        open={dialogState.open}
        tone={dialogState.tone}
        title={dialogState.title}
        message={dialogState.message}
        confirmLabel="Close"
        onClose={closeDialog}
      />
      <FeedbackDialog
        open={confirmDeleteId !== null}
        tone="neutral"
        variant="confirm"
        title="Delete this admin?"
        message="This will permanently delete the selected group admin account."
        confirmLabel="Delete Admin"
        cancelLabel="Keep Admin"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => removeAdmin(confirmDeleteId)}
      />
    </div>
  )
}
