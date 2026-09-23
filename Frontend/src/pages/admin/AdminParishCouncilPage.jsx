import { useCallback, useEffect, useRef, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import FeedbackDialog from '../../components/FeedbackDialog'
import {
  createParishCouncilMember,
  deleteParishCouncilMember,
  getParishCouncilMember,
  listParishCouncilMembers,
  updateParishCouncilMember,
} from '../../lib/admin'
import { getBackendUrl } from '../../lib/auth'
import { focusAdminEditor } from '../../lib/adminEditorFocus'
import { compressImageFile } from '../../lib/imageCompression'
import { capitalizeFirst, titleCaseWords } from '../../lib/textFormat'
import { hasErrors, requireField, validateMaxLength } from '../../lib/validation'
import AdminModal from '../../components/AdminModal'

const emptyMemberForm = {
  name: '',
  role: '',
  bio: '',
  sort_order: '1',
  is_active: true,
}
const maxImageSize = 2 * 1024 * 1024

function FieldError({ errors, name }) {
  if (!errors?.[name]?.[0]) {
    return null
  }

  return <p className="admin-field-error">{errors[name][0]}</p>
}

function formatBytes(value) {
  if (!value) {
    return 'Unknown size'
  }

  const kb = value / 1024

  if (kb < 1024) {
    return `${Math.round(kb)} KB`
  }

  return `${(kb / 1024).toFixed(1)} MB`
}

function isImageFile(file) {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file?.type)
}

function getMemberPhotoUrl(member) {
  // Prefer the public photo URL to avoid cookie/session issues in <img> tags.
  return member?.photo_url || member?.admin_photo_url || null
}

