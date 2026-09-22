import { useCallback, useEffect, useRef, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import FeedbackDialog from '../../components/FeedbackDialog'
import {
  createGalleryImage,
  deleteGalleryImage,
  getGalleryImage,
  listGalleryImages,
  updateGalleryImage,
} from '../../lib/admin'
import { getBackendUrl } from '../../lib/auth'
import { focusAdminEditor } from '../../lib/adminEditorFocus'
import { compressImageFile } from '../../lib/imageCompression'
import { capitalizeFirst, titleCaseWords } from '../../lib/textFormat'
import { hasErrors, requireField, validateMaxLength } from '../../lib/validation'
import AdminModal from '../../components/AdminModal'

const emptyGalleryForm = {
  title: '',
  caption: '',
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
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file?.type) || /\.jfif$/i.test(file?.name || '')
}

function getGalleryImageUrl(image) {
  return image?.admin_image_url || image?.image_url || null
}

export default function AdminGalleryPage() {
  const { user } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const fileInputRef = useRef(null)
  const editorRef = useRef(null)
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryMeta, setGalleryMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [selectedImageId, setSelectedImageId] = useState(null)
  const [galleryForm, setGalleryForm] = useState(emptyGalleryForm)
  const [selectedFile, setSelectedFile] = useState(null)
  const [galleryErrors, setGalleryErrors] = useState({})
  const [gallerySearch, setGallerySearch] = useState('')
  const [visibilityFilter, setVisibilityFilter] = useState('')
  const [isSavingImage, setIsSavingImage] = useState(false)
  const [isLoadingEditor, setIsLoadingEditor] = useState(false)
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

    async function loadGallery() {
      try {
        const payload = await listGalleryImages(1)

        if (!ignore) {
          setGalleryImages(payload.gallery_images || [])
          setGalleryMeta(payload.meta || { current_page: 1, last_page: 1, total: 0 })
        }
      } catch (error) {
        if (!ignore) {
          openDialog('error', 'Unable to load gallery', error.message || 'The gallery image list could not be loaded.')
        }
      }
    }

    if (user?.is_main_admin) {
      loadGallery()
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

  const editImage = useCallback(async (id) => {
    setIsLoadingEditor(true)

    try {
      const payload = await getGalleryImage(id)
      const item = payload.gallery_image

      setSelectedImageId(id)
      setGalleryForm({
        title: item.title || '',
        caption: item.caption || '',
        sort_order: String(item.sort_order ?? 1),
        is_active: Boolean(item.is_active),
      })
      setSelectedFile(null)
      setGalleryErrors({})
      setSearchParams({ edit: String(id) })
      focusAdminEditor(editorRef)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setIsEditorOpen(true)
    } catch (error) {
      openDialog('error', 'Unable to load gallery image', error.message || 'The selected gallery image could not be opened.')
    } finally {
      setIsLoadingEditor(false)
    }
  }, [setSearchParams])

  useEffect(() => {
    const editId = searchParams.get('edit')

    if (!editId || !user?.is_main_admin) {
      return
    }

    editImage(Number(editId))
  }, [editImage, searchParams, user?.is_main_admin])

  const selectedImage = galleryImages.find(item => item.id === selectedImageId)

  async function refreshGallery(page = galleryMeta.current_page || 1) {
    const payload = await listGalleryImages(page)
    setGalleryImages(payload.gallery_images || [])
    setGalleryMeta(payload.meta || { current_page: page, last_page: 1, total: 0 })
  }

  function startNewImage() {
    setSelectedImageId(null)
    setGalleryForm({
      ...emptyGalleryForm,
      sort_order: String(galleryImages.length + 1),
    })
    setSelectedFile(null)
    setGalleryErrors({})
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

  function selectImage(id) {
    setSelectedImageId(id)
    editImage(id)
  }

  function handleGalleryChange(event) {
    const { name, value, type, checked } = event.target
    const nextForm = {
      ...galleryForm,
      [name]: type === 'checkbox' ? checked : value,
    }

    setGalleryForm(nextForm)
    setGalleryErrors(current => ({
      ...current,
      ...validateGalleryLiveFields(nextForm, name),
    }))
  }

  function formatGalleryField(name, formatter) {
    setGalleryForm(current => ({
      ...current,
      [name]: formatter(current[name] || ''),
    }))
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0] || null

    if (!file) {
      setSelectedFile(null)
      setGalleryErrors(current => ({
        ...current,
        image: selectedImageId ? undefined : ['Please upload a gallery image.'],
      }))
      return
    }

    if (!isImageFile(file)) {
      setSelectedFile(null)
      setGalleryErrors(current => ({
        ...current,
        image: ['The image must be a JPG, JFIF, PNG, or WebP file.'],
      }))
      event.target.value = ''
      return
    }

    const preparedFile = await compressImageFile(file, { maxBytes: maxImageSize })

    if (preparedFile.size > maxImageSize) {
      setSelectedFile(null)
      setGalleryErrors(current => ({
        ...current,
        image: ['The image is still too large after compression. Please choose one under 2 MB.'],
      }))
      event.target.value = ''
      return
    }

    setSelectedFile(preparedFile)
    setGalleryErrors(current => ({ ...current, image: undefined }))
  }

  function validateGalleryForm() {
    const nextErrors = {}

    requireField(nextErrors, 'title', galleryForm.title, 'Title')
    validateMaxLength(nextErrors, 'title', galleryForm.title, 255, 'Title')
    validateMaxLength(nextErrors, 'caption', galleryForm.caption, 1000, 'Caption')

    if (!selectedImageId && !selectedFile) {
      nextErrors.image = ['Please upload a gallery image.']
    }

    if (selectedFile && !isImageFile(selectedFile)) {
      nextErrors.image = ['The image must be a JPG, JFIF, PNG, or WebP file.']
    }

    if (selectedFile && selectedFile.size > maxImageSize) {
      nextErrors.image = ['The image must be 2 MB or smaller.']
    }

    if (!galleryForm.sort_order || Number(galleryForm.sort_order) < 1) {
      nextErrors.sort_order = ['Sort order must be 1 or higher.']
    }

    return nextErrors
  }

  function validateGalleryLiveFields(form, changedName) {
    const nextErrors = {}

    if (changedName === 'title') {
      requireField(nextErrors, 'title', form.title, 'Title')
      validateMaxLength(nextErrors, 'title', form.title, 255, 'Title')
    }

    if (changedName === 'caption') {
      validateMaxLength(nextErrors, 'caption', form.caption, 1000, 'Caption')
    }

    if (changedName === 'sort_order' && (!form.sort_order || Number(form.sort_order) < 1)) {
      nextErrors.sort_order = ['Sort order must be 1 or higher.']
    }

    return {
      [changedName]: nextErrors[changedName],
    }
  }

  async function submitGalleryImage(event) {
    event.preventDefault()
    const validationErrors = validateGalleryForm()
    setGalleryErrors(validationErrors)

    if (hasErrors(validationErrors)) {
      openDialog('error', 'Please check the gallery form', 'Fix the highlighted fields before saving this gallery image.')
      return
    }

    setIsSavingImage(true)

    const payload = new FormData()
    payload.append('title', galleryForm.title)
    payload.append('caption', galleryForm.caption || '')
    payload.append('sort_order', galleryForm.sort_order || '1')
    payload.append('is_active', galleryForm.is_active ? '1' : '0')

    if (selectedFile) {
      payload.append('image', selectedFile)
    }

    try {
      const response = selectedImageId
        ? await updateGalleryImage(selectedImageId, payload)
        : await createGalleryImage(payload)

      await refreshGallery()
      startNewImage()
      setIsEditorOpen(false)
      openDialog('success', 'Gallery image saved successfully', response.message || 'The gallery image has been saved.')
    } catch (error) {
      setGalleryErrors(error.errors || {})
      openDialog('error', 'Unable to save gallery image', error.message || 'Please review the gallery image details and try again.')
    } finally {
      setIsSavingImage(false)
    }
  }

  async function removeImage(id) {
    try {
      const payload = await deleteGalleryImage(id)
      await refreshGallery()

      if (selectedImageId === id) {
        startNewImage()
      }

      openDialog('success', 'Gallery image deleted successfully', payload.message || 'The gallery image has been removed.')
    } catch (error) {
      openDialog('error', 'Unable to delete gallery image', error.message || 'The gallery image could not be deleted at this time.')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  const sortOrderOptions = Array.from(
    { length: Math.max(1, selectedImageId ? galleryImages.length : galleryImages.length + 1) },
    (_, index) => String(index + 1)
  )
  const filteredImages = galleryImages.filter(item => {
    const query = gallerySearch.trim().toLowerCase()
    const matchesQuery = query
      ? `${item.title || ''} ${item.caption || ''}`.toLowerCase().includes(query)
      : true
    const matchesVisibility = visibilityFilter === 'active'
      ? item.is_active
      : visibilityFilter === 'hidden'
        ? !item.is_active
        : true

    return matchesQuery && matchesVisibility
  })

  if (!user?.is_main_admin) {
    return (
      <div className="admin-page-grid">
        <article className="admin-surface">
          <div className="admin-section-head">
            <div>
              <h2>Photo Gallery</h2>
              <p>Only the main admin can manage public gallery images.</p>
            </div>
          </div>
          <p className="admin-empty">This section is restricted to the main admin account.</p>
        </article>
      </div>
    )
  }

  return (
    <div className="admin-page-grid">
      <article className="admin-surface">
          <div className="admin-section-head">
            <div>
              <h2>Photo Gallery</h2>
              <p>Add, update, hide, and remove photos shown on the public gallery.</p>
            </div>
            <button className="btn-primary" type="button" onClick={startNewImage}>New Photo</button>
          </div>

          <div className="admin-filter-bar">
            <input
              type="search"
              className="admin-filter-input"
              placeholder="Search gallery..."
              value={gallerySearch}
              onChange={event => setGallerySearch(event.target.value)}
            />
            <select className="admin-filter-select" value={visibilityFilter} onChange={event => setVisibilityFilter(event.target.value)}>
              <option value="">All visibility</option>
              <option value="active">Visible</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div className="admin-data-table">
            {filteredImages.map(item => (
              <div
                key={item.id}
                className={`admin-row admin-row-clickable admin-row-with-thumb ${selectedImageId === item.id ? 'active' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => selectImage(item.id)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    selectImage(item.id)
                  }
                }}
              >
                {getGalleryImageUrl(item) ? (
                  <img
                    className="admin-event-thumb"
                    src={getBackendUrl(getGalleryImageUrl(item))}
                    alt={item.title}
                  />
                ) : (
                  <span className="admin-event-thumb admin-event-thumb-placeholder" aria-hidden="true" />
                )}
                <div>
                  <strong>{titleCaseWords(item.title || '')}</strong>
                  <span>{item.caption || 'No caption added'}</span>
                </div>
                <div>
                  <small>Sort order: {item.sort_order}</small>
                  <span className="admin-badge">{item.is_active ? 'Visible' : 'Hidden'}</span>
                </div>
                <div className="admin-row-actions">
                  <button type="button" onClick={event => {
                    event.stopPropagation()
                    selectImage(item.id)
                  }}>Edit</button>
                  <button type="button" className="danger" onClick={event => {
                    event.stopPropagation()
                    setConfirmDeleteId(item.id)
                  }}>Delete</button>
                </div>
              </div>
            ))}
            {!filteredImages.length ? <p className="admin-empty">{galleryImages.length ? 'No photos match the current search or filter.' : 'No gallery photos have been uploaded yet.'}</p> : null}
          </div>

          <div className="admin-pagination">
            <button
              className="btn-outline"
              type="button"
              onClick={() => refreshGallery(Math.max(1, galleryMeta.current_page - 1))}
              disabled={galleryMeta.current_page <= 1}
            >
              Previous
            </button>
            <span>Page {galleryMeta.current_page} of {galleryMeta.last_page}</span>
            <button
              className="btn-outline"
              type="button"
              onClick={() => refreshGallery(Math.min(galleryMeta.last_page, galleryMeta.current_page + 1))}
              disabled={galleryMeta.current_page >= galleryMeta.last_page}
            >
              Next
            </button>
          </div>
        </article>

      <AdminModal
        isOpen={isEditorOpen}
        onClose={closeEditor}
        title={selectedImageId ? 'Edit Photo' : 'Upload Photo'}
        subtitle={isLoadingEditor ? 'Loading photo...' : 'Uploaded photos are served from the backend and shown on the public website.'}
      >
        <form className="admin-form" onSubmit={submitGalleryImage} noValidate ref={editorRef}>
          <label>
            <span>Title</span>
            <input name="title" value={galleryForm.title} onChange={handleGalleryChange} onBlur={() => formatGalleryField('title', titleCaseWords)} aria-invalid={Boolean(galleryErrors.title)} />
            <FieldError errors={galleryErrors} name="title" />
          </label>

          <label>
            <span>Caption</span>
            <textarea name="caption" rows="4" value={galleryForm.caption} onChange={handleGalleryChange} onBlur={() => formatGalleryField('caption', capitalizeFirst)} aria-invalid={Boolean(galleryErrors.caption)} />
            <FieldError errors={galleryErrors} name="caption" />
          </label>

          <div className="admin-form-grid">
            <label>
              <span>Sort order</span>
              <select name="sort_order" value={galleryForm.sort_order || '1'} onChange={handleGalleryChange} aria-invalid={Boolean(galleryErrors.sort_order)}>
                {sortOrderOptions.map(value => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
              <FieldError errors={galleryErrors} name="sort_order" />
            </label>

            <label className="admin-checkbox">
              <input type="checkbox" name="is_active" checked={galleryForm.is_active} onChange={handleGalleryChange} />
              <span>Show on public gallery</span>
            </label>
          </div>

          <label>
            <span>{selectedImageId ? 'Replace photo' : 'Photo'}</span>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,.jfif" onChange={handleFileChange} aria-invalid={Boolean(galleryErrors.image)} />
            <p className="admin-field-hint">Large images are compressed automatically.</p>
            <FieldError errors={galleryErrors} name="image" />
          </label>

          {selectedFile ? (
            <div className="admin-panel">
              <strong>Selected photo</strong>
              <p>Selected uploaded photo - {formatBytes(selectedFile.size)}</p>
            </div>
          ) : null}

          {getGalleryImageUrl(selectedImage) && !selectedFile ? (
            <div className="admin-panel">
              <strong>Current photo</strong>
              <div className="admin-member-preview">
                <img src={getBackendUrl(getGalleryImageUrl(selectedImage))} alt={selectedImage.title} />
                <p>{selectedImage.image_filename || 'Current uploaded image'} - {formatBytes(selectedImage.image_size)}</p>
              </div>
            </div>
          ) : null}

          <div className="admin-actions">
            <button className="btn-primary" type="submit" disabled={isSavingImage}>
              {isSavingImage ? 'Saving...' : selectedImageId ? 'Update Photo' : 'Upload Photo'}
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
        title="Delete this gallery photo?"
        message="This will permanently remove the gallery photo from the public website."
        confirmLabel="Delete Photo"
        cancelLabel="Keep Photo"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => removeImage(confirmDeleteId)}
      />
    </div>
  )
}
