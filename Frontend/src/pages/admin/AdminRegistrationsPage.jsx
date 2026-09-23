import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import FeedbackDialog from '../../components/FeedbackDialog'
import { deleteRegistration, getRegistration, listRegistrations, updateRegistration } from '../../lib/admin'
import { focusAdminEditor } from '../../lib/adminEditorFocus'
import { titleCaseWords } from '../../lib/textFormat'
import { asError, hasErrors, validateEmail, validateMaxLength, validateNameText, validatePhone } from '../../lib/validation'
import AdminModal from '../../components/AdminModal'

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

function formatTypeLabel(value) {
  return titleCaseWords(String(value || 'Not set').replace(/[_-]+/g, ' '))
}

function formatDisplayText(value, fallback = 'Not set') {
  return value ? titleCaseWords(value) : fallback
}

function getAgeFromDateOfBirth(value) {
  if (!value) {
    return null
  }

  const birthDate = new Date(`${value}T00:00:00`)

  if (Number.isNaN(birthDate.getTime())) {
    return null
  }

  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDifference = today.getMonth() - birthDate.getMonth()

  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1
  }

  return age
}

function getEighteenthBirthday(value) {
  if (!value) {
    return null
  }

  const birthDate = new Date(`${value}T00:00:00`)

  if (Number.isNaN(birthDate.getTime())) {
    return null
  }

  return new Date(birthDate.getFullYear() + 18, birthDate.getMonth(), birthDate.getDate())
}

function formatDateObject(date) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getChildAgeStatus(value) {
  const age = getAgeFromDateOfBirth(value)
  const eighteenthBirthday = getEighteenthBirthday(value)

  if (age === null || !eighteenthBirthday) {
    return { age: null, tone: 'unknown', label: 'Date of birth not provided' }
  }

  if (age >= 18) {
    return { age, tone: 'adult', label: '18+ - review family record' }
  }

  const today = new Date()
  const soonThreshold = new Date(today)
  soonThreshold.setMonth(soonThreshold.getMonth() + 3)

  if (eighteenthBirthday <= soonThreshold) {
    return { age, tone: 'soon', label: `Turns 18 on ${formatDateObject(eighteenthBirthday)}` }
  }

  return { age, tone: 'child', label: `Age ${age}` }
}

function isActiveChild(child) {
  const age = getAgeFromDateOfBirth(child?.date_of_birth)
  return age !== null && age < 18
}

const interestOptions = [
  { value: 'volunteering', label: 'Volunteering' },
  { value: 'parish_groups', label: 'Parish Groups' },
  { value: 'sacramental_preparation', label: 'Sacramental Preparation' },
  { value: 'weekly_newsletter', label: 'Weekly Newsletter' },
]

function matchesRecentDate(value, filter) {
  if (!filter) {
    return true
  }

  if (!value) {
    return false
  }

  const date = new Date(value)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (filter === 'today') {
    return date >= startOfToday
  }

  const days = filter === '7_days' ? 7 : 30
  const threshold = new Date(startOfToday)
  threshold.setDate(threshold.getDate() - (days - 1))

  return date >= threshold
}

function initialRegistrationForm(registration) {
  return {
    full_name: registration?.full_name || '',
    email: registration?.email || '',
    phone: registration?.phone || '',
    partner_name: registration?.partner_name || '',
    children: registration?.children?.length
      ? registration.children.map(child => ({
          child_name: child.child_name || '',
          date_of_birth: child.date_of_birth || '',
        }))
      : [{ child_name: '', date_of_birth: '' }],
    volunteering: Boolean(registration?.interest?.volunteering),
    parish_groups: Boolean(registration?.interest?.parish_groups),
    sacramental_preparation: Boolean(registration?.interest?.sacramental_preparation),
    weekly_newsletter: Boolean(registration?.interest?.weekly_newsletter),
  }
}

function FieldError({ errors, name }) {
  if (!errors?.[name]?.[0]) {
    return null
  }

  return <p className="admin-field-error">{errors[name][0]}</p>
}

