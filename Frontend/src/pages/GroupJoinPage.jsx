import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import FeedbackDialog from '../components/FeedbackDialog'
import PageHero from '../components/PageHero'
import { getBackendUrl } from '../lib/auth'
import { firstError, hasErrors, requireField, validateEmail, validateMaxLength, validateNameText, validatePhone } from '../lib/validation'
import './ContactPage.css'

const initialJoinForm = {
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
}

export default function GroupJoinPage() {
  const { groupSlug } = useParams()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [isLoadingGroup, setIsLoadingGroup] = useState(true)
  const [joinForm, setJoinForm] = useState(initialJoinForm)
  const [joinErrors, setJoinErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)

  useEffect(() => {
    let ignore = false

    async function loadGroups() {
      try {
        const response = await fetch(getBackendUrl('/api/v1/groups'))
        const payload = await response.json()

        if (!ignore && response.ok && Array.isArray(payload?.data)) {
          setGroups(payload.data)
        }
      } catch {
        if (!ignore) {
          setGroups([])
        }
      } finally {
        if (!ignore) {
          setIsLoadingGroup(false)
        }
      }
    }

    loadGroups()

    return () => {
      ignore = true
    }
  }, [])

  const group = useMemo(
    () => groups.find(item => item.slug === groupSlug) || null,
    [groupSlug, groups],
  )

  useEffect(() => {
    if (!group) {
      return
    }

    setJoinForm(current => ({
      ...current,
      subject: current.subject || `Joining ${group.name}`,
    }))
  }, [group])

  function handleChange(event) {
    const { name, value } = event.target
    const nextErrors = {}

    if (name === 'name') {
      validateNameText(nextErrors, 'name', value, 'Name', true)
      validateMaxLength(nextErrors, 'name', value, 255, 'Name')
    } else if (name === 'email') {
      validateEmail(nextErrors, 'email', value)
    } else if (name === 'phone') {
      validatePhone(nextErrors, 'phone', value)
    } else if (name === 'subject') {
      requireField(nextErrors, 'subject', value, 'Subject')
      validateMaxLength(nextErrors, 'subject', value, 255, 'Subject')
    } else if (name === 'message') {
      requireField(nextErrors, 'message', value, 'Message')
      validateMaxLength(nextErrors, 'message', value, 5000, 'Message')
    }

    setJoinForm(current => ({
      ...current,
      [name]: value,
    }))
    setJoinErrors(current => ({
      ...current,
      [name]: nextErrors[name],
    }))
  }

  function validateForm() {
    const nextErrors = {}

    validateNameText(nextErrors, 'name', joinForm.name, 'Name', true)
    validateMaxLength(nextErrors, 'name', joinForm.name, 255, 'Name')
    validateEmail(nextErrors, 'email', joinForm.email)
    validatePhone(nextErrors, 'phone', joinForm.phone)
    requireField(nextErrors, 'subject', joinForm.subject, 'Subject')
    validateMaxLength(nextErrors, 'subject', joinForm.subject, 255, 'Subject')
    requireField(nextErrors, 'message', joinForm.message, 'Message')
    validateMaxLength(nextErrors, 'message', joinForm.message, 5000, 'Message')

    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!group) {
      setError('This parish group is not available for online joining right now.')
      return
    }

    const validationErrors = validateForm()
    setJoinErrors(validationErrors)

    if (hasErrors(validationErrors)) {
      setError(firstError(validationErrors) || 'Please review the highlighted fields.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(getBackendUrl('/api/v1/contact'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          ...joinForm,
          category: 'group_join',
          group_id: group.id,
        }),
      })

      const rawBody = await response.text()
      let payload = null

      try {
        payload = rawBody ? JSON.parse(rawBody) : null
      } catch {
        payload = null
      }

      if (!response.ok) {
        const firstApiError = payload?.errors && typeof payload.errors === 'object'
          ? Object.values(payload.errors).flat().filter(Boolean)[0]
          : null

        if (payload?.errors && typeof payload.errors === 'object') {
          setJoinErrors(current => ({ ...current, ...payload.errors }))
        }

        if (firstApiError) {
          throw new Error(firstApiError)
        }

        if (response.status < 500 && payload?.message) {
          throw new Error(payload.message)
        }

        console.error('Group join submission failed:', response.status, rawBody)
        throw new Error('Unable to send your group registration right now. Please try again in a moment.')
      }

      setJoinForm({
        ...initialJoinForm,
        subject: `Joining ${group.name}`,
      })
      setJoinErrors({})
      setSuccessDialogOpen(true)
    } catch (submitError) {
      console.error('Group join submission error:', submitError)
      setError(submitError?.message || 'Unable to send your group registration right now. Please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="contact-page-container">
      <PageHero
        title={group ? `Join ${group.name}` : 'Join a Parish Group'}
        subtitle={group ? 'Send your details to the group team and we will help you get connected.' : 'Choose a parish group and send your registration enquiry online.'}
        centered={true}
      />

      <section className="section">
        <div className="container">
          {isLoadingGroup ? <p className="contact-feedback">Loading group details...</p> : null}

          {!isLoadingGroup && !group ? (
            <div className="card" style={{ maxWidth: '760px', margin: '0 auto' }}>
              <h2>Group not found</h2>
              <p>The parish group you requested could not be found or is not currently active.</p>
              <div className="form-actions-row" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-minimal-dark" onClick={() => navigate('/parish-groups')}>
                  Back to Parish Groups
                </button>
                <Link to="/contact" className="btn-minimal-dark">Contact the Parish Office</Link>
              </div>
            </div>
          ) : null}

          {group ? (
            <div className="contact-bottom-grid two-columns">
              <div className="contact-column">
                <h3>About This Group</h3>
                <p>{group.description || 'This active parish group is welcoming new enquiries and registrations.'}</p>
                <div className="content-card" style={{ marginTop: '20px' }}>
                  <h3>What happens next?</h3>
                  <p>Your registration enquiry is sent directly into the parish admin system and routed to the right group team. They can then review it and contact you using the details you provide.</p>
                </div>
                <div className="content-card" style={{ marginTop: '20px' }}>
                  <h3>Prefer a general enquiry?</h3>
                  <p>If you are not sure whether this is the right group, you can also <Link to="/contact" className="click-here-link">contact the parish office here</Link>.</p>
                </div>
              </div>

              <div className="contact-column">
                <h3>Join {group.name}</h3>
                {error ? <div className="contact-feedback error">{error}</div> : null}

                <form className="contact-form-minimal" onSubmit={handleSubmit} noValidate>
                  <div className="grid-2" style={{ gap: '15px' }}>
                    <div className="form-group">
                      <label>Name</label>
                      <input name="name" value={joinForm.name} onChange={handleChange} aria-invalid={Boolean(joinErrors.name)} />
                      {joinErrors.name ? <span className="field-error">{joinErrors.name[0]}</span> : null}
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" name="email" value={joinForm.email} onChange={handleChange} aria-invalid={Boolean(joinErrors.email)} />
                      {joinErrors.email ? <span className="field-error">{joinErrors.email[0]}</span> : null}
                    </div>
                  </div>

                  <div className="grid-2" style={{ gap: '15px', marginTop: '15px' }}>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input name="phone" value={joinForm.phone} onChange={handleChange} aria-invalid={Boolean(joinErrors.phone)} />
                      {joinErrors.phone ? <span className="field-error">{joinErrors.phone[0]}</span> : null}
                    </div>
                    <div className="form-group">
                      <label>Subject</label>
                      <input name="subject" value={joinForm.subject} onChange={handleChange} aria-invalid={Boolean(joinErrors.subject)} />
                      {joinErrors.subject ? <span className="field-error">{joinErrors.subject[0]}</span> : null}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '15px' }}>
                    <label>Why would you like to join?</label>
                    <textarea
                      name="message"
                      rows={6}
                      value={joinForm.message}
                      onChange={handleChange}
                      placeholder={`Tell us a little about your interest in ${group.name}, your availability, or anything the group team should know.`}
                      aria-invalid={Boolean(joinErrors.message)}
                    />
                    {joinErrors.message ? <span className="field-error">{joinErrors.message[0]}</span> : null}
                  </div>

                  <div className="form-actions-row">
                    <button
                      type="button"
                      className="btn-minimal-dark"
                      style={{ background: '#777' }}
                      onClick={() => {
                        setJoinForm({
                          ...initialJoinForm,
                          subject: group ? `Joining ${group.name}` : '',
                        })
                        setJoinErrors({})
                        setError('')
                      }}
                    >
                      Clear
                    </button>
                    <button type="submit" className="btn-minimal-dark" disabled={loading}>
                      {loading ? 'Sending...' : 'Send Registration'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <FeedbackDialog
        open={successDialogOpen}
        tone="success"
        title="Registration sent successfully"
        message={group ? `Your request to join ${group.name} has been sent to the parish team.` : 'Your request has been sent successfully.'}
        confirmLabel="Back to Parish Groups"
        secondaryLabel="Stay on This Page"
        onClose={() => setSuccessDialogOpen(false)}
        onConfirm={() => navigate('/parish-groups')}
        onSecondary={() => setSuccessDialogOpen(false)}
      />
    </div>
  )
}
