import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import FeedbackDialog from '../../components/FeedbackDialog'
import { createEvent, deleteEvent, getEvent, listEvents, listEventsByDate, updateEvent } from '../../lib/admin'
import { getBackendUrl } from '../../lib/auth'
import { focusAdminEditor } from '../../lib/adminEditorFocus'
import { compressImageFile } from '../../lib/imageCompression'
import { capitalizeFirst, titleCaseWords } from '../../lib/textFormat'
import { countWords, hasErrors, requireField, validateDateOrder, validateMaxLength, validateTimeOrder, validateWordLimit } from '../../lib/validation'
import AdminModal from '../../components/AdminModal'

const eventLocationOptions = [
  { value: '', label: 'Select a location' },
  { value: "St Mary's Cathedral", label: 'Cathedral' },
  { value: 'Cathedral Hall', label: 'Cathedral Hall' },
  { value: 'Coedpoeth', label: 'Coedpoeth' },
  { value: 'Parish Centre', label: 'Parish Centre' },
  { value: 'Presbytery', label: 'Presbytery' },
  { value: 'Other', label: 'Other location' },
]

const emptyEventForm = {
  title: '',
  description: '',
  start_date: '',
  start_time: '',
  end_date: '',
  end_time: '',
  location: '',
  status: 'published',
  category: '',
  all_day: false,
}

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

function matchesEventDateFilter(value, filter) {
  if (!filter) {
    return true
  }

  if (!value) {
    return false
  }

  const date = new Date(`${value}T00:00:00`)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (filter === 'upcoming') {
    return date >= today
  }

  if (filter === 'past') {
    return date < today
  }

  const nextMonth = new Date(today)
  nextMonth.setDate(nextMonth.getDate() + 30)

  return date >= today && date <= nextMonth
}

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

const maxImageSize = 2 * 1024 * 1024

function isImageFile(file) {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file?.type)
}

function getLocationOptionValue(location) {
  if (!location) {
    return ''
  }

  return eventLocationOptions.some(option => option.value === location) ? location : 'Other'
}

function FieldHint({ current, max }) {
  return <p className="admin-field-hint">{current}/{max} words</p>
}

