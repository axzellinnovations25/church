import { useEffect, useRef, useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import FeedbackDialog from '../../components/FeedbackDialog'
import { deleteContactMessage, getContactMessage, listContactMessages, updateContactMessageStatus } from '../../lib/admin'
import { focusAdminEditor } from '../../lib/adminEditorFocus'
import { capitalizeFirst, titleCaseWords } from '../../lib/textFormat'
import AdminModal from '../../components/AdminModal'

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
]

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

function formatStatusLabel(value) {
  return statusOptions.find(option => option.value === value)?.label || 'New'
}

function formatCategoryLabel(value) {
  if (!value) {
    return 'General'
  }

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(word => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(' ')
}

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

function truncate(text, length = 110) {
  if (!text) {
    return 'No message content.'
  }

  return text.length > length ? `${text.slice(0, length).trim()}...` : text
}

function formatDisplayText(value, fallback = 'Not provided') {
  return value ? titleCaseWords(value) : fallback
}

function formatMessageCopy(value) {
  return value ? capitalizeFirst(value) : 'No message content.'
}

function buildAddMemberUrl(message, user) {
  const params = new URLSearchParams()

  if (message.group_id) {
    params.set('group', String(message.group_id))
  }

  params.set('new_member', '1')
  params.set('name', message.name || '')
  params.set('email', message.email || '')
  params.set('phone', message.phone || '')
  params.set('notes', `From contact message: ${message.subject || 'No subject'}`)

  const basePath = user?.is_main_admin ? '/dashboard/groups' : '/dashboard/my-group'

  return `${basePath}?${params.toString()}`
}

export default function AdminContactMessagesPage() {
  const { user } = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const editorRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [messageMeta, setMessageMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [selectedMessageId, setSelectedMessageId] = useState(null)
  const [messageDetail, setMessageDetail] = useState(null)
  const [isLoadingMessages, setIsLoadingMessages] = useState(true)
  const [isLoadingDetail, setIsLoadingDetail] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [messageSearch, setMessageSearch] = useState('')
  const [messageStatusFilter, setMessageStatusFilter] = useState('')
  const [messageCategoryFilter, setMessageCategoryFilter] = useState('')
  const [messageGroupFilter, setMessageGroupFilter] = useState('')
  const [messageDateFilter, setMessageDateFilter] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  useEffect(() => {
    let ignore = false

    async function loadMessages(page = 1) {
      setIsLoadingMessages(true)
      setErrorMessage('')

      try {
        const payload = await listContactMessages(page)

        if (ignore) {
          return
        }

        const items = payload.messages || []
        setMessages(items)
        setMessageMeta(payload.meta || { current_page: page, last_page: 1, total: 0 })

        const querySelected = searchParams.get('message')
        if (querySelected) {
          setSelectedMessageId(Number(querySelected))
          setIsModalOpen(true)
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error.message || 'Unable to load contact messages.')
        }
      } finally {
        if (!ignore) {
          setIsLoadingMessages(false)
        }
      }
    }

    loadMessages()

    return () => {
      ignore = true
    }
  }, [])

  useEffect(() => {
    const selected = searchParams.get('message')

    if (selected) {
      setSelectedMessageId(Number(selected))
      setIsModalOpen(true)
    } else {
      setSelectedMessageId(null)
      setMessageDetail(null)
      setIsModalOpen(false)
    }
  }, [searchParams])

  useEffect(() => {
    if (!selectedMessageId) {
      return
    }

    focusAdminEditor(editorRef)
  }, [selectedMessageId])

  useEffect(() => {
    let ignore = false

    async function loadMessageDetail() {
      if (!selectedMessageId) {
        setMessageDetail(null)
        return
      }

      setIsLoadingDetail(true)
      setErrorMessage('')

      try {
        const payload = await getContactMessage(selectedMessageId)

        if (!ignore) {
          setMessageDetail(payload.message || null)
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error.message || 'Unable to load the selected message.')
        }
      } finally {
        if (!ignore) {
          setIsLoadingDetail(false)
        }
      }
    }

    loadMessageDetail()

    return () => {
      ignore = true
    }
  }, [selectedMessageId])

  function closeModal() {
    setIsModalOpen(false)
    setSelectedMessageId(null)
    setMessageDetail(null)
    setSearchParams({})
  }

  async function goToPage(page) {
    setIsLoadingMessages(true)
    setErrorMessage('')

    try {
      const payload = await listContactMessages(page)
      const items = payload.messages || []
      setMessages(items)
      setMessageMeta(payload.meta || { current_page: page, last_page: 1, total: 0 })
      setSelectedMessageId(null)
      setMessageDetail(null)
      setIsModalOpen(false)
      setSearchParams({})
    } catch (error) {
      setErrorMessage(error.message || 'Unable to load contact messages.')
    } finally {
      setIsLoadingMessages(false)
    }
  }

  async function removeMessage(id) {
    try {
      await deleteContactMessage(id)
      const payload = await listContactMessages(messageMeta.current_page)
      const items = payload.messages || []

      setMessages(items)
      setMessageMeta(payload.meta || { current_page: 1, last_page: 1, total: 0 })
      setSelectedMessageId(null)
      setMessageDetail(null)
      setIsModalOpen(false)
      setSearchParams({})
    } catch (error) {
      setErrorMessage(error.message || 'Unable to delete the selected message.')
    } finally {
      setConfirmDeleteId(null)
    }
  }

  async function changeMessageStatus(status) {
    if (!messageDetail?.id) {
      return
    }

    setIsUpdatingStatus(true)
    setErrorMessage('')

    try {
      const payload = await updateContactMessageStatus(messageDetail.id, status)
      const updatedMessage = payload.contact_message || null

      if (!updatedMessage) {
        throw new Error('Unable to save the contact message status.')
      }

      setMessageDetail(updatedMessage)
      setMessages(currentMessages =>
        currentMessages.map(item => (item.id === updatedMessage.id ? { ...item, ...updatedMessage } : item)),
      )
    } catch (error) {
      setErrorMessage(error.message || 'Unable to update the message status.')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const messageCategories = Array.from(new Set(messages.map(item => item.category).filter(Boolean))).sort((a, b) => formatCategoryLabel(a).localeCompare(formatCategoryLabel(b)))
  const messageGroups = Array.from(new Set(messages.map(item => item.group_name).filter(Boolean))).sort((a, b) => a.localeCompare(b))
  const filteredMessages = messages.filter(item => {
    const query = messageSearch.trim().toLowerCase()
    const matchesStatus = messageStatusFilter ? item.status === messageStatusFilter : true
    const matchesCategory = messageCategoryFilter ? item.category === messageCategoryFilter : true
    const matchesGroup = messageGroupFilter ? item.group_name === messageGroupFilter : true
    const matchesDate = matchesRecentDate(item.created_at, messageDateFilter)

    if (!query) {
      return matchesStatus && matchesCategory && matchesGroup && matchesDate
    }

    const matchesSearch = `${item.subject} ${item.name} ${item.email} ${item.message || ''} ${formatCategoryLabel(item.category)}`.toLowerCase().includes(query)

    return matchesSearch && matchesStatus && matchesCategory && matchesGroup && matchesDate
  })

  return (
    <div className="admin-page-grid">
      <article className="admin-surface">
        <div className="admin-section-head">
          <div>
            <h2>Contact Messages</h2>
            <p>{user?.is_main_admin ? 'Review enquiries submitted through the public Contact Us form.' : 'Review enquiries routed to your group from the public Contact Us form.'}</p>
          </div>
          <div className="admin-user-meta">
            <span>{isLoadingMessages ? '—' : (messageMeta.total ?? 0)}</span>
            <small>Total messages</small>
          </div>
        </div>

        <div className="admin-filter-bar">
          <input
            type="search"
            className="admin-filter-input"
            placeholder="Search messages..."
            value={messageSearch}
            onChange={event => setMessageSearch(event.target.value)}
          />
          <select className="admin-filter-select" value={messageStatusFilter} onChange={event => setMessageStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select className="admin-filter-select" value={messageCategoryFilter} onChange={event => setMessageCategoryFilter(event.target.value)}>
            <option value="">All categories</option>
            {messageCategories.map(category => (
              <option key={category} value={category}>{formatCategoryLabel(category)}</option>
            ))}
          </select>
          <select className="admin-filter-select" value={messageGroupFilter} onChange={event => setMessageGroupFilter(event.target.value)}>
            <option value="">All routed groups</option>
            {messageGroups.map(group => <option key={group} value={group}>{formatDisplayText(group)}</option>)}
          </select>
          <select className="admin-filter-select" value={messageDateFilter} onChange={event => setMessageDateFilter(event.target.value)}>
            <option value="">Any received date</option>
            <option value="today">Today</option>
            <option value="7_days">Last 7 days</option>
            <option value="30_days">Last 30 days</option>
          </select>
        </div>

        {errorMessage ? <p className="admin-field-error">{errorMessage}</p> : null}
        {isLoadingMessages ? <p className="admin-loading">Loading messages...</p> : null}

        {!isLoadingMessages ? (
          <div className="admin-data-table">
            {filteredMessages.length ? (
              <div className="admin-table-header admin-row-contact" aria-hidden="true">
                <span>Subject & Sender</span>
                <span>Category & Date</span>
                <span>Status & Snippet</span>
              </div>
            ) : null}
            {filteredMessages.map(item => (
              <button
                key={item.id}
                type="button"
                className={`admin-row admin-row-clickable admin-row-contact ${selectedMessageId === item.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedMessageId(item.id)
                  setSearchParams({ message: String(item.id) })
                  setIsModalOpen(true)
                }}
              >
                <div className="admin-col-main">
                  <strong>{formatDisplayText(item.subject, 'No Subject')}</strong>
                  <span className="admin-subtext">{formatDisplayText(item.name)} • {item.email}{item.group_name ? ` • ${formatDisplayText(item.group_name)}` : ''}</span>
                </div>
                <div className="admin-col-meta">
                  <small>{formatCategoryLabel(item.category)}</small>
                  <span className="admin-subtext">{formatDateTime(item.created_at)}</span>
                </div>
                <div className="admin-col-snippet">
                  <span className={`admin-badge ${item.status === 'new' ? 'is-warning' : ''}`}>{formatStatusLabel(item.status)}</span>
                  <small className="admin-row-summary">{truncate(formatMessageCopy(item.message))}</small>
                </div>
              </button>
            ))}
            {!filteredMessages.length ? <p className="admin-empty">{messages.length ? 'No messages match the current search or filters.' : 'No contact messages have been submitted yet.'}</p> : null}
          </div>
        ) : null}

        <div className="admin-pagination">
          <button
            className="btn-outline"
            type="button"
            onClick={() => goToPage(Math.max(1, messageMeta.current_page - 1))}
            disabled={messageMeta.current_page <= 1}
          >
            Previous
          </button>
          <span>Page {messageMeta.current_page} of {messageMeta.last_page}</span>
          <button
            className="btn-outline"
            type="button"
            onClick={() => goToPage(Math.min(messageMeta.last_page, messageMeta.current_page + 1))}
            disabled={messageMeta.current_page >= messageMeta.last_page}
          >
            Next
          </button>
        </div>
      </article>

      <AdminModal
        isOpen={isModalOpen}
        onClose={closeModal}
        title="Message Detail"
        subtitle={isLoadingDetail ? 'Loading message...' : 'Open a message to read the full enquiry.'}
      >
        <div ref={editorRef} id="admin-editor">
          {user?.is_main_admin && messageDetail ? (
            <div className="admin-actions" style={{ marginBottom: '24px' }}>
              <button className="btn-outline admin-danger-button" type="button" onClick={() => setConfirmDeleteId(messageDetail.id)}>
                Delete Message
              </button>
            </div>
          ) : null}

        {!messageDetail && !isLoadingDetail ? <p className="admin-empty">Select a contact message to view it here.</p> : null}

        {messageDetail ? (
          <div className="admin-detail-grid">
            <div className="admin-detail-card">
              <span>From</span>
              <strong>{formatDisplayText(messageDetail.name)}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Received</span>
              <strong>{formatDateTime(messageDetail.created_at)}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Email</span>
              <strong>{messageDetail.email}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Phone</span>
              <strong>{messageDetail.phone || 'Not provided'}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Status</span>
              <strong>{formatStatusLabel(messageDetail.status)}</strong>
            </div>

            <article className="admin-detail-block admin-detail-block-full">
              <h3>Subject</h3>
              <p>{formatDisplayText(messageDetail.subject, 'No subject')}</p>
            </article>

            <article className="admin-detail-block">
              <h3>Update Status</h3>
              <label className="admin-inline-field">
                <span className="sr-only">Contact message status</span>
                <select
                  value={messageDetail.status || 'new'}
                  onChange={event => changeMessageStatus(event.target.value)}
                  disabled={isUpdatingStatus}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {isUpdatingStatus ? <p>Saving status...</p> : null}
            </article>

            <article className="admin-detail-block">
              <h3>Category</h3>
              <p>{formatCategoryLabel(messageDetail.category)}</p>
            </article>

            <article className="admin-detail-block">
              <h3>Routed Group</h3>
              <p>{messageDetail.group_name ? formatDisplayText(messageDetail.group_name) : 'Main parish inbox only'}</p>
              {messageDetail.is_existing_group_member ? (
                <p className="admin-member-status">Already in this group</p>
              ) : null}
              {messageDetail.group_id && !messageDetail.is_existing_group_member ? (
                <Link className="btn-outline admin-add-member-link" to={buildAddMemberUrl(messageDetail, user)}>
                  Add Member
                </Link>
              ) : null}
            </article>

            <article className="admin-detail-block admin-detail-block-full">
              <h3>Message</h3>
              <p className="admin-message-copy">{formatMessageCopy(messageDetail.message)}</p>
            </article>
          </div>
        ) : null}
        </div>
      </AdminModal>

      <FeedbackDialog
        open={confirmDeleteId !== null}
        tone="neutral"
        variant="confirm"
        title="Delete this message?"
        message="This will permanently remove the selected contact message."
        confirmLabel="Delete Message"
        cancelLabel="Keep Message"
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => removeMessage(confirmDeleteId)}
      />
    </div>
  )
}
