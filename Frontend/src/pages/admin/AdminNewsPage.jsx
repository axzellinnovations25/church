import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import FeedbackDialog from '../../components/FeedbackDialog'
import { createNewsPost, deleteNewsPost, getNewsPost, listNewsPosts, updateNewsPost } from '../../lib/admin'
import { getBackendUrl } from '../../lib/auth'
import { focusAdminEditor } from '../../lib/adminEditorFocus'
import { compressImageFile } from '../../lib/imageCompression'
import { capitalizeFirst, titleCaseWords } from '../../lib/textFormat'
import { countWords, hasErrors, requireField, validateMaxLength } from '../../lib/validation'
import AdminModal from '../../components/AdminModal'

const emptyNewsForm = {
  title: '',
  type: 'news',
  summary: '',
  content: '',
  published_at: new Date().toISOString().slice(0, 10),
  status: 'published',
}

const newsWordLimits = {
  title: 50,
  summary: 120,
  content: 800,
}
const maxImageSize = 2 * 1024 * 1024

function FieldError({ errors, name }) {
  if (!errors?.[name]?.[0]) {
    return null
  }

  return <p className="admin-field-error">{errors[name][0]}</p>
}

function FieldHint({ current, max }) {
  return <p className="admin-field-hint">{current}/{max} words</p>
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

function formatBytes(value) {
  if (!value) {
    return 'Unknown size'
  }

  const kb = value / 1024
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(0)} KB`
}

function formatTypeLabel(value) {
  return titleCaseWords(String(value || 'News').replace(/[_-]+/g, ' '))
}

function isImageFile(file) {
  return file?.type?.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file?.name || '')
}

function isImageSizeAllowed(file) {
  return !file || file.size <= maxImageSize
}

function normalizeErrors(error) {
  return error?.errors && typeof error.errors === 'object' ? error.errors : {}
}

export default function AdminNewsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const fileInputRef = useRef(null)
  const editorRef = useRef(null)
  const [newsPosts, setNewsPosts] = useState([])
  const [newsMeta, setNewsMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [selectedNewsId, setSelectedNewsId] = useState(null)
  const [newsForm, setNewsForm] = useState(emptyNewsForm)
  const [selectedFile, setSelectedFile] = useState(null)
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false)
  const [newsErrors, setNewsErrors] = useState({})
  const [isSavingNews, setIsSavingNews] = useState(false)
  const [isLoadingEditor, setIsLoadingEditor] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [newsSearch, setNewsSearch] = useState('')
  const [newsStatusFilter, setNewsStatusFilter] = useState('')
  const [newsTypeFilter, setNewsTypeFilter] = useState('')
  const [dialogState, setDialogState] = useState({
    open: false,
    tone: 'neutral',
    title: '',
    message: '',
  })
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  useEffect(() => {
    let ignore = false

    async function loadNews() {
      const payload = await listNewsPosts(1)

      if (!ignore) {
        setNewsPosts(payload.news_posts || [])
        setNewsMeta(payload.meta || { current_page: 1, last_page: 1, total: 0 })
      }
    }

    loadNews()

    return () => {
      ignore = true
    }
  }, [])

  const openDialog = useCallback((tone, title, message) => {
    setDialogState({ open: true, tone, title, message })
  }, [])

  function closeDialog() {
    setDialogState(current => ({ ...current, open: false }))
  }

  async function refreshNews(page = newsMeta.current_page || 1) {
    const payload = await listNewsPosts(page)
    setNewsPosts(payload.news_posts || [])
    setNewsMeta(payload.meta || { current_page: page, last_page: 1, total: 0 })
  }

  const editNewsPost = useCallback(async (id) => {
    setIsLoadingEditor(true)

    try {
      const payload = await getNewsPost(id)
      const newsPost = payload.news_post

      setSelectedNewsId(newsPost.id)
      setNewsForm({
        title: newsPost.title || '',
        type: newsPost.type || 'news',
        summary: newsPost.summary || '',
        content: newsPost.content || '',
        published_at: newsPost.published_at || '',
        status: newsPost.status || 'published',
      })
      setSelectedFile(null)
      setRemoveCurrentImage(false)
      setNewsErrors({})
      if (searchParams.get('edit') !== String(id)) {
        setSearchParams({ edit: String(id) })
      }
      focusAdminEditor(editorRef)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setIsEditorOpen(true)
    } catch (error) {
      openDialog('error', 'Unable to load news post', error.message || 'The selected news post could not be opened.')
    } finally {
      setIsLoadingEditor(false)
    }
  }, [openDialog, searchParams, setSearchParams])

  useEffect(() => {
    const editId = searchParams.get('edit')

    if (!editId) {
      return
    }

    editNewsPost(Number(editId))
  }, [searchParams, editNewsPost])

  function startNewPost() {
    setSelectedNewsId(null)
    setNewsForm(emptyNewsForm)
    setSelectedFile(null)
    setRemoveCurrentImage(false)
    setNewsErrors({})
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

  function handleNewsChange(event) {
    const { name, value } = event.target
    const nextForm = { ...newsForm, [name]: value }

    setNewsForm(nextForm)
    setNewsErrors(current => ({ ...current, ...validateNewsLiveFields(nextForm, name) }))
  }

  function formatNewsField(name, formatter) {
    setNewsForm(current => ({
      ...current,
      [name]: formatter(current[name] || ''),
    }))
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0] || null

    if (file && !isImageFile(file)) {
      setSelectedFile(null)
      setNewsErrors(current => ({ ...current, image: ['Please upload a JPG, PNG, or WebP image.'] }))
      event.target.value = ''
      return
    }

    const preparedFile = file ? await compressImageFile(file, { maxBytes: maxImageSize }) : null

    if (preparedFile && !isImageSizeAllowed(preparedFile)) {
      setSelectedFile(null)
      setNewsErrors(current => ({ ...current, image: ['The image is still too large after compression. Please choose one under 2 MB.'] }))
      event.target.value = ''
      return
    }

    setSelectedFile(preparedFile)
    setRemoveCurrentImage(false)
    setNewsErrors(current => ({ ...current, image: undefined }))
  }

  function validateNewsLiveFields(form, fieldName) {
    const nextErrors = {}

    if (fieldName === 'title') {
      requireField(nextErrors, 'title', form.title, 'Title')
      validateMaxLength(nextErrors, 'title', form.title, 255, 'Title')
      if (countWords(form.title) > newsWordLimits.title) {
        nextErrors.title = [`Title must be ${newsWordLimits.title} words or fewer.`]
      }
    } else if (fieldName === 'summary') {
      validateMaxLength(nextErrors, 'summary', form.summary, 500, 'Summary')
      if (countWords(form.summary) > newsWordLimits.summary) {
        nextErrors.summary = [`Summary must be ${newsWordLimits.summary} words or fewer.`]
      }
    } else if (fieldName === 'content') {
      validateMaxLength(nextErrors, 'content', form.content, 10000, 'News details')
      if (countWords(form.content) > newsWordLimits.content) {
        nextErrors.content = [`News details must be ${newsWordLimits.content} words or fewer.`]
      }
    }

    return nextErrors
  }

  function validateNewsForm() {
    const nextErrors = {}

    requireField(nextErrors, 'title', newsForm.title, 'Title')
    validateMaxLength(nextErrors, 'title', newsForm.title, 255, 'Title')
    requireField(nextErrors, 'type', newsForm.type, 'Type')
    requireField(nextErrors, 'status', newsForm.status, 'Status')
    validateMaxLength(nextErrors, 'summary', newsForm.summary, 500, 'Summary')
    validateMaxLength(nextErrors, 'content', newsForm.content, 10000, 'News details')

    if (countWords(newsForm.title) > newsWordLimits.title) {
      nextErrors.title = [`Title must be ${newsWordLimits.title} words or fewer.`]
    }

    if (countWords(newsForm.summary) > newsWordLimits.summary) {
      nextErrors.summary = [`Summary must be ${newsWordLimits.summary} words or fewer.`]
    }

    if (countWords(newsForm.content) > newsWordLimits.content) {
      nextErrors.content = [`News details must be ${newsWordLimits.content} words or fewer.`]
    }

    if (selectedFile && !isImageSizeAllowed(selectedFile)) {
      nextErrors.image = ['Please upload an image that is 2 MB or smaller.']
    }

    return nextErrors
  }

  function buildPayload() {
    const payload = new FormData()

    Object.entries(newsForm).forEach(([key, value]) => {
      payload.append(key, value ?? '')
    })

    if (selectedFile) {
      payload.append('image', selectedFile)
    }

    if (removeCurrentImage) {
      payload.append('remove_image', '1')
    }

    return payload
  }

  async function submitNews(event) {
    event.preventDefault()
    const validationErrors = validateNewsForm()
    setNewsErrors(validationErrors)

    if (hasErrors(validationErrors)) {
      return
    }

    setIsSavingNews(true)

    try {
      const response = selectedNewsId
        ? await updateNewsPost(selectedNewsId, buildPayload())
        : await createNewsPost(buildPayload())

      await refreshNews()
      const savedPost = response.news_post
      setSelectedNewsId(savedPost?.id || null)
      setNewsForm({
        title: savedPost?.title || '',
        type: savedPost?.type || 'news',
        summary: savedPost?.summary || '',
        content: savedPost?.content || '',
        published_at: savedPost?.published_at || '',
        status: savedPost?.status || 'published',
      })
      setSelectedFile(null)
      setRemoveCurrentImage(false)
      setNewsErrors({})
      setIsEditorOpen(false)
      openDialog('success', 'News post saved successfully', response.message || 'The news post has been saved.')
    } catch (error) {
      setNewsErrors(normalizeErrors(error))
      openDialog('error', 'Unable to save news post', error.message || 'Please review the news details and try again.')
    } finally {
      setIsSavingNews(false)
    }
  }

  async function removeNewsPost(id) {
    try {
      const payload = await deleteNewsPost(id)
      await refreshNews()

      if (selectedNewsId === id) {
        startNewPost()
      }

      openDialog('success', 'News post deleted successfully', payload.message || 'The news post has been removed.')
    } catch (error) {
      openDialog('error', 'Unable to delete news post', error.message || 'The news post could not be deleted at this time.')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  const selectedNewsPost = newsPosts.find(item => item.id === selectedNewsId)
  const newsTypes = Array.from(new Set(newsPosts.map(item => item.type).filter(Boolean))).sort()
  const filteredNews = newsPosts.filter(item => {
    const query = newsSearch.trim().toLowerCase()
    const matchesSearch = query
      ? `${item.title} ${item.summary || ''} ${item.type || ''}`.toLowerCase().includes(query)
      : true
    const matchesStatus = newsStatusFilter ? item.status === newsStatusFilter : true
    const matchesType = newsTypeFilter ? item.type === newsTypeFilter : true

    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="admin-page-grid">
      <article className="admin-surface">
          <div className="admin-section-head">
            <div>
              <h2>News & Announcements</h2>
              <p>Create public news posts and announcements with optional images.</p>
            </div>
            <button className="btn-primary" type="button" onClick={startNewPost}>New Post</button>
          </div>

          <div className="admin-filter-bar">
            <input
              type="search"
              className="admin-filter-input"
              placeholder="Search news..."
              value={newsSearch}
              onChange={event => setNewsSearch(event.target.value)}
            />
            <select className="admin-filter-select" value={newsStatusFilter} onChange={event => setNewsStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select className="admin-filter-select" value={newsTypeFilter} onChange={event => setNewsTypeFilter(event.target.value)}>
              <option value="">All types</option>
              {newsTypes.map(type => <option key={type} value={type}>{formatTypeLabel(type)}</option>)}
            </select>
          </div>

          <div className="admin-data-table">
            {filteredNews.length ? (
              <div className="admin-table-header admin-row-news" aria-hidden="true">
                <span>Image</span>
                <span>Headline & Info</span>
                <span>Summary</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>
            ) : null}
            {filteredNews.map(item => (
              <div key={item.id} className="admin-row admin-row-news">
                <div className="admin-col-thumb">
                  {item.image_url ? (
                    <img className="admin-event-thumb" src={getBackendUrl(item.image_url)} alt={item.title} />
                  ) : (
                    <span className="admin-event-thumb admin-event-thumb-placeholder" aria-hidden="true" />
                  )}
                </div>
                <div className="admin-row-main">
                  <strong>{item.title}</strong>
                  <span className="admin-subtext">{formatDate(item.published_at)} • {formatTypeLabel(item.type)}</span>
                </div>
                <div className="admin-row-meta">
                  <small className="admin-row-summary">{item.summary || 'No summary added yet.'}</small>
                </div>
                <div className="admin-col-status">
                  <span className={`admin-badge ${item.status === 'draft' ? 'is-warning' : ''}`}>{formatTypeLabel(item.status)}</span>
                </div>
                <div className="admin-row-actions">
                  <button type="button" onClick={() => editNewsPost(item.id)}>Edit</button>
                  <button type="button" className="danger" onClick={() => setConfirmDeleteId(item.id)}>Delete</button>
                </div>
              </div>
            ))}
            {!filteredNews.length ? <p className="admin-empty">{newsPosts.length ? 'No news posts match the current search or filters.' : 'No news posts have been created yet.'}</p> : null}
          </div>

          <div className="admin-pagination">
            <button className="btn-outline" type="button" onClick={() => refreshNews(Math.max(1, newsMeta.current_page - 1))} disabled={newsMeta.current_page <= 1}>
              Previous
            </button>
            <span>Page {newsMeta.current_page} of {newsMeta.last_page}</span>
            <button className="btn-outline" type="button" onClick={() => refreshNews(Math.min(newsMeta.last_page, newsMeta.current_page + 1))} disabled={newsMeta.current_page >= newsMeta.last_page}>
              Next
            </button>
          </div>
        </article>

      <AdminModal
        isOpen={isEditorOpen}
        onClose={closeEditor}
        title={selectedNewsId ? 'Edit News Post' : 'Create News Post'}
        subtitle={isLoadingEditor ? 'Loading news post...' : 'Add the headline, image, and details for the public news page.'}
      >
        <form className="admin-form" onSubmit={submitNews} noValidate ref={editorRef}>
          <div className="admin-form-group">
            <h3 className="admin-form-group-head">Headline & Category</h3>
            <label>
              <span>Title <span className="admin-required-star">*</span></span>
              <input name="title" value={newsForm.title} onChange={handleNewsChange} onBlur={() => formatNewsField('title', titleCaseWords)} aria-invalid={Boolean(newsErrors.title)} placeholder="e.g. Annual Cathedral Restoration Update" />
              <FieldHint current={countWords(newsForm.title)} max={newsWordLimits.title} />
              <FieldError errors={newsErrors} name="title" />
            </label>

            <div className="admin-form-grid">
              <label>
                <span>Type</span>
                <select name="type" value={newsForm.type} onChange={handleNewsChange} aria-invalid={Boolean(newsErrors.type)}>
                  <option value="news">News</option>
                  <option value="announcement">Announcement</option>
                </select>
                <FieldError errors={newsErrors} name="type" />
              </label>

              <label>
                <span>Publish date</span>
                <input type="date" name="published_at" value={newsForm.published_at} onChange={handleNewsChange} aria-invalid={Boolean(newsErrors.published_at)} />
                <FieldError errors={newsErrors} name="published_at" />
              </label>
            </div>
          </div>

          <div className="admin-form-group">
            <h3 className="admin-form-group-head">Content & Summary</h3>
            <label>
              <span>Summary</span>
              <textarea name="summary" rows="2" value={newsForm.summary} onChange={handleNewsChange} onBlur={() => formatNewsField('summary', capitalizeFirst)} aria-invalid={Boolean(newsErrors.summary)} placeholder="Brief summary to show in previews..." />
              <FieldHint current={countWords(newsForm.summary)} max={newsWordLimits.summary} />
              <FieldError errors={newsErrors} name="summary" />
            </label>

            <label>
              <span>News details</span>
              <textarea name="content" rows="6" value={newsForm.content} onChange={handleNewsChange} onBlur={() => formatNewsField('content', capitalizeFirst)} aria-invalid={Boolean(newsErrors.content)} placeholder="Full body content for the news announcement..." />
              <FieldHint current={countWords(newsForm.content)} max={newsWordLimits.content} />
              <FieldError errors={newsErrors} name="content" />
            </label>
          </div>

          <div className="admin-form-group">
            <h3 className="admin-form-group-head">Status & Image</h3>
            <label>
              <span>Status</span>
              <select name="status" value={newsForm.status} onChange={handleNewsChange} aria-invalid={Boolean(newsErrors.status)}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <FieldError errors={newsErrors} name="status" />
            </label>

            <label>
              <span>{selectedNewsId ? 'Replace image' : 'Image'}</span>
              <input ref={fileInputRef} className="admin-file-input-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} aria-invalid={Boolean(newsErrors.image)} />
              <button className="btn-outline" type="button" onClick={() => fileInputRef.current?.click()}>
                Choose Image
              </button>
              <p className="admin-field-hint">JPG, PNG, or WebP. Large images are compressed automatically.</p>
              <FieldError errors={newsErrors} name="image" />
            </label>

            {selectedFile ? (
              <div className="admin-panel">
                <strong>Selected image</strong>
                <p>Selected uploaded image • {formatBytes(selectedFile.size)}</p>
              </div>
            ) : null}

            {selectedNewsPost?.image_url && !selectedFile && !removeCurrentImage ? (
              <div className="admin-panel">
                <strong>Current image</strong>
                <div className="admin-member-preview">
                  <img src={getBackendUrl(selectedNewsPost.image_url)} alt={selectedNewsPost.title} />
                </div>
                <p>Current uploaded image • {formatBytes(selectedNewsPost.image_size)}</p>
                <button type="button" className="admin-link-btn danger" onClick={() => setRemoveCurrentImage(true)}>
                  Remove current image
                </button>
              </div>
            ) : null}

            {removeCurrentImage ? (
              <div className="admin-panel">
                <strong>Current image will be removed</strong>
                <button type="button" className="admin-link-btn" onClick={() => setRemoveCurrentImage(false)}>
                  Keep current image
                </button>
              </div>
            ) : null}
          </div>

          <div className="admin-form-actions">
            <button className="btn-primary" type="submit" disabled={isSavingNews}>
              {isSavingNews ? 'Saving...' : selectedNewsId ? 'Update News Post' : 'Create News Post'}
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
        title="Delete this news post?"
        message="This will permanently remove the news post and its uploaded image."
        confirmLabel="Delete News Post"
        cancelLabel="Keep News Post"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => removeNewsPost(confirmDeleteId)}
      />
    </div>
  )
}