export default function AdminEventsPage() {
  const { user } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const fileInputRef = useRef(null)
  const editorRef = useRef(null)
  const [events, setEvents] = useState([])
  const [eventMeta, setEventMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [eventPreview, setEventPreview] = useState([])
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [eventForm, setEventForm] = useState(emptyEventForm)
  const [selectedLocationOption, setSelectedLocationOption] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [removeExistingImage, setRemoveExistingImage] = useState(false)
  const [eventErrors, setEventErrors] = useState({})
  const [dialogState, setDialogState] = useState({
    open: false,
    tone: 'neutral',
    title: '',
    message: '',
  })
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [isSavingEvent, setIsSavingEvent] = useState(false)
  const [isLoadingEventEditor, setIsLoadingEventEditor] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [eventSearch, setEventSearch] = useState('')
  const [eventStatusFilter, setEventStatusFilter] = useState('')
  const [eventLocationFilter, setEventLocationFilter] = useState('')
  const [eventGroupFilter, setEventGroupFilter] = useState('')
  const [eventDateFilter, setEventDateFilter] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadEventsData() {
      const payload = await listEvents(1)

      if (!ignore) {
        setEvents(payload.events || [])
        setEventMeta(payload.meta || { current_page: 1, last_page: 1, total: 0 })
      }
    }

    loadEventsData()

    return () => {
      ignore = true
    }
  }, [])

  const editEvent = useCallback(async (id) => {
    setIsLoadingEventEditor(true)

    try {
      const payload = await getEvent(id)
      const item = payload.event

      setSelectedEventId(id)
      setSelectedLocationOption(getLocationOptionValue(item.location))
      setEventForm({
        title: item.title || '',
        description: item.description || '',
        start_date: item.start_date || '',
        start_time: item.start_time ? item.start_time.slice(0, 5) : '',
        end_date: item.end_date || '',
        end_time: item.end_time ? item.end_time.slice(0, 5) : '',
        location: item.location || '',
        status: item.status || 'draft',
        category: item.category || '',
        all_day: item.start_time === '00:00:00' && item.end_time === '23:59:00',
      })
      setSelectedFile(null)
      setRemoveExistingImage(false)
      setEventErrors({})
      setSearchParams({ edit: String(id) })
      focusAdminEditor(editorRef)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setIsEditorOpen(true)
    } catch (error) {
      openDialog('error', 'Unable to load event', error.message || 'The selected event could not be opened.')
    } finally {
      setIsLoadingEventEditor(false)
    }
  }, [setSearchParams])

  useEffect(() => {
    const editId = searchParams.get('edit')

    if (!editId) {
      return
    }

    editEvent(Number(editId))
  }, [editEvent, searchParams])

  useEffect(() => {
    let ignore = false

    async function loadPreview() {
      if (!eventForm.start_date) {
        setEventPreview([])
        return
      }

      try {
        const data = await listEventsByDate(eventForm.start_date)

        if (!ignore) {
          setEventPreview((data || []).filter(item => item.id !== selectedEventId))
        }
      } catch {
        if (!ignore) {
          setEventPreview([])
        }
      }
    }

    loadPreview()

    return () => {
      ignore = true
    }
  }, [eventForm.start_date, selectedEventId])

  function closeDialog() {
    setDialogState(current => ({ ...current, open: false }))
  }

  function openDialog(tone, title, message) {
    setDialogState({ open: true, tone, title, message })
  }

  async function refreshEvents(page = eventMeta.current_page || 1) {
    const payload = await listEvents(page)
    setEvents(payload.events || [])
    setEventMeta(payload.meta || { current_page: page, last_page: 1, total: 0 })
  }

  function handleEventChange(event) {
    const { name, value, type, checked } = event.target
    const nextForm = {
      ...eventForm,
      [name]: type === 'checkbox' ? checked : value,
    }

    if (name === 'all_day') {
      nextForm.start_time = checked ? '00:00' : eventForm.start_time
      nextForm.end_time = checked ? '23:59' : eventForm.end_time
    }

    setEventForm(nextForm)
    setEventErrors(current => ({
      ...current,
      ...validateEventLiveFields(nextForm, name),
    }))
  }

  function formatEventField(name, formatter) {
    setEventForm(current => ({
      ...current,
      [name]: formatter(current[name] || ''),
    }))
  }

  function handleLocationSelect(event) {
    const { value } = event.target
    const nextLocation = value === 'Other'
      ? (getLocationOptionValue(eventForm.location) === 'Other' ? eventForm.location : '')
      : value
    const nextForm = {
      ...eventForm,
      location: nextLocation,
    }

    setSelectedLocationOption(value)
    setEventForm(nextForm)
    setEventErrors(current => ({
      ...current,
      ...validateEventLiveFields(nextForm, 'location'),
    }))
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0] || null
    setRemoveExistingImage(false)

    if (!file) {
      setSelectedFile(null)
      setEventErrors(current => ({
        ...current,
        image: undefined,
      }))
      return
    }

    if (!isImageFile(file)) {
      setSelectedFile(null)
      setEventErrors(current => ({
        ...current,
        image: ['The event image must be a JPG, PNG, or WebP file.'],
      }))
      event.target.value = ''
      return
    }

    const preparedFile = await compressImageFile(file, { maxBytes: maxImageSize })

    if (preparedFile.size > maxImageSize) {
      setSelectedFile(null)
      setEventErrors(current => ({
        ...current,
        image: ['The event image is still too large after compression. Please choose one under 2 MB.'],
      }))
      event.target.value = ''
      return
    }

    setSelectedFile(preparedFile)
    setEventErrors(current => ({
      ...current,
      image: undefined,
    }))
  }

  function removeCurrentImage() {
    setSelectedFile(null)
    setRemoveExistingImage(true)
    setEventErrors(current => ({
      ...current,
      image: undefined,
    }))

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function startNewEvent() {
    setSelectedEventId(null)
    setEventForm(emptyEventForm)
    setSelectedLocationOption('')
    setSelectedFile(null)
    setRemoveExistingImage(false)
    setEventErrors({})
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

  async function submitEvent(event) {
    event.preventDefault()
    const validationErrors = validateEventForm()
    setEventErrors(validationErrors)

    if (hasErrors(validationErrors)) {
      openDialog('error', 'Please check the event form', 'Fix the highlighted fields before saving this event.')
      return
    }

    setIsSavingEvent(true)

    const payload = new FormData()
    payload.append('title', eventForm.title)
    payload.append('description', eventForm.description || '')
    payload.append('start_date', eventForm.start_date)
    payload.append('start_time', eventForm.start_time)
    payload.append('end_date', eventForm.end_date || '')
    payload.append('end_time', eventForm.end_time)
    payload.append('location', eventForm.location || '')
    payload.append('status', eventForm.status)
    payload.append('category', eventForm.category || '')
    payload.append('all_day', eventForm.all_day ? '1' : '0')

    if (selectedFile) {
      payload.append('image', selectedFile)
    }

    if (removeExistingImage) {
      payload.append('remove_image', '1')
    }

    try {
      const response = selectedEventId
        ? await updateEvent(selectedEventId, payload)
        : await createEvent(payload)

      await refreshEvents()
      setIsEditorOpen(false)
      openDialog('success', 'Event saved successfully', response.message || 'The event details have been saved and the form has been cleared.')
    } catch (error) {
      setEventErrors(error.errors || {})
      openDialog('error', 'Unable to save event', error.message || 'Please review the event details and try again.')
    } finally {
      setIsSavingEvent(false)
    }
  }

  function validateEventForm() {
    const nextErrors = {}

    requireField(nextErrors, 'title', eventForm.title, 'Title')
    validateWordLimit(nextErrors, 'title', eventForm.title, 50, 'Title')
    validateWordLimit(nextErrors, 'description', eventForm.description, 250, 'Description')
    requireField(nextErrors, 'start_date', eventForm.start_date, 'Start date')
    requireField(nextErrors, 'start_time', eventForm.start_time, 'Start time')
    requireField(nextErrors, 'end_time', eventForm.end_time, 'End time')
    validateDateOrder(nextErrors, 'end_date', eventForm.start_date, eventForm.end_date, 'End date must be on or after the start date.')
    validateTimeOrder(nextErrors, 'end_time', eventForm.start_time, eventForm.end_time, 'End time must be after start time.')
    validateMaxLength(nextErrors, 'location', eventForm.location, 255, 'Location')
    validateMaxLength(nextErrors, 'category', eventForm.category, 255, 'Category')

    if (selectedFile && !isImageFile(selectedFile)) {
      nextErrors.image = ['The event image must be a JPG, PNG, or WebP file.']
    }

    if (selectedFile && selectedFile.size > maxImageSize) {
      nextErrors.image = ['The event image must be 2 MB or smaller.']
    }

    if (!['draft', 'published'].includes(eventForm.status)) {
      nextErrors.status = ['Select a valid status.']
    }

    return nextErrors
  }

  function validateEventLiveFields(form, changedName) {
    const nextErrors = {}

    if (changedName === 'title') {
      requireField(nextErrors, 'title', form.title, 'Title')
      validateWordLimit(nextErrors, 'title', form.title, 50, 'Title')
    }

    if (changedName === 'description') {
      validateWordLimit(nextErrors, 'description', form.description, 250, 'Description')
    }

    if (changedName === 'start_date') {
      requireField(nextErrors, 'start_date', form.start_date, 'Start date')
      validateDateOrder(nextErrors, 'end_date', form.start_date, form.end_date, 'End date must be on or after the start date.')
    }

    if (changedName === 'end_date') {
      validateDateOrder(nextErrors, 'end_date', form.start_date, form.end_date, 'End date must be on or after the start date.')
    }

    if (changedName === 'start_time' || changedName === 'all_day') {
      requireField(nextErrors, 'start_time', form.start_time, 'Start time')
      validateTimeOrder(nextErrors, 'end_time', form.start_time, form.end_time, 'End time must be after start time.')
    }

    if (changedName === 'end_time' || changedName === 'all_day') {
      requireField(nextErrors, 'end_time', form.end_time, 'End time')
      validateTimeOrder(nextErrors, 'end_time', form.start_time, form.end_time, 'End time must be after start time.')
    }

    if (changedName === 'location') {
      validateMaxLength(nextErrors, 'location', form.location, 255, 'Location')
    }

    if (changedName === 'category') {
      validateMaxLength(nextErrors, 'category', form.category, 255, 'Category')
    }

    if (changedName === 'status' && !['draft', 'published'].includes(form.status)) {
      nextErrors.status = ['Select a valid status.']
    }

    return {
      [changedName]: nextErrors[changedName],
      description: changedName === 'description' ? nextErrors.description : undefined,
      end_date: changedName === 'start_date' || changedName === 'end_date' ? nextErrors.end_date : undefined,
      end_time: ['start_time', 'end_time', 'all_day'].includes(changedName) ? nextErrors.end_time : undefined,
      start_time: ['start_time', 'all_day'].includes(changedName) ? nextErrors.start_time : undefined,
    }
  }

  async function removeEvent(id) {
    try {
      const payload = await deleteEvent(id)
      await refreshEvents()

      if (selectedEventId === id) {
        startNewEvent()
      }

      openDialog('success', 'Event deleted successfully', payload.message || 'The event has been removed from the schedule.')
    } catch (error) {
      openDialog('error', 'Unable to delete event', error.message || 'The event could not be deleted at this time.')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  const eventLocations = Array.from(new Set(events.map(item => item.location).filter(Boolean))).sort((a, b) => a.localeCompare(b))
  const eventGroups = Array.from(new Set(events.map(item => item.group_name).filter(Boolean))).sort((a, b) => a.localeCompare(b))
  const selectedEvent = events.find(item => item.id === selectedEventId)
  const titleWordCount = countWords(eventForm.title)
  const descriptionWordCount = countWords(eventForm.description)
  const filteredEvents = events.filter(item => {
    const query = eventSearch.trim().toLowerCase()
    const matchesQuery = query
      ? `${item.title} ${item.description || ''} ${item.location || ''} ${item.category || ''} ${item.group_name || ''}`.toLowerCase().includes(query)
      : true
    const matchesStatus = eventStatusFilter ? item.status === eventStatusFilter : true
    const matchesLocation = eventLocationFilter ? item.location === eventLocationFilter : true
    const matchesGroup = user?.is_main_admin && eventGroupFilter ? item.group_name === eventGroupFilter : true
    const matchesDate = matchesEventDateFilter(item.start_date, eventDateFilter)

    return matchesQuery && matchesStatus && matchesLocation && matchesGroup && matchesDate
  })

  return (
    <div className="admin-page-grid">
      <article className="admin-surface">
          <div className="admin-section-head">
            <div>
              <h2>Event Management</h2>
              <p>Create, schedule, and publish events for the cathedral website.</p>
            </div>
            <button className="btn-primary" type="button" onClick={startNewEvent}>New Event</button>
          </div>

          <div className="admin-filter-bar">
            <input
              type="search"
              className="admin-filter-input"
              placeholder="Search events..."
              value={eventSearch}
              onChange={event => setEventSearch(event.target.value)}
            />
            {user?.is_main_admin ? (
              <select className="admin-filter-select" value={eventGroupFilter} onChange={event => setEventGroupFilter(event.target.value)}>
                <option value="">All groups</option>
                {eventGroups.map(group => <option key={group} value={group}>{group}</option>)}
              </select>
            ) : null}
            <select className="admin-filter-select" value={eventDateFilter} onChange={event => setEventDateFilter(event.target.value)}>
              <option value="">Any date</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
              <option value="next_30_days">Next 30 days</option>
            </select>
            <select className="admin-filter-select" value={eventStatusFilter} onChange={event => setEventStatusFilter(event.target.value)}>
              <option value="">Published and draft</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select className="admin-filter-select" value={eventLocationFilter} onChange={event => setEventLocationFilter(event.target.value)}>
              <option value="">All locations</option>
              {eventLocations.map(location => <option key={location} value={location}>{location}</option>)}
            </select>
          </div>

          <div className="admin-data-table">
            {filteredEvents.map(item => (
              <div key={item.id} className="admin-row admin-row-with-thumb">
                {item.admin_image_url || item.image_url ? (
                  <img
                    className="admin-event-thumb"
                    src={getBackendUrl(item.admin_image_url || item.image_url)}
                    alt={item.title}
                  />
                ) : (
                  <span className="admin-event-thumb admin-event-thumb-placeholder" aria-hidden="true" />
                )}
                <div>
                  <strong>{titleCaseWords(item.title || '')}</strong>
                  <span>{formatDateTime(item.start_date, item.start_time)}{item.group_name ? ` • ${titleCaseWords(item.group_name)}` : ''}</span>
                </div>
                <div>
                  <small>{item.location ? titleCaseWords(item.location) : 'Location not set'}</small>
                  <span className="admin-badge">{titleCaseWords(item.status || '')}</span>
                </div>
                <div className="admin-row-actions">
                  <button type="button" onClick={() => editEvent(item.id)}>Edit</button>
                  <button type="button" className="danger" onClick={() => setConfirmDeleteId(item.id)}>Delete</button>
                </div>
              </div>
            ))}
            {!filteredEvents.length ? <p className="admin-empty">{events.length ? 'No events match the current search or filters.' : 'No events have been created yet.'}</p> : null}
          </div>

          <div className="admin-pagination">
            <button
              className="btn-outline"
              type="button"
              onClick={() => refreshEvents(Math.max(1, eventMeta.current_page - 1))}
              disabled={eventMeta.current_page <= 1}
            >
              Previous
            </button>
            <span>Page {eventMeta.current_page} of {eventMeta.last_page}</span>
            <button
              className="btn-outline"
              type="button"
              onClick={() => refreshEvents(Math.min(eventMeta.last_page, eventMeta.current_page + 1))}
              disabled={eventMeta.current_page >= eventMeta.last_page}
            >
              Next
            </button>
          </div>
        </article>

      <AdminModal
        isOpen={isEditorOpen}
        onClose={closeEditor}
        title={selectedEventId ? 'Edit Event' : 'Create Event'}
        subtitle={isLoadingEventEditor ? 'Loading event...' : user?.is_main_admin ? 'Changes save directly to the backend.' : 'Group admins can create and update draft events for their own group.'}
      >
        <form className="admin-form" onSubmit={submitEvent} noValidate ref={editorRef}>
          <label>
            <span>Title</span>
            <input name="title" value={eventForm.title} onChange={handleEventChange} onBlur={() => formatEventField('title', titleCaseWords)} required aria-invalid={Boolean(eventErrors.title)} />
            <FieldHint current={titleWordCount} max={50} />
            <FieldError errors={eventErrors} name="title" />
          </label>

          <label>
            <span>Description</span>
            <textarea name="description" rows="4" value={eventForm.description} onChange={handleEventChange} onBlur={() => formatEventField('description', capitalizeFirst)} aria-invalid={Boolean(eventErrors.description)} />
            <FieldHint current={descriptionWordCount} max={250} />
            <FieldError errors={eventErrors} name="description" />
          </label>

          <label>
            <span>{selectedEventId ? 'Event photo or poster' : 'Upload event photo or poster'}</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              aria-invalid={Boolean(eventErrors.image)}
            />
            <FieldError errors={eventErrors} name="image" />
            <p className="admin-field-hint">Large images are compressed automatically.</p>
          </label>

          {selectedFile ? (
            <div className="admin-panel">
              <strong>Selected image</strong>
              <p>Selected uploaded image • {formatBytes(selectedFile.size)}</p>
            </div>
          ) : null}

          {(selectedEvent?.admin_image_url || selectedEvent?.image_url) && !selectedFile && !removeExistingImage ? (
            <div className="admin-panel">
              <strong>Current poster</strong>
              <div className="admin-member-preview">
                <img src={getBackendUrl(selectedEvent.admin_image_url || selectedEvent.image_url)} alt={selectedEvent.title} />
                <p>Current uploaded poster • {formatBytes(selectedEvent.image_size)}</p>
              </div>
              <button type="button" className="admin-link-btn danger" onClick={removeCurrentImage}>
                Remove current poster
              </button>
            </div>
          ) : null}

          {removeExistingImage ? (
            <div className="admin-panel">
              <strong>Current poster will be removed</strong>
              <p>Save the event to remove the existing uploaded poster from this event.</p>
            </div>
          ) : null}

          <div className="admin-form-grid">
            <label>
              <span>Start date</span>
              <input type="date" name="start_date" value={eventForm.start_date} onChange={handleEventChange} required aria-invalid={Boolean(eventErrors.start_date)} />
              <FieldError errors={eventErrors} name="start_date" />
            </label>

            <label>
              <span>End date</span>
              <input type="date" name="end_date" value={eventForm.end_date} onChange={handleEventChange} aria-invalid={Boolean(eventErrors.end_date)} />
              <FieldError errors={eventErrors} name="end_date" />
            </label>
          </div>

          <label className="admin-checkbox">
            <input type="checkbox" name="all_day" checked={eventForm.all_day} onChange={handleEventChange} />
            <span>All-day event</span>
          </label>

          <div className="admin-form-grid">
            <label>
              <span>Start time</span>
              <input type="time" name="start_time" value={eventForm.start_time} onChange={handleEventChange} readOnly={eventForm.all_day} required aria-invalid={Boolean(eventErrors.start_time)} />
              <FieldError errors={eventErrors} name="start_time" />
            </label>

            <label>
              <span>End time</span>
              <input type="time" name="end_time" value={eventForm.end_time} onChange={handleEventChange} readOnly={eventForm.all_day} required aria-invalid={Boolean(eventErrors.end_time)} />
              <FieldError errors={eventErrors} name="end_time" />
            </label>
          </div>

          <div className="admin-panel">
            <strong>Existing events on this date</strong>
            <ul>
              {eventPreview.length ? eventPreview.map(item => (
                <li key={item.id}>
                  {item.title} ({formatTime(item.start_time)} - {formatTime(item.end_time)})
                </li>
              )) : <li>No other events on the selected date.</li>}
            </ul>
          </div>

          <div className="admin-form-grid">
            <label>
              <span>Location</span>
              <select value={selectedLocationOption} onChange={handleLocationSelect} aria-invalid={Boolean(eventErrors.location)}>
                {eventLocationOptions.map(option => (
                  <option key={option.value || 'blank'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {selectedLocationOption === 'Other' ? (
                <input
                  name="location"
                  value={eventForm.location}
                  onChange={handleEventChange}
                  onBlur={() => formatEventField('location', titleCaseWords)}
                  placeholder="Enter the event location"
                  aria-invalid={Boolean(eventErrors.location)}
                />
              ) : null}
              <FieldError errors={eventErrors} name="location" />
            </label>

            <label>
              <span>Category</span>
              <input name="category" value={eventForm.category} onChange={handleEventChange} onBlur={() => formatEventField('category', titleCaseWords)} aria-invalid={Boolean(eventErrors.category)} />
              <FieldError errors={eventErrors} name="category" />
            </label>
          </div>

          <label>
            <span>Status</span>
            <select name="status" value={eventForm.status} onChange={handleEventChange} aria-invalid={Boolean(eventErrors.status)} disabled={!user?.is_main_admin}>
              {user?.is_main_admin ? <option value="published">Published</option> : null}
              <option value="draft">Draft</option>
            </select>
            <FieldError errors={eventErrors} name="status" />
          </label>

          <div className="admin-actions">
            <button className="btn-primary" type="submit" disabled={isSavingEvent}>
              {isSavingEvent ? 'Saving...' : selectedEventId ? 'Update Event' : 'Create Event'}
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
        title="Delete this event?"
        message="This action will permanently remove the event from the admin panel and website listings."
        confirmLabel="Delete Event"
        cancelLabel="Keep Event"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => removeEvent(confirmDeleteId)}
      />
    </div>
  )
}