export default function AdminParishCouncilPage() {
  const { user } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const fileInputRef = useRef(null)
  const editorRef = useRef(null)
  const [members, setMembers] = useState([])
  const [membersMeta, setMembersMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [selectedMemberId, setSelectedMemberId] = useState(null)
  const [memberForm, setMemberForm] = useState(emptyMemberForm)
  const [selectedFile, setSelectedFile] = useState(null)
  const [memberErrors, setMemberErrors] = useState({})
  const [memberSearch, setMemberSearch] = useState('')
  const [memberRoleFilter, setMemberRoleFilter] = useState('')
  const [memberVisibilityFilter, setMemberVisibilityFilter] = useState('')
  const [isSavingMember, setIsSavingMember] = useState(false)
  const [isLoadingMemberEditor, setIsLoadingMemberEditor] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [dialogState, setDialogState] = useState({
    open: false,
    tone: 'neutral',
    title: '',
    message: '',
  })

  useEffect(() => {
    let ignore = false

    async function loadMembers() {
      try {
        const payload = await listParishCouncilMembers(1)

        if (!ignore) {
          setMembers(payload.members || [])
          setMembersMeta(payload.meta || { current_page: 1, last_page: 1, total: 0 })
        }
      } catch (error) {
        if (!ignore) {
          openDialog('error', 'Unable to load council members', error.message || 'The parish council member list could not be loaded.')
        }
      }
    }

    if (user?.is_main_admin) {
      loadMembers()
    }

    return () => {
      ignore = true
    }
  }, [user?.is_main_admin])

  function closeDialog() {
    setDialogState(current => ({ ...current, open: false }))
  }

  function openDialog(tone, title, message) {
    setDialogState({ open: true, tone, title, message })
  }

  const editMember = useCallback(async (id) => {
    setIsLoadingMemberEditor(true)

    try {
      const payload = await getParishCouncilMember(id)
      const item = payload.member

      setSelectedMemberId(id)
      setMemberForm({
        name: item.name || '',
        role: item.role || '',
        bio: item.bio || '',
        sort_order: String(item.sort_order ?? 0),
        is_active: Boolean(item.is_active),
      })
      setSelectedFile(null)
      setMemberErrors({})
      setSearchParams({ edit: String(id) })
      focusAdminEditor(editorRef)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setIsEditorOpen(true)
    } catch (error) {
      openDialog('error', 'Unable to load council member', error.message || 'The selected council member could not be opened.')
    } finally {
      setIsLoadingMemberEditor(false)
    }
  }, [setSearchParams])

  useEffect(() => {
    const editId = searchParams.get('edit')

    if (!editId || !user?.is_main_admin) {
      return
    }

    editMember(Number(editId))
  }, [editMember, searchParams, user?.is_main_admin])

  const selectedMember = members.find(item => item.id === selectedMemberId)

  async function refreshMembers(page = membersMeta.current_page || 1) {
    const payload = await listParishCouncilMembers(page)
    setMembers(payload.members || [])
    setMembersMeta(payload.meta || { current_page: page, last_page: 1, total: 0 })
  }

  function selectMember(id) {
    setSelectedMemberId(id)
    editMember(id)
  }

  function startNewMember() {
    const suggestedSortOrder = String(members.length + 1)
    setSelectedMemberId(null)
    setMemberForm({
      ...emptyMemberForm,
      sort_order: suggestedSortOrder,
    })
    setSelectedFile(null)
    setMemberErrors({})
    setSearchParams({})
    focusAdminEditor(editorRef)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setIsEditorOpen(true)
  }

  function closeEditor() {
    setIsEditorOpen(false)
    setSearchParams({})
  }

  function handleMemberChange(event) {
    const { name, value, type, checked } = event.target
    const nextForm = {
      ...memberForm,
      [name]: type === 'checkbox' ? checked : value,
    }

    setMemberForm(nextForm)
    setMemberErrors(current => ({
      ...current,
      ...validateMemberLiveFields(nextForm, name),
    }))
  }

  function formatMemberField(name, formatter) {
    setMemberForm(current => ({
      ...current,
      [name]: formatter(current[name] || ''),
    }))
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0] || null

    if (!file) {
      setSelectedFile(null)
      setMemberErrors(current => ({
        ...current,
        photo: selectedMemberId ? undefined : ['Please upload a member photo.'],
      }))
      return
    }

    if (!isImageFile(file)) {
      setSelectedFile(null)
      setMemberErrors(current => ({
        ...current,
        photo: ['The photo must be a JPG, PNG, or WebP image.'],
      }))
      event.target.value = ''
      return
    }

    const preparedFile = await compressImageFile(file, { maxBytes: maxImageSize })

    if (preparedFile.size > maxImageSize) {
      setSelectedFile(null)
      setMemberErrors(current => ({
        ...current,
        photo: ['The photo is still too large after compression. Please choose one under 2 MB.'],
      }))
      event.target.value = ''
      return
    }

    setSelectedFile(preparedFile)
    setMemberErrors(current => ({ ...current, photo: undefined }))
  }

  function validateMemberForm() {
    const nextErrors = {}

    requireField(nextErrors, 'name', memberForm.name, 'Name')
    requireField(nextErrors, 'role', memberForm.role, 'Role')
    validateMaxLength(nextErrors, 'name', memberForm.name, 255, 'Name')
    validateMaxLength(nextErrors, 'role', memberForm.role, 255, 'Role')
    validateMaxLength(nextErrors, 'bio', memberForm.bio, 2000, 'Bio')

    if (!selectedMemberId && !selectedFile) {
      nextErrors.photo = ['Please upload a member photo.']
    }

    if (selectedFile && !isImageFile(selectedFile)) {
      nextErrors.photo = ['The photo must be a JPG, PNG, or WebP image.']
    }

    if (selectedFile && selectedFile.size > maxImageSize) {
      nextErrors.photo = ['The photo must be 2 MB or smaller.']
    }

    return nextErrors
  }

  function validateMemberLiveFields(form, changedName) {
    const nextErrors = {}

    if (changedName === 'name') {
      requireField(nextErrors, 'name', form.name, 'Name')
      validateMaxLength(nextErrors, 'name', form.name, 255, 'Name')
    }

    if (changedName === 'role') {
      requireField(nextErrors, 'role', form.role, 'Role')
      validateMaxLength(nextErrors, 'role', form.role, 255, 'Role')
    }

    if (changedName === 'bio') {
      validateMaxLength(nextErrors, 'bio', form.bio, 2000, 'Bio')
    }

    return {
      [changedName]: nextErrors[changedName],
    }
  }

  async function submitMember(event) {
    event.preventDefault()
    const validationErrors = validateMemberForm()
    setMemberErrors(validationErrors)

    if (hasErrors(validationErrors)) {
      openDialog('error', 'Please check the council member form', 'Fix the highlighted fields before saving this council member.')
      return
    }

    setIsSavingMember(true)

    const payload = new FormData()
    payload.append('name', memberForm.name)
    payload.append('role', memberForm.role)
    payload.append('bio', memberForm.bio || '')
    payload.append('sort_order', memberForm.sort_order || '0')
    payload.append('is_active', memberForm.is_active ? '1' : '0')

    if (selectedFile) {
      payload.append('photo', selectedFile)
    }

    try {
      const response = selectedMemberId
        ? await updateParishCouncilMember(selectedMemberId, payload)
        : await createParishCouncilMember(payload)

      await refreshMembers()
      startNewMember()
      setIsEditorOpen(false)
      openDialog('success', 'Council member saved successfully', response.message || 'The parish council member has been saved.')
    } catch (error) {
      setMemberErrors(error.errors || {})
      openDialog('error', 'Unable to save council member', error.message || 'Please review the council member details and try again.')
    } finally {
      setIsSavingMember(false)
    }
  }

  async function removeMember(id) {
    try {
      const payload = await deleteParishCouncilMember(id)
      await refreshMembers()

      if (selectedMemberId === id) {
        startNewMember()
      }

      openDialog('success', 'Council member deleted successfully', payload.message || 'The parish council member has been removed.')
    } catch (error) {
      openDialog('error', 'Unable to delete council member', error.message || 'The council member could not be deleted at this time.')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  const memberRoles = Array.from(new Set(members.map(item => item.role).filter(Boolean))).sort((a, b) => a.localeCompare(b))
  const suggestedSortOrder = selectedMemberId ? memberForm.sort_order || '1' : String(members.length + 1)
  const sortOrderOptions = Array.from(
    { length: Math.max(1, selectedMemberId ? members.length : members.length + 1) },
    (_, index) => String(index + 1)
  )
  const filteredMembers = members.filter(item => {
    const query = memberSearch.trim().toLowerCase()
    const matchesQuery = query
      ? `${item.name} ${item.role} ${item.bio || ''}`.toLowerCase().includes(query)
      : true
    const matchesRole = memberRoleFilter ? item.role === memberRoleFilter : true
    const matchesVisibility = memberVisibilityFilter === 'active'
      ? item.is_active
      : memberVisibilityFilter === 'hidden'
        ? !item.is_active
        : true

    return matchesQuery && matchesRole && matchesVisibility
  })

  if (!user?.is_main_admin) {
    return (
      <div className="admin-page-grid">
        <article className="admin-surface">
          <div className="admin-section-head">
            <div>
              <h2>Parish Council Members</h2>
              <p>Only the main admin can manage parish council member records.</p>
            </div>
          </div>
          <p className="admin-empty">You can view the rest of the admin area, but this section is restricted to the main admin account.</p>
        </article>
      </div>
    )
  }

  return (
    <div className="admin-page-grid">
      <article className="admin-surface">
          <div className="admin-section-head">
            <div>
              <h2>Parish Council Members</h2>
              <p>Add, update, and remove the council members shown on the public Parish Council page.</p>
            </div>
            <button className="btn-primary" type="button" onClick={startNewMember}>New Member</button>
          </div>

          <div className="admin-filter-bar">
            <input
              type="search"
              className="admin-filter-input"
              placeholder="Search council members..."
              value={memberSearch}
              onChange={event => setMemberSearch(event.target.value)}
            />
            <select className="admin-filter-select" value={memberRoleFilter} onChange={event => setMemberRoleFilter(event.target.value)}>
              <option value="">All roles</option>
              {memberRoles.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
            <select className="admin-filter-select" value={memberVisibilityFilter} onChange={event => setMemberVisibilityFilter(event.target.value)}>
              <option value="">All visibility</option>
              <option value="active">Active</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div className="admin-data-table">
            {filteredMembers.length ? (
              <div className="admin-table-header admin-row-council" aria-hidden="true">
                <span>Photo</span>
                <span>Name & Role</span>
                <span>Order & Status</span>
                <span>Actions</span>
              </div>
            ) : null}
            {filteredMembers.map(item => (
              <div
                key={item.id}
                className={`admin-row admin-row-clickable admin-row-council ${selectedMemberId === item.id ? 'active' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => selectMember(item.id)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    selectMember(item.id)
                  }
                }}
              >
                {getMemberPhotoUrl(item) ? (
                  <img
                    className="admin-event-thumb"
                    src={getBackendUrl(getMemberPhotoUrl(item))}
                    alt={item.name}
                  />
                ) : (
                  <span className="admin-event-thumb admin-event-thumb-placeholder" aria-hidden="true" />
                )}
                <div>
                  <strong>{titleCaseWords(item.name || '')}</strong>
                  <span>{titleCaseWords(item.role || '')}</span>
                </div>
                <div>
                  <small>Sort order: {item.sort_order}</small>
                  <span className="admin-badge">{item.is_active ? 'Active' : 'Hidden'}</span>
                </div>
                <div className="admin-row-actions">
                  <button type="button" onClick={event => {
                    event.stopPropagation()
                    selectMember(item.id)
                  }}>Edit</button>
                  <button type="button" className="danger" onClick={event => {
                    event.stopPropagation()
                    setConfirmDeleteId(item.id)
                  }}>Delete</button>
                </div>
              </div>
            ))}
            {!filteredMembers.length ? <p className="admin-empty">{members.length ? 'No members match the current search or filters.' : 'No council members have been added yet.'}</p> : null}
          </div>

          <div className="admin-pagination">
            <button
              className="btn-outline"
              type="button"
              onClick={() => refreshMembers(Math.max(1, membersMeta.current_page - 1))}
              disabled={membersMeta.current_page <= 1}
            >
              Previous
            </button>
            <span>Page {membersMeta.current_page} of {membersMeta.last_page}</span>
            <button
              className="btn-outline"
              type="button"
              onClick={() => refreshMembers(Math.min(membersMeta.last_page, membersMeta.current_page + 1))}
              disabled={membersMeta.current_page >= membersMeta.last_page}
            >
              Next
            </button>
          </div>
        </article>

      <AdminModal
        isOpen={isEditorOpen}
        onClose={closeEditor}
        title={selectedMemberId ? 'Edit Council Member' : 'Create Council Member'}
        subtitle={isLoadingMemberEditor ? 'Loading council member...' : 'Member photos are uploaded to the backend and displayed on the public website.'}
      >
        <form className="admin-form" onSubmit={submitMember} noValidate ref={editorRef}>
          <div className="admin-form-group">
            <h3 className="admin-form-group-head">Member Details</h3>
            <label>
              <span>Name</span>
              <input name="name" value={memberForm.name} onChange={handleMemberChange} onBlur={() => formatMemberField('name', titleCaseWords)} aria-invalid={Boolean(memberErrors.name)} />
              <FieldError errors={memberErrors} name="name" />
            </label>

            <label>
              <span>Role</span>
              <input name="role" value={memberForm.role} onChange={handleMemberChange} onBlur={() => formatMemberField('role', titleCaseWords)} aria-invalid={Boolean(memberErrors.role)} />
              <FieldError errors={memberErrors} name="role" />
            </label>

            <label>
              <span>Short bio</span>
              <textarea name="bio" rows="4" value={memberForm.bio} onChange={handleMemberChange} onBlur={() => formatMemberField('bio', capitalizeFirst)} aria-invalid={Boolean(memberErrors.bio)} />
              <FieldError errors={memberErrors} name="bio" />
            </label>
          </div>

          <div className="admin-form-group">
            <h3 className="admin-form-group-head">Order & Visibility</h3>
            <div className="admin-form-grid">
              <label>
                <span>Sort order</span>
                <select name="sort_order" value={memberForm.sort_order || suggestedSortOrder} onChange={handleMemberChange}>
                  {sortOrderOptions.map(value => (
                    <option key={value} value={value}>{value}</option>
                  ))}
                </select>
                <p className="admin-field-hint">Current member count: {members.length}. Choose 1 for the first person.</p>
              </label>

              <label className="admin-checkbox">
                <input type="checkbox" name="is_active" checked={memberForm.is_active} onChange={handleMemberChange} />
                <span>Show on public page</span>
              </label>
            </div>
          </div>

          <div className="admin-form-group">
            <h3 className="admin-form-group-head">Member Photo</h3>
            <label>
              <span>{selectedMemberId ? 'Replace photo' : 'Photo'}</span>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} aria-invalid={Boolean(memberErrors.photo)} />
              <p className="admin-field-hint">Large images are compressed automatically.</p>
              <FieldError errors={memberErrors} name="photo" />
            </label>

            {selectedFile ? (
              <div className="admin-panel">
                <strong>Selected photo</strong>
                <p>Selected uploaded photo • {formatBytes(selectedFile.size)}</p>
              </div>
            ) : null}

            {getMemberPhotoUrl(selectedMember) && !selectedFile ? (
              <div className="admin-panel">
                <strong>Current photo</strong>
                <div className="admin-member-preview">
                  <img src={getBackendUrl(getMemberPhotoUrl(selectedMember))} alt={selectedMember.name} />
                  <p>{selectedMember.photo_filename || 'Current uploaded image'} • {formatBytes(selectedMember.photo_size)}</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="admin-actions">
            <button className="btn-primary" type="submit" disabled={isSavingMember}>
              {isSavingMember ? 'Saving...' : selectedMemberId ? 'Update Member' : 'Create Member'}
            </button>
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
        title="Delete this council member?"
        message="This will permanently remove the council member and their uploaded photo."
        confirmLabel="Delete Member"
        cancelLabel="Keep Member"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => removeMember(confirmDeleteId)}
      />
    </div>
  )
}
