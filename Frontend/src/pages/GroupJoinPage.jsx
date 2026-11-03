import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import FeedbackDialog from '../components/FeedbackDialog'
import PageHero from '../components/PageHero'
import { getBackendUrl } from '../lib/auth'
import { publicQueries } from '../lib/publicData'
import { firstError, hasErrors, requireField, validateEmail, validateMaxLength, validateNameText, validatePhone } from '../lib/validation'
import './ContactPage.css'
import './GroupJoinPage.css'

const ministryNames = [
  'Spiritual Formation',
  'Community Cohesion',
  'Prayer Groups',
  'Youth Group',
  'SVP',
  'Extraordinary Ministers',
  'Choir',
  'Altar Servers',
  'Readers',
  'Cleaning Teams',
  'Gardeners',
  'Hospitality Volunteers',
  'Building & Maintenance',
  'Safety & Security',
  'Fundraising Group',
  'Catechists',
  'Tour Guides',
]

const initialJoinForm = {
  intent: 'join',
  group_choice: '',
  other_group: '',
  name: '',
  email: '',
  phone: '',
  message: '',
}

function normaliseName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/st\.?\s+vincent\s+de\s+paul\s+society/g, 'svp')
    .replace(/prayer\s+group/g, 'prayer groups')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export default function GroupJoinPage() {
  const { groupSlug } = useParams()
  const navigate = useNavigate()
  const { data: groups = [], isPending: isLoadingGroups } = useQuery(publicQueries.groups)
  const [joinForm, setJoinForm] = useState(initialJoinForm)
  const [joinErrors, setJoinErrors] = useState({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const groupOptions = useMemo(() => {
    const activeOptions = groups.map(group => ({
      key: `active:${group.id}`,
      name: group.name,
      group,
    }))
    const activeNames = new Set(activeOptions.map(option => normaliseName(option.name)))
    const additionalOptions = ministryNames
      .filter(name => !activeNames.has(normaliseName(name)))
      .map(name => ({ key: `ministry:${normaliseName(name)}`, name, group: null }))

    return [...activeOptions, ...additionalOptions]
      .sort((left, right) => left.name.localeCompare(right.name))
  }, [groups])

  const selectedOption = groupOptions.find(option => option.key === joinForm.group_choice) || null
  const selectedName = joinForm.group_choice === 'other' ? joinForm.other_group.trim() : selectedOption?.name || ''

  useEffect(() => {
    if (!groupSlug || !groups.length) {
      return
    }

    const requestedGroup = groups.find(group => group.slug === groupSlug)
    if (requestedGroup) {
      setJoinForm(current => ({ ...current, group_choice: `active:${requestedGroup.id}` }))
    }
  }, [groupSlug, groups])

  function handleChange(event) {
    const { name, value } = event.target
    const nextErrors = {}

    if (name === 'name') {
      validateNameText(nextErrors, 'name', value, 'Name', true)
      validateMaxLength(nextErrors, 'name', value, 255, 'Name')
    } else if (name === 'email') {
      validateEmail(nextErrors, 'email', value)
    } else if (name === 'phone') {
      validatePhone(nextErrors, 'phone', value, 'Phone number', true)
    } else if (name === 'group_choice') {
      requireField(nextErrors, 'group_choice', value, 'Group or ministry')
    } else if (name === 'other_group') {
      requireField(nextErrors, 'other_group', value, 'Group or ministry name')
      validateMaxLength(nextErrors, 'other_group', value, 120, 'Group or ministry name')
    } else if (name === 'message') {
      requireField(nextErrors, 'message', value, 'Message')
      validateMaxLength(nextErrors, 'message', value, 5000, 'Message')
    }

    setJoinForm(current => ({
      ...current,
      [name]: value,
      ...(name === 'group_choice' && value !== 'other' ? { other_group: '' } : {}),
    }))
    setJoinErrors(current => ({ ...current, [name]: nextErrors[name] }))
  }

  function validateForm() {
    const nextErrors = {}
    validateNameText(nextErrors, 'name', joinForm.name, 'Name', true)
    validateMaxLength(nextErrors, 'name', joinForm.name, 255, 'Name')
    validateEmail(nextErrors, 'email', joinForm.email)
    validatePhone(nextErrors, 'phone', joinForm.phone, 'Phone number', true)
    requireField(nextErrors, 'group_choice', joinForm.group_choice, 'Group or ministry')

    if (joinForm.group_choice === 'other') {
      requireField(nextErrors, 'other_group', joinForm.other_group, 'Group or ministry name')
      validateMaxLength(nextErrors, 'other_group', joinForm.other_group, 120, 'Group or ministry name')
    }

    requireField(nextErrors, 'message', joinForm.message, 'Message')
    validateMaxLength(nextErrors, 'message', joinForm.message, 5000, 'Message')
    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationErrors = validateForm()
    setJoinErrors(validationErrors)

    if (hasErrors(validationErrors)) {
      setError(firstError(validationErrors) || 'Please review the highlighted fields.')
      return
    }

    const activeGroup = selectedOption?.group || null
    const isJoinRequest = joinForm.intent === 'join'
    const subject = `${isJoinRequest ? 'Joining' : 'Enquiry about'} ${selectedName}`
    const message = activeGroup
      ? joinForm.message
      : `Group or ministry: ${selectedName}\nRequest type: ${isJoinRequest ? 'Join the group' : 'More information'}\n\n${joinForm.message}`

    setLoading(true)
    setError('')

    try {
      const response = await fetch(getBackendUrl('/api/v1/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: joinForm.name,
          email: joinForm.email,
          phone: joinForm.phone,
          subject,
          message,
          category: activeGroup ? 'group_join' : 'general',
          ...(activeGroup ? { group_id: activeGroup.id } : {}),
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
        throw new Error(firstApiError || (response.status < 500 && payload?.message) || 'Unable to send your group enquiry right now. Please try again in a moment.')
      }

      setSuccessMessage(`Your ${isJoinRequest ? 'request to join' : 'request for information about'} ${selectedName} has been sent to the parish team.`)
      setJoinForm({ ...initialJoinForm, group_choice: groupSlug && activeGroup ? `active:${activeGroup.id}` : '' })
      setJoinErrors({})
      setSuccessDialogOpen(true)
    } catch (submitError) {
      console.error('Group enquiry submission error:', submitError)
      setError(submitError?.message || 'Unable to send your group enquiry right now. Please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="contact-page-container group-join-page">
      <PageHero title="Join Group" subtitle="Choose a parish group or ministry to join, or ask for more information." centered={true} />

      <section className="section">
        <div className="container group-join-layout">
          <aside className="group-join-aside">
            <p className="contact-kicker">Get connected</p>
            <h2>Find the right group for you</h2>
            <p>Select any listed group or ministry. If you cannot find the one you want, choose “Another group or ministry” and type its name.</p>
            <ul>
              <li>Join an active group</li>
              <li>Ask for more information first</li>
              <li>Tell us about another ministry</li>
            </ul>
            <Link to="/parish-groups" className="group-join-back-link">View all community opportunities</Link>
          </aside>

          <div className="group-join-form-card">
            <div className="group-join-form-heading">
              <p className="contact-kicker">Group enquiry</p>
              <h2>How would you like to get involved?</h2>
            </div>

            {error ? <div className="contact-feedback error">{error}</div> : null}
            {isLoadingGroups ? <div className="contact-feedback">Loading active groups…</div> : null}

            <form className="contact-form-minimal" onSubmit={handleSubmit} noValidate>
              <fieldset className="group-intent-fieldset">
                <legend>What would you like to do?</legend>
                <label className="radio-option">
                  <input type="radio" name="intent" value="join" checked={joinForm.intent === 'join'} onChange={handleChange} />
                  Join the group
                </label>
                <label className="radio-option">
                  <input type="radio" name="intent" value="learn" checked={joinForm.intent === 'learn'} onChange={handleChange} />
                  Ask for more information
                </label>
              </fieldset>

              <div className="form-group">
                <label htmlFor="group-choice">Which group or ministry?</label>
                <select id="group-choice" name="group_choice" value={joinForm.group_choice} onChange={handleChange} aria-invalid={Boolean(joinErrors.group_choice)}>
                  <option value="">Select a group or ministry</option>
                  {groupOptions.map(option => <option key={option.key} value={option.key}>{option.name}</option>)}
                  <option value="other">Another group or ministry</option>
                </select>
                {joinErrors.group_choice ? <span className="field-error">{joinErrors.group_choice[0]}</span> : null}
              </div>

              {joinForm.group_choice === 'other' ? (
                <div className="form-group">
                  <label htmlFor="other-group">Group or ministry name</label>
                  <input id="other-group" name="other_group" value={joinForm.other_group} onChange={handleChange} placeholder="Type the group or ministry" aria-invalid={Boolean(joinErrors.other_group)} />
                  {joinErrors.other_group ? <span className="field-error">{joinErrors.other_group[0]}</span> : null}
                </div>
              ) : null}

              <div className="contact-form-grid">
                <div className="form-group">
                  <label htmlFor="join-name">Name</label>
                  <input id="join-name" name="name" value={joinForm.name} onChange={handleChange} aria-invalid={Boolean(joinErrors.name)} />
                  {joinErrors.name ? <span className="field-error">{joinErrors.name[0]}</span> : null}
                </div>
                <div className="form-group">
                  <label htmlFor="join-email">Email</label>
                  <input id="join-email" type="email" name="email" value={joinForm.email} onChange={handleChange} aria-invalid={Boolean(joinErrors.email)} />
                  {joinErrors.email ? <span className="field-error">{joinErrors.email[0]}</span> : null}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="join-phone">Phone Number</label>
                <input id="join-phone" name="phone" value={joinForm.phone} onChange={handleChange} aria-invalid={Boolean(joinErrors.phone)} />
                {joinErrors.phone ? <span className="field-error">{joinErrors.phone[0]}</span> : null}
              </div>

              <div className="form-group">
                <label htmlFor="join-message">Message</label>
                <textarea id="join-message" name="message" rows={6} value={joinForm.message} onChange={handleChange} placeholder="Tell us about your interest, availability, or what you would like to know." aria-invalid={Boolean(joinErrors.message)} />
                {joinErrors.message ? <span className="field-error">{joinErrors.message[0]}</span> : null}
              </div>

              <div className="form-actions-row">
                <button type="button" className="btn-form-secondary" onClick={() => {
                  setJoinForm({ ...initialJoinForm, group_choice: groupSlug && selectedOption?.group ? selectedOption.key : '' })
                  setJoinErrors({})
                  setError('')
                }}>Clear</button>
                <button type="submit" className="btn-form-primary" disabled={loading}>{loading ? 'Sending…' : 'Send Enquiry'}</button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <FeedbackDialog
        open={successDialogOpen}
        tone="success"
        title="Group enquiry sent"
        message={successMessage}
        confirmLabel="Back to Community"
        secondaryLabel="Stay on This Page"
        onClose={() => setSuccessDialogOpen(false)}
        onConfirm={() => navigate('/parish-groups')}
        onSecondary={() => setSuccessDialogOpen(false)}
      />
    </div>
  )
}
