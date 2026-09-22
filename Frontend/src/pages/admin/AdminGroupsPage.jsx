import { useEffect, useRef, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import FeedbackDialog from '../../components/FeedbackDialog'
import {
  createGroup,
  createGroupMember,
  deleteGroup,
  deleteGroupMember,
  listGroups,
  updateGroup,
  updateGroupMember,
} from '../../lib/admin'
import { focusAdminEditor } from '../../lib/adminEditorFocus'
import { capitalizeFirst, titleCaseWords } from '../../lib/textFormat'
import {
  hasErrors,
  requireField,
  validateEmail,
  validateMaxLength,
  validateNameText,
  validatePhone,
} from '../../lib/validation'
import AdminModal from '../../components/AdminModal'

const emptyGroupForm = {
  name: '',
  description: '',
  is_active: true,
  admin_user_id: '',
}

const emptyMemberForm = {
  name: '',
  email: '',
  phone: '',
  role: '',
  notes: '',
}

function FieldError({ errors, name }) {
  if (!errors?.[name]?.[0]) {
    return null
  }

  return <p className="admin-field-error">{errors[name][0]}</p>
}

function formatDateTime(value) {
  if (!value) {
    return 'Unknown time'
  }

  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDisplayText(value, fallback = 'Not set') {
  return value ? titleCaseWords(value) : fallback
}

function formatCopy(value, fallback = 'Not set') {
  return value ? capitalizeFirst(value) : fallback
}

function toGroupForm(group) {
  if (!group) {
    return emptyGroupForm
  }

  return {
    name: group.name || '',
    description: group.description || '',
    is_active: Boolean(group.is_active),
    admin_user_id: group.admin_user_id ? String(group.admin_user_id) : '',
  }
}

function toMemberForm(member) {
  if (!member) {
    return emptyMemberForm
  }

  return {
    name: member.name || '',
    email: member.email || '',
    phone: member.phone || '',
    role: member.role || '',
    notes: member.notes || '',
  }
}

function toPrefilledMemberForm(searchParams) {
  if (searchParams.get('new_member') !== '1') {
    return null
  }

  return {
    name: searchParams.get('name') || '',
    email: searchParams.get('email') || '',
    phone: searchParams.get('phone') || '',
    role: searchParams.get('role') || '',
    notes: searchParams.get('notes') || '',
  }
}

export default function AdminGroupsPage() {
  const { user } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const groupEditorRef = useRef(null)
  const memberEditorRef = useRef(null)
  const [groups, setGroups] = useState([])
  const [availableAdmins, setAvailableAdmins] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [selectedMemberId, setSelectedMemberId] = useState(null)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false)
  const [groupForm, setGroupForm] = useState(emptyGroupForm)
  const [memberForm, setMemberForm] = useState(emptyMemberForm)
  const [groupErrors, setGroupErrors] = useState({})
  const [memberErrors, setMemberErrors] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingGroup, setIsSavingGroup] = useState(false)
  const [isSavingMember, setIsSavingMember] = useState(false)
  const [groupSearch, setGroupSearch] = useState('')
  const [groupStatusFilter, setGroupStatusFilter] = useState('')
  const [groupAdminFilter, setGroupAdminFilter] = useState('')
  const [memberSearch, setMemberSearch] = useState('')
  const [memberJoinedFilter, setMemberJoinedFilter] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [confirmDeleteMemberId, setConfirmDeleteMemberId] = useState(null)
  const [dialogState, setDialogState] = useState({
    open: false,
    tone: 'neutral',
    title: '',
    message: '',
  })
  const [isGroupEditorOpen, setIsGroupEditorOpen] = useState(false)
  const [isMemberEditorOpen, setIsMemberEditorOpen] = useState(false)

  const selectedGroup = groups.find(item => item.id === selectedGroupId) || null
  const filteredMembers = (selectedGroup?.members || []).filter(member => {
    const query = memberSearch.trim().toLowerCase()
    const matchesQuery = query
      ? `${member.name || ''} ${member.email || ''} ${member.phone || ''} ${member.role || ''}`.toLowerCase().includes(query)
      : true
    const joinedAt = member.created_at ? new Date(member.created_at) : null
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const matchesJoined = !memberJoinedFilter || (joinedAt && (() => {
      const threshold = new Date(startOfToday)
      const days = memberJoinedFilter === '7_days' ? 7 : memberJoinedFilter === '30_days' ? 30 : 365
      threshold.setDate(threshold.getDate() - (days - 1))
      return joinedAt >= threshold
    })())

    return matchesQuery && matchesJoined
  })
  const filteredGroups = groups.filter(item => {
    const query = groupSearch.trim().toLowerCase()
    const matchesQuery = query
      ? `${item.name} ${item.description || ''} ${item.admin_user?.name || ''} ${item.admin_user?.email || ''}`.toLowerCase().includes(query)
      : true
    const matchesStatus = groupStatusFilter === 'active'
      ? item.is_active
      : groupStatusFilter === 'hidden'
        ? !item.is_active
        : true
    const matchesAdmin = groupAdminFilter === 'assigned'
      ? Boolean(item.admin_user)
      : groupAdminFilter === 'unassigned'
        ? !item.admin_user
        : true

    return matchesQuery && matchesStatus && matchesAdmin
  })
  useEffect(() => {
    let ignore = false

    async function loadGroups() {
      setIsLoading(true)

      try {
        const payload = await listGroups()

        if (ignore) {
          return
        }

        const nextGroups = payload.groups || []
        const requestedGroupId = Number(searchParams.get('group') || searchParams.get('edit') || 0) || null
        const requestedMemberId = Number(searchParams.get('member') || 0) || null
        const prefilledMember = toPrefilledMemberForm(searchParams)
        const nextGroup = nextGroups.find(item => item.id === requestedGroupId) || nextGroups[0] || null
        const nextMember = nextGroup?.members?.find(item => item.id === requestedMemberId) || null

        setGroups(nextGroups)
        setAvailableAdmins(payload.available_admins || [])
        setSelectedGroupId(nextGroup?.id || null)
        setSelectedMemberId(prefilledMember ? null : nextMember?.id || null)
        setIsCreatingGroup(false)
        setGroupForm(user?.is_main_admin ? toGroupForm(nextGroup) : emptyGroupForm)
        setMemberForm(prefilledMember || toMemberForm(nextMember))
        setMemberErrors({})
      } catch (error) {
        if (!ignore) {
          openDialog('error', 'Unable to load groups', error.message || 'The group workspace could not be loaded.')
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
  }, [searchParams, user?.is_main_admin])

  useEffect(() => {
    if (!selectedGroupId) {
      return
    }

    focusAdminEditor(user?.is_main_admin ? groupEditorRef : memberEditorRef)
  }, [selectedGroupId, user?.is_main_admin])

  useEffect(() => {
    if (!selectedMemberId) {
      return
    }

    focusAdminEditor(memberEditorRef)
  }, [selectedMemberId])

  useEffect(() => {
    if (isCreatingGroup) {
      return
    }

    if (!groups.length) {
      return
    }

    const requestedGroupId = Number(searchParams.get('group') || searchParams.get('edit') || 0) || null
    const requestedMemberId = Number(searchParams.get('member') || 0) || null
    const prefilledMember = toPrefilledMemberForm(searchParams)
    const nextGroup = groups.find(item => item.id === requestedGroupId) || groups.find(item => item.id === selectedGroupId) || groups[0]
    const nextMember = nextGroup?.members?.find(item => item.id === requestedMemberId)
      || nextGroup?.members?.find(item => item.id === selectedMemberId)
      || null

    if ((nextGroup?.id || null) !== selectedGroupId) {
      setSelectedGroupId(nextGroup?.id || null)
      if (user?.is_main_admin) {
        setGroupForm(toGroupForm(nextGroup))
      }
    }

    if (prefilledMember) {
      if (selectedMemberId !== null) {
        setSelectedMemberId(null)
      }
      setMemberForm(prefilledMember)
      setMemberErrors({})
    } else if ((nextMember?.id || null) !== selectedMemberId) {
      setSelectedMemberId(nextMember?.id || null)
      setMemberForm(toMemberForm(nextMember))
    }
  }, [groups, isCreatingGroup, searchParams, selectedGroupId, selectedMemberId, user?.is_main_admin])

  function closeDialog() {
    setDialogState(current => ({ ...current, open: false }))
  }

  function openDialog(tone, title, message) {
    setDialogState({ open: true, tone, title, message })
  }

  function updateSearch(nextGroupId, nextMemberId = null) {
    const nextParams = new URLSearchParams()

    if (nextGroupId) {
      nextParams.set('group', String(nextGroupId))
    }

    if (nextMemberId) {
      nextParams.set('member', String(nextMemberId))
    }

    setSearchParams(nextParams)
  }

  async function refreshGroups(nextGroupId = selectedGroupId, nextMemberId = selectedMemberId) {
    const payload = await listGroups()
    const nextGroups = payload.groups || []
    const nextGroup = nextGroups.find(item => item.id === nextGroupId) || nextGroups[0] || null
    const nextMember = nextGroup?.members?.find(item => item.id === nextMemberId) || null

    setGroups(nextGroups)
    setAvailableAdmins(payload.available_admins || [])
    setSelectedGroupId(nextGroup?.id || null)
    setSelectedMemberId(nextMember?.id || null)
    setIsCreatingGroup(false)
    setGroupForm(user?.is_main_admin ? toGroupForm(nextGroup) : emptyGroupForm)
    setMemberForm(toMemberForm(nextMember))
    updateSearch(nextGroup?.id || null, nextMember?.id || null)
  }

  function selectGroup(groupId) {
    const nextGroup = groups.find(item => item.id === groupId) || null
    setIsCreatingGroup(false)
    setSelectedGroupId(nextGroup?.id || null)
    setSelectedMemberId(null)
    setMemberForm(emptyMemberForm)
    setMemberErrors({})

    if (user?.is_main_admin) {
      setGroupForm(toGroupForm(nextGroup))
      setGroupErrors({})
    }

    updateSearch(nextGroup?.id || null, null)
  }

  function startNewGroup() {
    setIsCreatingGroup(true)
    setSelectedGroupId(null)
    setSelectedMemberId(null)
    setGroupForm(emptyGroupForm)
    setGroupErrors({})
    setMemberForm(emptyMemberForm)
    setMemberErrors({})
    setSearchParams({})
    setIsGroupEditorOpen(true)
  }

  function closeGroupEditor() {
    setIsGroupEditorOpen(false)
  }

  function startNewMember() {
    setSelectedMemberId(null)
    setMemberForm(emptyMemberForm)
    setMemberErrors({})
    updateSearch(selectedGroupId, null)
    setIsMemberEditorOpen(true)
  }

  function closeMemberEditor() {
    setIsMemberEditorOpen(false)
  }

  function editMember(memberId) {
    const nextMember = selectedGroup?.members?.find(item => item.id === memberId) || null
    setSelectedMemberId(nextMember?.id || null)
    setMemberForm(toMemberForm(nextMember))
    setMemberErrors({})
    updateSearch(selectedGroupId, nextMember?.id || null)
    setIsMemberEditorOpen(true)
  }

  function handleGroupChange(event) {
    const { name, value, type, checked } = event.target
    const nextForm = {
      ...groupForm,
      [name]: type === 'checkbox' ? checked : value,
    }

    setGroupForm(nextForm)
    setGroupErrors(current => ({
      ...current,
      [name]: validateGroupField(nextForm, name),
    }))
  }

  function formatGroupField(name, formatter) {
    setGroupForm(current => ({
      ...current,
      [name]: formatter(current[name] || ''),
    }))
  }

  function handleMemberChange(event) {
    const { name, value } = event.target
    const nextForm = {
      ...memberForm,
      [name]: value,
    }

    setMemberForm(nextForm)
    setMemberErrors(current => ({
      ...current,
      [name]: validateMemberField(nextForm, name),
    }))
  }

  function formatMemberField(name, formatter) {
    setMemberForm(current => ({
      ...current,
      [name]: formatter(current[name] || ''),
    }))
  }

  function validateGroupForm() {
    const nextErrors = {}
    requireField(nextErrors, 'name', groupForm.name, 'Group name')
    validateMaxLength(nextErrors, 'name', groupForm.name, 255, 'Group name')
    validateMaxLength(nextErrors, 'description', groupForm.description, 2000, 'Description')
    return nextErrors
  }

  function validateGroupField(form, fieldName) {
    const nextErrors = {}

    if (fieldName === 'name') {
      requireField(nextErrors, 'name', form.name, 'Group name')
      validateMaxLength(nextErrors, 'name', form.name, 255, 'Group name')
    }

    if (fieldName === 'description') {
      validateMaxLength(nextErrors, 'description', form.description, 2000, 'Description')
    }

    return nextErrors[fieldName]
  }

  function validateMemberForm() {
    const nextErrors = {}
    validateNameText(nextErrors, 'name', memberForm.name, 'Member name', true)
    validateEmail(nextErrors, 'email', memberForm.email, 'Email address', false)
    validatePhone(nextErrors, 'phone', memberForm.phone, 'Phone number', false)
    validateMaxLength(nextErrors, 'role', memberForm.role, 255, 'Role')
    validateMaxLength(nextErrors, 'notes', memberForm.notes, 2000, 'Notes')
    return nextErrors
  }

  function validateMemberField(form, fieldName) {
    const nextErrors = {}

    if (fieldName === 'name') {
      validateNameText(nextErrors, 'name', form.name, 'Member name', true)
    }

    if (fieldName === 'email') {
      validateEmail(nextErrors, 'email', form.email, 'Email address', false)
    }

    if (fieldName === 'phone') {
      validatePhone(nextErrors, 'phone', form.phone, 'Phone number', false)
    }

    if (fieldName === 'role') {
      validateMaxLength(nextErrors, 'role', form.role, 255, 'Role')
    }

    if (fieldName === 'notes') {
      validateMaxLength(nextErrors, 'notes', form.notes, 2000, 'Notes')
    }

    return nextErrors[fieldName]
  }

  async function submitGroup(event) {
    event.preventDefault()
    const validationErrors = validateGroupForm()
    setGroupErrors(validationErrors)

    if (hasErrors(validationErrors)) {
      openDialog('error', 'Please check the group form', 'Fix the highlighted fields before saving this group.')
      return
    }

    setIsSavingGroup(true)

    const payload = {
      name: groupForm.name,
      description: groupForm.description || '',
      is_active: groupForm.is_active,
      admin_user_id: groupForm.admin_user_id ? Number(groupForm.admin_user_id) : null,
    }

    try {
      const response = selectedGroupId
        ? await updateGroup(selectedGroupId, payload)
        : await createGroup(payload)

      await refreshGroups(response.group?.id || selectedGroupId)
      setIsGroupEditorOpen(false)
      openDialog('success', 'Group saved successfully', response.message || 'The group has been saved.')
    } catch (error) {
      setGroupErrors(error.errors || {})
      openDialog('error', 'Unable to save group', error.message || 'Please review the group details and try again.')
    } finally {
      setIsSavingGroup(false)
    }
  }

  async function submitMember(event) {
    event.preventDefault()

    if (!selectedGroup) {
      openDialog('error', 'Select a group first', 'Choose a group before adding or editing members.')
      return
    }

    const validationErrors = validateMemberForm()
    setMemberErrors(validationErrors)

    if (hasErrors(validationErrors)) {
      openDialog('error', 'Please check the member form', 'Fix the highlighted member details before saving.')
      return
    }

    setIsSavingMember(true)

    try {
      const response = selectedMemberId
        ? await updateGroupMember(selectedGroup.id, selectedMemberId, memberForm)
        : await createGroupMember(selectedGroup.id, memberForm)

      await refreshGroups(selectedGroup.id, response.member?.id || selectedMemberId)
      setIsMemberEditorOpen(false)
      openDialog('success', 'Member saved successfully', response.message || 'The member record has been saved.')
    } catch (error) {
      setMemberErrors(error.errors || {})
      openDialog('error', 'Unable to save member', error.message || 'Please review the member details and try again.')
    } finally {
      setIsSavingMember(false)
    }
  }

  async function removeGroup(id) {
    try {
      const payload = await deleteGroup(id)
      await refreshGroups()
      openDialog('success', 'Group deleted successfully', payload.message || 'The group has been removed.')
    } catch (error) {
      openDialog('error', 'Unable to delete group', error.message || 'The group could not be deleted at this time.')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  async function removeMember(memberId) {
    if (!selectedGroup) {
      return
    }

    try {
      const payload = await deleteGroupMember(selectedGroup.id, memberId)
      await refreshGroups(selectedGroup.id, selectedMemberId === memberId ? null : selectedMemberId)
      openDialog('success', 'Member deleted successfully', payload.message || 'The member has been removed.')
    } catch (error) {
      openDialog('error', 'Unable to delete member', error.message || 'The member could not be deleted at this time.')
    } finally {
      setConfirmDeleteMemberId(null)
    }
  }

  if (isLoading) {
    return <div className="admin-surface admin-loading">Loading group workspace...</div>
  }

  const isContactPrefill = searchParams.get('new_member') === '1'
  const canEditPersonalDetails = user?.is_main_admin || (!selectedMemberId && !isContactPrefill)

  return (
    <div className="admin-page-grid">
      <div className="admin-page-grid">
        <article className="admin-surface">
          <div className="admin-section-head">
            <div>
              <h2>{user?.is_main_admin ? 'Groups' : 'My Group'}</h2>
              <p>{user?.is_main_admin ? 'Click any group to manage its admin and members.' : selectedGroup ? `Manage members for ${formatDisplayText(selectedGroup.name)}.` : 'Your account is not assigned to a group yet.'}</p>
            </div>
            {user?.is_main_admin ? <button className="btn-primary" type="button" onClick={startNewGroup}>New Group</button> : null}
          </div>

          {user?.is_main_admin ? (
            <div className="admin-filter-bar">
              <input
                type="search"
                className="admin-filter-input"
                placeholder="Search groups..."
                value={groupSearch}
                onChange={event => setGroupSearch(event.target.value)}
              />
              <select className="admin-filter-select" value={groupStatusFilter} onChange={event => setGroupStatusFilter(event.target.value)}>
                <option value="">All visibility</option>
                <option value="active">Active</option>
                <option value="hidden">Hidden</option>
              </select>
              <select className="admin-filter-select" value={groupAdminFilter} onChange={event => setGroupAdminFilter(event.target.value)}>
                <option value="">Any admin assignment</option>
                <option value="assigned">Has assigned admin</option>
                <option value="unassigned">No assigned admin</option>
              </select>
            </div>
          ) : null}

          {groups.length ? (
            <div className="admin-data-table">
              {filteredGroups.map(item => (
                <div
                  key={item.id}
                  className={`admin-row admin-row-stack admin-row-clickable ${selectedGroupId === item.id ? 'active' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectGroup(item.id)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      selectGroup(item.id)
                    }
                  }}
                >
                  <div className="admin-row-main">
                    <strong>{formatDisplayText(item.name)}</strong>
                    <span>{item.admin_user ? `${formatDisplayText(item.admin_user.name)} • ${item.admin_user.email}` : 'No group admin assigned'}</span>
                  </div>
                  <div className="admin-row-meta">
                    <small>{item.members_count || 0} member{item.members_count === 1 ? '' : 's'}</small>
                    <span>{formatCopy(item.description, 'No description set yet.')} • {item.is_active ? 'Active' : 'Hidden'}</span>
                  </div>
                  {user?.is_main_admin ? (
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation()
                          selectGroup(item.id)
                          setIsGroupEditorOpen(true)
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={event => {
                          event.stopPropagation()
                          setConfirmDeleteId(item.id)
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ) : (
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation()
                          selectGroup(item.id)
                        }}
                      >
                        Open
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {!filteredGroups.length ? <p className="admin-empty">No groups match the current search or filters.</p> : null}
            </div>
          ) : (
            <p className="admin-empty">{user?.is_main_admin ? 'No groups have been created yet.' : 'No group is assigned to your account yet.'}</p>
          )}
        </article>

        {selectedGroup ? (
          <article className="admin-surface">
            <div className="admin-section-head">
              <div>
                <h2>Group Members</h2>
                <p>{user?.is_main_admin ? `Main admin view for ${formatDisplayText(selectedGroup.name)}.` : 'Members registered from your dashboard appear here.'}</p>
              </div>
              <button className="btn-outline" type="button" onClick={startNewMember}>New Member</button>
            </div>

            <div className="admin-data-table">
              {!user?.is_main_admin ? (
                <div className="admin-filter-bar">
                  <input
                    type="search"
                    className="admin-filter-input"
                    placeholder="Search members..."
                    value={memberSearch}
                    onChange={event => setMemberSearch(event.target.value)}
                  />
                  <select className="admin-filter-select" value={memberJoinedFilter} onChange={event => setMemberJoinedFilter(event.target.value)}>
                    <option value="">Any date joined</option>
                    <option value="7_days">Joined in last 7 days</option>
                    <option value="30_days">Joined in last 30 days</option>
                    <option value="365_days">Joined in last year</option>
                  </select>
                </div>
              ) : null}

              {filteredMembers.map(member => (
                <div key={member.id} className={`admin-row ${selectedMemberId === member.id ? 'active' : ''}`}>
                  <div>
                    <strong>{formatDisplayText(member.name)}</strong>
                    <span>{member.role ? formatDisplayText(member.role) : member.email || 'No role or email added yet.'}</span>
                  </div>
                  <div>
                    <small>{member.phone || 'No phone added'}</small>
                    <span>{formatDateTime(member.created_at)}</span>
                  </div>
                  <div className="admin-row-actions">
                    <button type="button" onClick={() => editMember(member.id)}>Edit</button>
                    <button type="button" className="danger" onClick={() => setConfirmDeleteMemberId(member.id)}>Delete</button>
                  </div>
                </div>
              ))}
              {!filteredMembers.length ? <p className="admin-empty">{selectedGroup.members?.length ? 'No members match the current search or date filter.' : 'No members have been registered for this group yet.'}</p> : null}
            </div>
          </article>
        ) : null}
      </div>

        {user?.is_main_admin ? (
          <AdminModal
            isOpen={isGroupEditorOpen}
            onClose={closeGroupEditor}
            title={selectedGroupId ? 'Edit Group' : 'Create Group'}
            subtitle="Assign the role-based admin account, then use the member panel for registrations."
          >
            <form className="admin-form" onSubmit={submitGroup} noValidate ref={groupEditorRef}>
              <label>
                <span>Group name</span>
                <input name="name" value={groupForm.name} onChange={handleGroupChange} onBlur={() => formatGroupField('name', titleCaseWords)} aria-invalid={Boolean(groupErrors.name)} />
                <FieldError errors={groupErrors} name="name" />
              </label>

              <label>
                <span>Description</span>
                <textarea name="description" rows="4" value={groupForm.description} onChange={handleGroupChange} onBlur={() => formatGroupField('description', capitalizeFirst)} aria-invalid={Boolean(groupErrors.description)} />
                <FieldError errors={groupErrors} name="description" />
              </label>

              <label>
                <span>Assigned group admin</span>
                <select name="admin_user_id" value={groupForm.admin_user_id} onChange={handleGroupChange}>
                  <option value="">No group admin assigned</option>
                  {availableAdmins.map(admin => (
                    <option
                      key={admin.id}
                      value={admin.id}
                      disabled={admin.group_id !== null && String(admin.group_id) !== String(selectedGroupId || '')}
                    >
                      {formatDisplayText(admin.name)} ({admin.email}){admin.group_id ? ' - already assigned' : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label className="admin-checkbox">
                <input type="checkbox" name="is_active" checked={groupForm.is_active} onChange={handleGroupChange} />
                <span>Show this group as active</span>
              </label>

              <div className="admin-actions">
                <button className="btn-primary" type="submit" disabled={isSavingGroup}>
                  {isSavingGroup ? 'Saving...' : selectedGroupId ? 'Update Group' : 'Create Group'}
                </button>
                <button className="btn-outline" type="button" onClick={closeGroupEditor}>Cancel</button>
              </div>
            </form>
          </AdminModal>
        ) : null}

        <AdminModal
          isOpen={isMemberEditorOpen}
          onClose={closeMemberEditor}
          title={selectedMemberId ? 'Edit Member' : 'Register Member'}
          subtitle={selectedGroup ? `Save members into ${formatDisplayText(selectedGroup.name)}.` : 'Select a group to begin.'}
        >
          {selectedGroup ? (
            <form className="admin-form" onSubmit={submitMember} noValidate ref={memberEditorRef}>
              <label>
                <span>Member name</span>
                <input name="name" value={memberForm.name} onChange={handleMemberChange} onBlur={() => formatMemberField('name', titleCaseWords)} disabled={!canEditPersonalDetails} aria-invalid={Boolean(memberErrors.name)} />
                <FieldError errors={memberErrors} name="name" />
              </label>

              <div className="admin-form-grid">
                <label>
                  <span>Email</span>
                  <input name="email" value={memberForm.email} onChange={handleMemberChange} disabled={!canEditPersonalDetails} aria-invalid={Boolean(memberErrors.email)} />
                  <FieldError errors={memberErrors} name="email" />
                </label>

                <label>
                  <span>Phone</span>
                  <input name="phone" value={memberForm.phone} onChange={handleMemberChange} disabled={!canEditPersonalDetails} aria-invalid={Boolean(memberErrors.phone)} />
                  <FieldError errors={memberErrors} name="phone" />
                </label>
              </div>

              {!canEditPersonalDetails ? <p className="admin-field-hint">Personal details from contact messages can only be changed by the main admin. You can update group role and notes here.</p> : null}

              <label>
                <span>Role in group</span>
                <input name="role" value={memberForm.role} onChange={handleMemberChange} onBlur={() => formatMemberField('role', titleCaseWords)} aria-invalid={Boolean(memberErrors.role)} />
                <FieldError errors={memberErrors} name="role" />
              </label>

              <label>
                <span>Notes</span>
                <textarea name="notes" rows="4" value={memberForm.notes} onChange={handleMemberChange} onBlur={() => formatMemberField('notes', capitalizeFirst)} aria-invalid={Boolean(memberErrors.notes)} />
                <FieldError errors={memberErrors} name="notes" />
              </label>

              <div className="admin-actions">
                <button className="btn-primary" type="submit" disabled={isSavingMember}>
                  {isSavingMember ? 'Saving...' : selectedMemberId ? 'Update Member' : 'Add Member'}
                </button>
                <button className="btn-outline" type="button" onClick={closeMemberEditor}>Cancel</button>
              </div>
            </form>
          ) : (
            <p className="admin-empty">No group is available yet for member registration.</p>
          )}
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
        title="Delete this group?"
        message="This will remove the group, its registered members, and unassign its current group admin."
        confirmLabel="Delete Group"
        cancelLabel="Keep Group"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => removeGroup(confirmDeleteId)}
      />
      <FeedbackDialog
        open={confirmDeleteMemberId !== null}
        tone="neutral"
        variant="confirm"
        title="Delete this member?"
        message="This will remove the member from the selected group."
        confirmLabel="Delete Member"
        cancelLabel="Keep Member"
        onClose={() => setConfirmDeleteMemberId(null)}
        onConfirm={() => removeMember(confirmDeleteMemberId)}
      />
    </div>
  )
}
