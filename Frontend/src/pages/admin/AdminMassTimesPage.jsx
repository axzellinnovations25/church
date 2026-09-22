import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import FeedbackDialog from '../../components/FeedbackDialog'
import { createMassTime, deleteMassTime, getMassTime, listMassTimes, listMassTimesByDay, updateMassTime } from '../../lib/admin'
import { focusAdminEditor } from '../../lib/adminEditorFocus'
import { capitalizeFirst, titleCaseWords } from '../../lib/textFormat'
import { hasErrors, requireField, validateMaxLength } from '../../lib/validation'
import AdminModal from '../../components/AdminModal'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const emptyMassTimeForm = {
  day: '',
  start_time: '',
  location: '',
  language: '',
  notes: '',
  status: 'draft',
}

function formatTime(value) {
  if (!value) {
    return 'Not set'
  }

  return value.slice(0, 5)
}

function FieldError({ errors, name }) {
  if (!errors?.[name]?.[0]) {
    return null
  }

  return <p className="admin-field-error">{errors[name][0]}</p>
}

export default function AdminMassTimesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const editorRef = useRef(null)
  const [massTimes, setMassTimes] = useState([])
  const [massTimeMeta, setMassTimeMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [massPreview, setMassPreview] = useState([])
  const [selectedMassTimeId, setSelectedMassTimeId] = useState(null)
  const [massTimeForm, setMassTimeForm] = useState(emptyMassTimeForm)
  const [massTimeErrors, setMassTimeErrors] = useState({})
  const [dialogState, setDialogState] = useState({
    open: false,
    tone: 'neutral',
    title: '',
    message: '',
  })
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [isSavingMassTime, setIsSavingMassTime] = useState(false)
  const [isLoadingMassTimeEditor, setIsLoadingMassTimeEditor] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [massSearch, setMassSearch] = useState('')
  const [massDayFilter, setMassDayFilter] = useState('')
  const [massStatusFilter, setMassStatusFilter] = useState('')
  const [massLocationFilter, setMassLocationFilter] = useState('')
  const [massLanguageFilter, setMassLanguageFilter] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadData() {
      const payload = await listMassTimes(1)

      if (!ignore) {
        setMassTimes(payload.mass_times || [])
        setMassTimeMeta(payload.meta || { current_page: 1, last_page: 1, total: 0 })
      }
    }

    loadData()

    return () => {
      ignore = true
    }
  }, [])

  const editMassTime = useCallback(async (id) => {
    setIsLoadingMassTimeEditor(true)

    try {
      const payload = await getMassTime(id)
      const item = payload.mass_time

      setSelectedMassTimeId(id)
      setMassTimeForm({
        day: item.day || '',
        start_time: item.start_time || '',
        location: item.location || '',
        language: item.language || '',
        notes: item.notes || '',
        status: item.status || 'draft',
      })
      setMassTimeErrors({})
      setSearchParams({ edit: String(id) })
      focusAdminEditor(editorRef)
      setIsEditorOpen(true)
    } catch (error) {
      openDialog('error', 'Unable to load Mass time', error.message || 'The selected Mass time could not be opened.')
    } finally {
      setIsLoadingMassTimeEditor(false)
    }
  }, [setSearchParams])

  useEffect(() => {
    const editId = searchParams.get('edit')

    if (!editId) {
      return
    }

    editMassTime(Number(editId))
  }, [editMassTime, searchParams])

  useEffect(() => {
    let ignore = false

    async function loadPreview() {
      if (!massTimeForm.day) {
        setMassPreview([])
        return
      }

      try {
        const data = await listMassTimesByDay(massTimeForm.day, massTimeForm.location)

        if (!ignore) {
          setMassPreview((data || []).filter(item => item.id !== selectedMassTimeId))
        }
      } catch {
        if (!ignore) {
          setMassPreview([])
        }
      }
    }

    loadPreview()

    return () => {
      ignore = true
    }
  }, [massTimeForm.day, massTimeForm.location, selectedMassTimeId])

  function closeDialog() {
    setDialogState(current => ({ ...current, open: false }))
  }

  function openDialog(tone, title, message) {
    setDialogState({ open: true, tone, title, message })
  }

  async function refreshMassTimes(page = massTimeMeta.current_page || 1) {
    const payload = await listMassTimes(page)
    setMassTimes(payload.mass_times || [])
    setMassTimeMeta(payload.meta || { current_page: page, last_page: 1, total: 0 })
  }

  function handleMassTimeChange(event) {
    const { name, value } = event.target
    const nextForm = { ...massTimeForm, [name]: value }
    const nextErrors = {}

    if (name === 'day') {
      requireField(nextErrors, 'day', value, 'Day')
      validateMaxLength(nextErrors, 'day', value, 20, 'Day')
    } else if (name === 'start_time') {
      requireField(nextErrors, 'start_time', value, 'Start time')
    } else if (name === 'location') {
      validateMaxLength(nextErrors, 'location', value, 100, 'Location')
    } else if (name === 'language') {
      validateMaxLength(nextErrors, 'language', value, 50, 'Language')
    } else if (name === 'notes') {
      validateMaxLength(nextErrors, 'notes', value, 1000, 'Notes')
    } else if (name === 'status' && !['draft', 'published'].includes(value)) {
      nextErrors.status = ['Select a valid status.']
    }

    setMassTimeForm(nextForm)
    setMassTimeErrors(current => ({ ...current, [name]: nextErrors[name] }))
  }

  function formatMassTimeField(name, formatter) {
    setMassTimeForm(current => ({
      ...current,
      [name]: formatter(current[name] || ''),
    }))
  }

  function startNewMassTime() {
    setSelectedMassTimeId(null)
    setMassTimeForm(emptyMassTimeForm)
    setMassTimeErrors({})
    setSearchParams({})
    focusAdminEditor(editorRef)
    setIsEditorOpen(true)
  }

  function closeEditor() {
    setIsEditorOpen(false)
    setSearchParams({})
  }

  async function submitMassTime(event) {
    event.preventDefault()
    const validationErrors = validateMassTimeForm()
    setMassTimeErrors(validationErrors)

    if (hasErrors(validationErrors)) {
      openDialog('error', 'Please check the Mass time form', 'Fix the highlighted fields before saving this Mass time.')
      return
    }

    setIsSavingMassTime(true)

    try {
      const payload = selectedMassTimeId
        ? await updateMassTime(selectedMassTimeId, massTimeForm)
        : await createMassTime(massTimeForm)

      await refreshMassTimes()
      startNewMassTime()
      setIsEditorOpen(false)
      openDialog('success', 'Mass time saved successfully', payload.message || 'The Mass time has been saved and the form has been cleared.')
    } catch (error) {
      setMassTimeErrors(error.errors || {})
      openDialog('error', 'Unable to save Mass time', error.message || 'Please review the Mass time details and try again.')
    } finally {
      setIsSavingMassTime(false)
    }
  }

  function validateMassTimeForm() {
    const nextErrors = {}

    requireField(nextErrors, 'day', massTimeForm.day, 'Day')
    requireField(nextErrors, 'start_time', massTimeForm.start_time, 'Start time')
    validateMaxLength(nextErrors, 'day', massTimeForm.day, 20, 'Day')
    validateMaxLength(nextErrors, 'location', massTimeForm.location, 100, 'Location')
    validateMaxLength(nextErrors, 'language', massTimeForm.language, 50, 'Language')
    validateMaxLength(nextErrors, 'notes', massTimeForm.notes, 1000, 'Notes')

    if (!['draft', 'published'].includes(massTimeForm.status)) {
      nextErrors.status = ['Select a valid status.']
    }

    return nextErrors
  }

  async function removeMassTime(id) {
    try {
      const payload = await deleteMassTime(id)
      await refreshMassTimes()

      if (selectedMassTimeId === id) {
        startNewMassTime()
      }

      openDialog('success', 'Mass time deleted successfully', payload.message || 'The Mass time has been removed.')
    } catch (error) {
      openDialog('error', 'Unable to delete Mass time', error.message || 'The Mass time could not be deleted at this time.')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  const massLocations = Array.from(new Set(massTimes.map(item => item.location).filter(Boolean))).sort((a, b) => a.localeCompare(b))
  const massLanguages = Array.from(new Set(massTimes.map(item => item.language).filter(Boolean))).sort((a, b) => a.localeCompare(b))
  const filteredMassTimes = massTimes.filter(item => {
    const query = massSearch.trim().toLowerCase()
    const matchesQuery = query
      ? `${item.day} ${item.location || ''} ${item.language || ''} ${item.notes || ''}`.toLowerCase().includes(query)
      : true
    const matchesDay = massDayFilter ? item.day === massDayFilter : true
    const matchesStatus = massStatusFilter ? item.status === massStatusFilter : true
    const matchesLocation = massLocationFilter ? item.location === massLocationFilter : true
    const matchesLanguage = massLanguageFilter ? item.language === massLanguageFilter : true

    return matchesQuery && matchesDay && matchesStatus && matchesLocation && matchesLanguage
  })

  return (
    <div className="admin-page-grid">
      <article className="admin-surface">
          <div className="admin-section-head">
            <div>
              <h2>Mass Time Management</h2>
              <p>Maintain the published worship timetable with proper clash checks.</p>
            </div>
            <button className="btn-primary" type="button" onClick={startNewMassTime}>New Mass Time</button>
          </div>

          <div className="admin-filter-bar">
            <input
              type="search"
              className="admin-filter-input"
              placeholder="Search Mass times..."
              value={massSearch}
              onChange={event => setMassSearch(event.target.value)}
            />
            <select className="admin-filter-select" value={massDayFilter} onChange={event => setMassDayFilter(event.target.value)}>
              <option value="">All days</option>
              {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
            <select className="admin-filter-select" value={massStatusFilter} onChange={event => setMassStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select className="admin-filter-select" value={massLocationFilter} onChange={event => setMassLocationFilter(event.target.value)}>
              <option value="">All locations</option>
              {massLocations.map(location => <option key={location} value={location}>{location}</option>)}
            </select>
            <select className="admin-filter-select" value={massLanguageFilter} onChange={event => setMassLanguageFilter(event.target.value)}>
              <option value="">All languages</option>
              {massLanguages.map(language => <option key={language} value={language}>{language}</option>)}
            </select>
          </div>

          <div className="admin-data-table">
            {filteredMassTimes.map(item => (
              <div key={item.id} className="admin-row">
                <div>
                  <strong>{item.day}</strong>
                  <span>{formatTime(item.start_time)}{item.language ? ` • ${titleCaseWords(item.language)}` : ''}</span>
                </div>
                <div>
                  <small>{item.location ? titleCaseWords(item.location) : 'Location not set'}</small>
                  <span className="admin-badge">{titleCaseWords(item.status || '')}</span>
                </div>
                <div className="admin-row-actions">
                  <button type="button" onClick={() => editMassTime(item.id)}>Edit</button>
                  <button type="button" className="danger" onClick={() => setConfirmDeleteId(item.id)}>Delete</button>
                </div>
              </div>
            ))}
            {!filteredMassTimes.length ? <p className="admin-empty">{massTimes.length ? 'No Mass times match the current search or filters.' : 'No Mass times found for this page.'}</p> : null}
          </div>

          <div className="admin-pagination">
            <button className="btn-outline" type="button" onClick={() => refreshMassTimes(Math.max(1, massTimeMeta.current_page - 1))} disabled={massTimeMeta.current_page <= 1}>
              Previous
            </button>
            <span>Page {massTimeMeta.current_page} of {massTimeMeta.last_page}</span>
            <button className="btn-outline" type="button" onClick={() => refreshMassTimes(Math.min(massTimeMeta.last_page, massTimeMeta.current_page + 1))} disabled={massTimeMeta.current_page >= massTimeMeta.last_page}>
              Next
            </button>
          </div>
        </article>

      <AdminModal
        isOpen={isEditorOpen}
        onClose={closeEditor}
        title={selectedMassTimeId ? 'Edit Mass Time' : 'Create Mass Time'}
        subtitle={isLoadingMassTimeEditor ? 'Loading Mass time...' : 'All clashes are checked by the backend.'}
      >
        <form className="admin-form" onSubmit={submitMassTime} noValidate ref={editorRef}>
          <label>
            <span>Day</span>
            <select name="day" value={massTimeForm.day} onChange={handleMassTimeChange} required aria-invalid={Boolean(massTimeErrors.day)}>
              <option value="">Select a day</option>
              {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
            </select>
            <FieldError errors={massTimeErrors} name="day" />
          </label>

          <label>
            <span>Start time</span>
            <input type="time" name="start_time" value={massTimeForm.start_time} onChange={handleMassTimeChange} required aria-invalid={Boolean(massTimeErrors.start_time)} />
            <FieldError errors={massTimeErrors} name="start_time" />
          </label>

          <div className="admin-panel">
            <strong>Existing Mass times</strong>
            <ul>
              {massPreview.length ? massPreview.map(item => (
                <li key={item.id}>
                  {item.language ? `${item.language} Mass` : 'Mass'} ({formatTime(item.start_time)})
                </li>
              )) : <li>No existing Mass times for this selection.</li>}
            </ul>
          </div>

          <label>
            <span>Location</span>
            <input name="location" value={massTimeForm.location} onChange={handleMassTimeChange} onBlur={() => formatMassTimeField('location', titleCaseWords)} placeholder="e.g. Cathedral" aria-invalid={Boolean(massTimeErrors.location)} />
            <FieldError errors={massTimeErrors} name="location" />
          </label>

          <label>
            <span>Language</span>
            <input name="language" value={massTimeForm.language} onChange={handleMassTimeChange} onBlur={() => formatMassTimeField('language', titleCaseWords)} placeholder="e.g. English" aria-invalid={Boolean(massTimeErrors.language)} />
            <FieldError errors={massTimeErrors} name="language" />
          </label>

          <label>
            <span>Notes</span>
            <textarea name="notes" rows="4" value={massTimeForm.notes} onChange={handleMassTimeChange} onBlur={() => formatMassTimeField('notes', capitalizeFirst)} aria-invalid={Boolean(massTimeErrors.notes)} />
            <FieldError errors={massTimeErrors} name="notes" />
          </label>

          <label>
            <span>Status</span>
            <select name="status" value={massTimeForm.status} onChange={handleMassTimeChange} aria-invalid={Boolean(massTimeErrors.status)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
            <FieldError errors={massTimeErrors} name="status" />
          </label>

          <div className="admin-actions">
            <button className="btn-primary" type="submit" disabled={isSavingMassTime}>
              {isSavingMassTime ? 'Saving...' : selectedMassTimeId ? 'Update Mass Time' : 'Create Mass Time'}
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
        title="Delete this Mass time?"
        message="This action will permanently remove the selected Mass time from the timetable."
        confirmLabel="Delete Mass Time"
        cancelLabel="Keep Mass Time"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => removeMassTime(confirmDeleteId)}
      />
    </div>
  )
}