export default function AdminRegistrationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const editorRef = useRef(null)
  const [registrations, setRegistrations] = useState([])
  const [registrationMeta, setRegistrationMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [selectedRegistrationId, setSelectedRegistrationId] = useState(null)
  const [registrationDetail, setRegistrationDetail] = useState(null)
  const [registrationForm, setRegistrationForm] = useState(initialRegistrationForm(null))
  const [isEditingRegistration, setIsEditingRegistration] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingRegistration, setIsLoadingRegistration] = useState(false)
  const [isSavingRegistration, setIsSavingRegistration] = useState(false)
  const [registrationErrors, setRegistrationErrors] = useState({})
  const [dialogState, setDialogState] = useState({
    open: false,
    tone: 'neutral',
    title: '',
    message: '',
  })
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [confirmRemoveChildIndex, setConfirmRemoveChildIndex] = useState(null)
  const [registrationSearch, setRegistrationSearch] = useState('')
  const [registrationTypeFilter, setRegistrationTypeFilter] = useState('')
  const [registrationInterestFilter, setRegistrationInterestFilter] = useState('')
  const [registrationChildrenFilter, setRegistrationChildrenFilter] = useState('')
  const [registrationDateFilter, setRegistrationDateFilter] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadData() {
      const payload = await listRegistrations(1)

      if (ignore) {
        return
      }

      const items = payload.registrations || []
      setRegistrations(items)
      setRegistrationMeta(payload.meta || { current_page: 1, last_page: 1, total: 0 })

      const querySelected = searchParams.get('selected')
      const nextId = querySelected ? Number(querySelected) : null
      if (nextId) {
        setSelectedRegistrationId(nextId)
        setIsModalOpen(true)
      }
    }

    loadData()

    return () => {
      ignore = true
    }
  }, [searchParams])

  useEffect(() => {
    const selected = searchParams.get('selected')

    if (selected) {
      setSelectedRegistrationId(Number(selected))
      setIsModalOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (!selectedRegistrationId) {
      return
    }

    focusAdminEditor(editorRef)
  }, [selectedRegistrationId])

  useEffect(() => {
    let ignore = false

    async function loadRegistrationDetail() {
      if (!selectedRegistrationId) {
        setRegistrationDetail(null)
        return
      }

      setIsLoadingRegistration(true)

      try {
        const payload = await getRegistration(selectedRegistrationId)

        if (!ignore) {
          setRegistrationDetail(payload.registration || null)
          setRegistrationForm(initialRegistrationForm(payload.registration))
          setRegistrationErrors({})
          setIsEditingRegistration(false)
        }
      } catch (error) {
        if (!ignore) {
          setDialogState({
            open: true,
            tone: 'error',
            title: 'Unable to load registration',
            message: error.message || 'The selected registration could not be opened.',
          })
        }
      } finally {
        if (!ignore) {
          setIsLoadingRegistration(false)
        }
      }
    }

    loadRegistrationDetail()

    return () => {
      ignore = true
    }
  }, [selectedRegistrationId])

  function closeModal() {
    setIsModalOpen(false)
    setSearchParams({})
  }

  function closeDialog() {
    setDialogState(current => ({ ...current, open: false }))
  }

  function openDialog(tone, title, message) {
    setDialogState({ open: true, tone, title, message })
  }

  async function refreshRegistrations(page = registrationMeta.current_page || 1) {
    const payload = await listRegistrations(page)
    const items = payload.registrations || []
    setRegistrations(items)
    setRegistrationMeta(payload.meta || { current_page: page, last_page: 1, total: 0 })
  }

  function handleRegistrationChange(event) {
    const { name, value, type, checked } = event.target
    const nextValue = type === 'checkbox' ? checked : value
    const nextErrors = {}

    if (name === 'full_name') {
      validateNameText(nextErrors, 'full_name', value, 'Full name', true)
      validateMaxLength(nextErrors, 'full_name', value, 255, 'Full name')
    } else if (name === 'email') {
      validateEmail(nextErrors, 'email', value)
    } else if (name === 'phone') {
      validatePhone(nextErrors, 'phone', value, 'Phone', true)
    } else if (name === 'partner_name') {
      validateNameText(nextErrors, 'partner_name', value, 'Partner name')
      validateMaxLength(nextErrors, 'partner_name', value, 255, 'Partner name')
    }

    setRegistrationForm({
      ...registrationForm,
      [name]: nextValue,
    })
    setRegistrationErrors(current => ({ ...current, [name]: nextErrors[name] }))
  }

  function formatRegistrationField(name) {
    setRegistrationForm(current => ({
      ...current,
      [name]: titleCaseWords(current[name] || ''),
    }))
  }

  function validateRegistrationChild(child, index) {
    const nextErrors = {}
    const hasName = child.child_name.trim() !== ''
    const hasDateOfBirth = String(child.date_of_birth).trim() !== ''

    if (!hasName && hasDateOfBirth) {
      nextErrors[`children.${index}.child_name`] = asError('Child name is required when date of birth is entered.')
    }

    if (hasName) {
      validateNameText(nextErrors, `children.${index}.child_name`, child.child_name, 'Child name')
    }

    if (hasName && !hasDateOfBirth) {
      nextErrors[`children.${index}.date_of_birth`] = asError('Child date of birth is required when name is entered.')
    }

    if (hasDateOfBirth) {
      const today = new Date().toISOString().slice(0, 10)

      if (child.date_of_birth > today) {
        nextErrors[`children.${index}.date_of_birth`] = asError('Child date of birth cannot be in the future.')
      }
    }

    return nextErrors
  }

  function handleChildChange(index, field, value) {
    const nextChildren = registrationForm.children.map((child, childIndex) =>
      childIndex === index ? { ...child, [field]: value } : child,
    )
    const childErrors = validateRegistrationChild(nextChildren[index], index)

    setRegistrationForm({
      ...registrationForm,
      children: nextChildren,
    })
    setRegistrationErrors(current => ({
      ...current,
      [`children.${index}.child_name`]: childErrors[`children.${index}.child_name`],
      [`children.${index}.date_of_birth`]: childErrors[`children.${index}.date_of_birth`],
    }))
  }

  function formatChildField(index, field) {
    setRegistrationForm(current => ({
      ...current,
      children: current.children.map((child, childIndex) =>
        childIndex === index ? { ...child, [field]: titleCaseWords(child[field] || '') } : child,
      ),
    }))
  }

  function addChildRow() {
    setRegistrationForm(current => ({
      ...current,
      children: [...current.children, { child_name: '', date_of_birth: '' }],
    }))
  }

  function removeChildRow(index) {
    setRegistrationForm(current => ({
      ...current,
      children: current.children.filter((_, childIndex) => childIndex !== index),
    }))
    setConfirmRemoveChildIndex(null)
  }

  function startAddingChild() {
    if (!registrationDetail) {
      return
    }

    if (registrationDetail.registration_type === 'individual') {
      openDialog('error', 'Children are only available for family registrations', 'Switch this record to a family registration before adding children to it.')
      return
    }

    setRegistrationForm(current => ({
      ...current,
      children: [...current.children, { child_name: '', date_of_birth: '' }],
    }))
    setRegistrationErrors({})
    setIsEditingRegistration(true)
  }

  async function saveRegistration(event) {
    event.preventDefault()
    if (!registrationDetail) {
      return
    }

    const validationErrors = validateRegistrationEditForm()
    setRegistrationErrors(validationErrors)

    if (hasErrors(validationErrors)) {
      openDialog('error', 'Please check the registration form', 'Fix the highlighted fields before saving this registration.')
      return
    }

    setIsSavingRegistration(true)

    const payload = {
      ...registrationForm,
      children: registrationForm.children.filter(child => child.child_name.trim()),
    }

    try {
      const response = await updateRegistration(registrationDetail.id, payload)
      setRegistrationDetail(response.registration || null)
      setRegistrationForm(initialRegistrationForm(response.registration))
      setRegistrationErrors({})
      setIsEditingRegistration(false)
      await refreshRegistrations()
      openDialog('success', 'Registration updated successfully', response.message || 'The parish registration has been updated.')
    } catch (error) {
      openDialog('error', 'Unable to update registration', error.message || 'Please review the registration details and try again.')
    } finally {
      setIsSavingRegistration(false)
    }
  }

  function validateRegistrationEditForm() {
    const nextErrors = {}

    validateNameText(nextErrors, 'full_name', registrationForm.full_name, 'Full name', true)
    validateMaxLength(nextErrors, 'full_name', registrationForm.full_name, 255, 'Full name')
    validateEmail(nextErrors, 'email', registrationForm.email)
    validatePhone(nextErrors, 'phone', registrationForm.phone, 'Phone', true)
    validateNameText(nextErrors, 'partner_name', registrationForm.partner_name, 'Partner name')
    validateMaxLength(nextErrors, 'partner_name', registrationForm.partner_name, 255, 'Partner name')

    registrationForm.children.forEach((child, index) => {
      const hasName = child.child_name.trim() !== ''
      const hasDateOfBirth = String(child.date_of_birth).trim() !== ''

      if (!hasName && hasDateOfBirth) {
        nextErrors[`children.${index}.child_name`] = asError('Child name is required when date of birth is entered.')
      }

      if (hasName && !hasDateOfBirth) {
        nextErrors[`children.${index}.date_of_birth`] = asError('Child date of birth is required when name is entered.')
      }

      if (hasName) {
        validateNameText(nextErrors, `children.${index}.child_name`, child.child_name, 'Child name')
      }

      if (hasDateOfBirth) {
        const today = new Date().toISOString().slice(0, 10)

        if (child.date_of_birth > today) {
          nextErrors[`children.${index}.date_of_birth`] = asError('Child date of birth cannot be in the future.')
        }
      }
    })

    return nextErrors
  }

  async function removeRegistration(id) {
    try {
      const payload = await deleteRegistration(id)
      await refreshRegistrations()
      openDialog('success', 'Registration deleted successfully', payload.message || 'The parish registration has been removed.')
    } catch (error) {
      openDialog('error', 'Unable to delete registration', error.message || 'The registration could not be deleted at this time.')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  const registrationTypes = Array.from(new Set(registrations.map(item => item.registration_type).filter(Boolean))).sort((a, b) => a.localeCompare(b))
  const filteredRegistrations = registrations.filter(item => {
    const query = registrationSearch.trim().toLowerCase()
    const matchesQuery = query
      ? `${item.full_name} ${item.member_id || ''} ${item.email || ''} ${item.partner_name || ''}`.toLowerCase().includes(query)
      : true
    const matchesType = registrationTypeFilter ? item.registration_type === registrationTypeFilter : true
    const matchesInterest = registrationInterestFilter ? Boolean(item.interest?.[registrationInterestFilter]) : true
    const childCount = Array.isArray(item.children) ? item.children.filter(isActiveChild).length : 0
    const matchesChildren = registrationChildrenFilter === 'with_children'
      ? childCount > 0
      : registrationChildrenFilter === 'without_children'
        ? childCount === 0
        : true
    const matchesDate = matchesRecentDate(item.created_at, registrationDateFilter)

    return matchesQuery && matchesType && matchesInterest && matchesChildren && matchesDate
  })

  return (
    <div className="admin-page-grid">
      <article className="admin-surface">
          <div className="admin-section-head">
            <div>
              <h2>Parish Registrations</h2>
              <p>Review member details and keep parish records tidy.</p>
            </div>
          </div>

          <div className="admin-filter-bar">
            <input
              type="search"
              className="admin-filter-input"
              placeholder="Search registrations..."
              value={registrationSearch}
              onChange={event => setRegistrationSearch(event.target.value)}
            />
            <select className="admin-filter-select" value={registrationTypeFilter} onChange={event => setRegistrationTypeFilter(event.target.value)}>
              <option value="">All types</option>
              {registrationTypes.map(type => <option key={type} value={type}>{formatTypeLabel(type)}</option>)}
            </select>
            <select className="admin-filter-select" value={registrationInterestFilter} onChange={event => setRegistrationInterestFilter(event.target.value)}>
              <option value="">All interests</option>
              {interestOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select className="admin-filter-select" value={registrationChildrenFilter} onChange={event => setRegistrationChildrenFilter(event.target.value)}>
              <option value="">Any children</option>
              <option value="with_children">With children</option>
              <option value="without_children">Without children</option>
            </select>
            <select className="admin-filter-select" value={registrationDateFilter} onChange={event => setRegistrationDateFilter(event.target.value)}>
              <option value="">Any submitted date</option>
              <option value="today">Today</option>
              <option value="7_days">Last 7 days</option>
              <option value="30_days">Last 30 days</option>
            </select>
          </div>

          <div className="admin-data-table">
            {filteredRegistrations.length ? (
              <div className="admin-table-header admin-row-registrations" aria-hidden="true">
                <span>Member & ID</span>
                <span>Contact & Registration Type</span>
              </div>
            ) : null}
            {filteredRegistrations.map(item => (
              <button
                key={item.id}
                type="button"
                className={`admin-row admin-row-clickable admin-row-registrations ${selectedRegistrationId === item.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedRegistrationId(item.id)
                  setSearchParams({ selected: String(item.id) })
                  setIsModalOpen(true)
                }}
              >
                <div>
                  <strong>{formatDisplayText(item.full_name)}</strong>
                  <span>{item.member_id}</span>
                </div>
                <div>
                  <small>{item.email}</small>
                  <span className="admin-badge">{formatTypeLabel(item.registration_type)}</span>
                </div>
              </button>
            ))}
            {!filteredRegistrations.length ? <p className="admin-empty">{registrations.length ? 'No registrations match the current search or filters.' : 'No registrations are available.'}</p> : null}
          </div>

          <div className="admin-pagination">
            <button className="btn-outline" type="button" onClick={() => refreshRegistrations(Math.max(1, registrationMeta.current_page - 1))} disabled={registrationMeta.current_page <= 1}>
              Previous
            </button>
            <span>Page {registrationMeta.current_page} of {registrationMeta.last_page}</span>
            <button className="btn-outline" type="button" onClick={() => refreshRegistrations(Math.min(registrationMeta.last_page, registrationMeta.current_page + 1))} disabled={registrationMeta.current_page >= registrationMeta.last_page}>
              Next
            </button>
          </div>
        </article>

      <AdminModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Registration Details"
        subtitle={isLoadingRegistration ? 'Loading registration...' : 'Review the record or switch into edit mode.'}
      >
        <div ref={editorRef} id="admin-editor">
          {registrationDetail ? (
            <div className="admin-actions" style={{ marginBottom: '24px' }}>
              <button className="btn-outline" type="button" onClick={() => setIsEditingRegistration(current => !current)}>
                {isEditingRegistration ? 'Cancel Edit' : 'Edit'}
              </button>
              <button className="btn-primary" type="button" onClick={() => setConfirmDeleteId(registrationDetail.id)}>
                Delete
              </button>
            </div>
          ) : null}

        {!registrationDetail && !isLoadingRegistration ? <p className="admin-empty">Select a registration to view details.</p> : null}

        {registrationDetail && !isEditingRegistration ? (
          <div className="admin-detail-grid">
            <div className="admin-detail-card">
              <span>Member ID</span>
              <strong>{registrationDetail.member_id}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Type</span>
              <strong>{formatTypeLabel(registrationDetail.registration_type)}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Signed Date</span>
              <strong>{formatDate(registrationDetail.signed_date)}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Contact</span>
              <strong>{registrationDetail.email}</strong>
            </div>

            <article className="admin-detail-block">
              <h3>Member Information</h3>
              <p>{formatDisplayText(registrationDetail.full_name)}</p>
              <p>{registrationDetail.phone}</p>
              <p>{formatDisplayText(registrationDetail.partner_name, 'No partner listed')}</p>
              <p>
                {formatDisplayText(registrationDetail.address_line1, '')}
                {registrationDetail.address_line2 ? `, ${formatDisplayText(registrationDetail.address_line2, '')}` : ''}
                , {formatDisplayText(registrationDetail.city, '')}, {String(registrationDetail.postcode || '').toUpperCase()}
              </p>
            </article>

            <article className="admin-detail-block">
              <h3>Children</h3>
              {registrationDetail.children?.length ? (
                <ul className="admin-inline-list">
                  {registrationDetail.children.map(child => {
                    const ageStatus = getChildAgeStatus(child.date_of_birth)

                    return (
                      <li key={child.id || child.date_of_birth || child.child_name} className={`admin-age-alert ${ageStatus.tone !== 'child' ? `is-${ageStatus.tone}` : ''}`}>
                        <span>{formatDisplayText(child.child_name)} ({child.date_of_birth ? formatDate(child.date_of_birth) : 'DOB not provided'})</span>
                        <strong>{ageStatus.label}</strong>
                      </li>
                    )
                  })}
                </ul>
              ) : <p>No children listed yet.</p>}
              {registrationDetail.registration_type !== 'individual' ? (
                <button type="button" className="admin-link-btn" onClick={startAddingChild}>
                  Add another child
                </button>
              ) : null}
            </article>

            <article className="admin-detail-block">
              <h3>Interests</h3>
              <ul className="admin-inline-list">
                {registrationDetail.interest?.volunteering ? <li>Volunteering</li> : null}
                {registrationDetail.interest?.parish_groups ? <li>Parish Groups</li> : null}
                {registrationDetail.interest?.sacramental_preparation ? <li>Sacramental Preparation</li> : null}
                {registrationDetail.interest?.weekly_newsletter ? <li>Weekly Newsletter</li> : null}
                {!registrationDetail.interest?.volunteering &&
                !registrationDetail.interest?.parish_groups &&
                !registrationDetail.interest?.sacramental_preparation &&
                !registrationDetail.interest?.weekly_newsletter ? <li>No interests recorded.</li> : null}
              </ul>
            </article>
          </div>
        ) : null}

        {registrationDetail && isEditingRegistration ? (
          <form className="admin-form" onSubmit={saveRegistration} noValidate>
            <div className="admin-form-group">
              <h3 className="admin-form-group-head">Member Information</h3>
              <div className="admin-form-grid">
                <label>
                  <span>Full name</span>
                  <input name="full_name" value={registrationForm.full_name} onChange={handleRegistrationChange} onBlur={() => formatRegistrationField('full_name')} aria-invalid={Boolean(registrationErrors.full_name)} />
                  <FieldError errors={registrationErrors} name="full_name" />
                </label>

                <label>
                  <span>Email</span>
                  <input type="email" name="email" value={registrationForm.email} onChange={handleRegistrationChange} aria-invalid={Boolean(registrationErrors.email)} />
                  <FieldError errors={registrationErrors} name="email" />
                </label>
              </div>

              <div className="admin-form-grid">
                <label>
                  <span>Phone</span>
                  <input name="phone" value={registrationForm.phone} onChange={handleRegistrationChange} aria-invalid={Boolean(registrationErrors.phone)} />
                  <FieldError errors={registrationErrors} name="phone" />
                </label>

                <label>
                  <span>Partner name</span>
                  <input name="partner_name" value={registrationForm.partner_name} onChange={handleRegistrationChange} onBlur={() => formatRegistrationField('partner_name')} aria-invalid={Boolean(registrationErrors.partner_name)} />
                  <FieldError errors={registrationErrors} name="partner_name" />
                </label>
              </div>
            </div>

            <div className="admin-form-group">
              <h3 className="admin-form-group-head">Children Records</h3>
              <div className="admin-panel">
                <p className="admin-panel-copy">Add or remove children here when the family registration needs extra people attached to it.</p>
                <div className="admin-children-list">
                  {registrationForm.children.map((child, index) => {
                    const ageStatus = getChildAgeStatus(child.date_of_birth)

                    return (
                      <div key={index} className={`admin-child-row ${ageStatus.tone !== 'child' ? `is-${ageStatus.tone}` : ''}`}>
                        <div>
                          <span className="admin-child-field-label">Child name</span>
                          <input placeholder="Child name" value={child.child_name} onChange={event => handleChildChange(index, 'child_name', event.target.value)} onBlur={() => formatChildField(index, 'child_name')} aria-invalid={Boolean(registrationErrors[`children.${index}.child_name`])} />
                          <FieldError errors={registrationErrors} name={`children.${index}.child_name`} />
                        </div>
                        <div>
                          <span className="admin-child-field-label">Date of birth</span>
                          <input type="date" value={child.date_of_birth} onChange={event => handleChildChange(index, 'date_of_birth', event.target.value)} aria-invalid={Boolean(registrationErrors[`children.${index}.date_of_birth`])} />
                          <FieldError errors={registrationErrors} name={`children.${index}.date_of_birth`} />
                        </div>
                        <button type="button" className="admin-link-btn danger" onClick={() => setConfirmRemoveChildIndex(index)}>
                          Remove
                        </button>
                        {ageStatus.tone === 'adult' || ageStatus.tone === 'soon' ? <p className="admin-child-age-note">{ageStatus.label}</p> : null}
                      </div>
                    )
                  })}
                </div>
                <button type="button" className="admin-link-btn" onClick={addChildRow}>Add child</button>
              </div>
            </div>

            <div className="admin-form-group">
              <h3 className="admin-form-group-head">Parish Interests</h3>
              <div className="admin-check-grid">
                <label className="admin-checkbox">
                  <input type="checkbox" name="volunteering" checked={registrationForm.volunteering} onChange={handleRegistrationChange} />
                  <span>Volunteering</span>
                </label>
                <label className="admin-checkbox">
                  <input type="checkbox" name="parish_groups" checked={registrationForm.parish_groups} onChange={handleRegistrationChange} />
                  <span>Parish groups</span>
                </label>
                <label className="admin-checkbox">
                  <input type="checkbox" name="sacramental_preparation" checked={registrationForm.sacramental_preparation} onChange={handleRegistrationChange} />
                  <span>Sacramental preparation</span>
                </label>
                <label className="admin-checkbox">
                  <input type="checkbox" name="weekly_newsletter" checked={registrationForm.weekly_newsletter} onChange={handleRegistrationChange} />
                  <span>Weekly newsletter</span>
                </label>
              </div>
            </div>

            <div className="admin-actions">
              <button className="btn-primary" type="submit" disabled={isSavingRegistration}>
                {isSavingRegistration ? 'Saving...' : 'Save Changes'}
              </button>
              <button className="btn-outline" type="button" onClick={() => setIsEditingRegistration(false)}>Cancel</button>
            </div>
          </form>
        ) : null}
        </div>
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
        title="Delete this parish registration?"
        message="This will permanently remove the parishioner record and its related details."
        confirmLabel="Delete Registration"
        cancelLabel="Keep Registration"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => removeRegistration(confirmDeleteId)}
      />
      <FeedbackDialog
        open={confirmRemoveChildIndex !== null}
        tone="neutral"
        variant="confirm"
        title="Remove this child?"
        message="This child will be removed from the registration when you save the changes."
        confirmLabel="Remove Child"
        cancelLabel="Keep Child"
        onClose={() => setConfirmRemoveChildIndex(null)}
        onConfirm={() => removeChildRow(confirmRemoveChildIndex)}
      />
    </div>
  )
}
