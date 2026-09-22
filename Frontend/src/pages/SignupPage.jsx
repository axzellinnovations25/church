import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../lib/auth'
import { asError, hasErrors, validateEmail, validateMaxLength, validateNameText } from '../lib/validation'
import './AuthPage.css'

const initialForm = {
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
}

const passwordRequirements = [
  { id: 'length', label: 'At least 12 characters', test: value => value.length >= 12 },
  { id: 'lowercase', label: 'One lowercase letter', test: value => /[a-z]/.test(value) },
  { id: 'uppercase', label: 'One uppercase letter', test: value => /[A-Z]/.test(value) },
  { id: 'number', label: 'One number', test: value => /\d/.test(value) },
  { id: 'symbol', label: 'One symbol', test: value => /[^A-Za-z0-9]/.test(value) },
]

function getPasswordRequirementState(password) {
  return passwordRequirements.map(requirement => ({
    ...requirement,
    met: requirement.test(password),
  }))
}

function validatePassword(errors, password) {
  if (!password) {
    errors.password = asError('Password is required.')
    return
  }

  const unmet = getPasswordRequirementState(password).filter(item => !item.met)

  if (!unmet.length) {
    return
  }

  errors.password = asError(`Password must include: ${unmet.map(item => item.label.toLowerCase()).join(', ')}.`)
}

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const requirementState = getPasswordRequirementState(form.password)
  const metRequirementCount = requirementState.filter(item => item.met).length
  const passwordProgress = Math.round((metRequirementCount / requirementState.length) * 100)

  function validateField(name, nextForm) {
    const nextErrors = {}

    if (name === 'name') {
      validateNameText(nextErrors, 'name', nextForm.name, 'Full name', true)
      validateMaxLength(nextErrors, 'name', nextForm.name, 255, 'Full name')
    }

    if (name === 'email') {
      validateEmail(nextErrors, 'email', nextForm.email)
    }

    if (name === 'password') {
      validatePassword(nextErrors, nextForm.password)

      if (nextForm.password_confirmation && nextForm.password !== nextForm.password_confirmation) {
        nextErrors.password_confirmation = asError('Passwords do not match.')
      }
    }

    if (name === 'password_confirmation') {
      if (!nextForm.password_confirmation) {
        nextErrors.password_confirmation = asError('Please confirm your password.')
      } else if (nextForm.password !== nextForm.password_confirmation) {
        nextErrors.password_confirmation = asError('Passwords do not match.')
      }
    }

    return nextErrors
  }

  function handleChange(event) {
    const { name, value } = event.target
    const nextForm = { ...form, [name]: value }
    const nextErrors = validateField(name, nextForm)

    setForm(nextForm)
    setErrors(current => ({
      ...current,
      [name]: nextErrors[name],
      password_confirmation:
        name === 'password' || name === 'password_confirmation'
          ? nextErrors.password_confirmation
          : current.password_confirmation,
    }))
  }

  function handleBlur(event) {
    const { name } = event.target
    const nextTouched = { ...touched, [name]: true }
    const nextErrors = validateField(name, form)

    setTouched(nextTouched)
    setErrors(current => ({
      ...current,
      [name]: nextErrors[name],
      password_confirmation:
        name === 'password' || name === 'password_confirmation'
          ? nextErrors.password_confirmation
          : current.password_confirmation,
    }))
  }

  function validateForm() {
    const nextErrors = {}

    validateNameText(nextErrors, 'name', form.name, 'Full name', true)
    validateMaxLength(nextErrors, 'name', form.name, 255, 'Full name')
    validateEmail(nextErrors, 'email', form.email)
    validatePassword(nextErrors, form.password)

    if (!form.password_confirmation) {
      nextErrors.password_confirmation = asError('Please confirm your password.')
    } else if (form.password !== form.password_confirmation) {
      nextErrors.password_confirmation = asError('Passwords do not match.')
    }

    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationErrors = validateForm()
    setErrors(validationErrors)
    setTouched({
      name: true,
      email: true,
      password: true,
      password_confirmation: true,
    })
    setStatus({ type: '', message: '' })

    if (hasErrors(validationErrors)) {
      setStatus({
        type: 'error',
        message: 'Please fix the highlighted fields before creating your account.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      await signup(form)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrors(error.errors || {})
      setStatus({
        type: 'error',
        message: error.message || 'We could not create the account. Please review the form and try again.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="container auth-layout">
        <aside className="auth-panel">
          <div>
            <span className="auth-kicker">Create Account</span>
            <h1>Join the St Mary's Cathedral community.</h1>
            <p>
              Create your account to get started and access the parish administration area with ease.
            </p>
          </div>

          <div className="auth-highlights">
            <div className="auth-highlight">
              <strong>Quick setup</strong>
              <span>Create your account in a few seconds with your name, email address, and password.</span>
            </div>
            <div className="auth-highlight">
              <strong>Ready to begin</strong>
              <span>Once your account is created, you can continue straight to your dashboard.</span>
            </div>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Create your account</h2>
            <p>Fill in your details below to create a new account.</p>
          </div>

          {status.message ? (
            <div className={`auth-status ${status.type}`}>{status.message}</div>
          ) : null}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={Boolean(errors.name)}
              />
              {touched.name && errors.name ? <span className="auth-field-error">{errors.name[0]}</span> : null}
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email">Email address</label>
              <input
                id="signup-email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={Boolean(errors.email)}
              />
              {touched.email && errors.email ? <span className="auth-field-error">{errors.email[0]}</span> : null}
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={Boolean(errors.password)}
              />
              <div className="auth-password-progress" aria-hidden="true">
                <div className="auth-password-progress-bar" style={{ width: `${passwordProgress}%` }} />
              </div>
              <p className="auth-password-summary">{metRequirementCount}/{requirementState.length} requirements met</p>
              <ul className="auth-password-checklist">
                {requirementState.map(item => (
                  <li key={item.id} className={item.met ? 'is-met' : 'is-pending'}>
                    {item.label}
                  </li>
                ))}
              </ul>
              {touched.password && errors.password ? <span className="auth-field-error">{errors.password[0]}</span> : null}
            </div>

            <div className="auth-field">
              <label htmlFor="password_confirmation">Confirm password</label>
              <input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                autoComplete="new-password"
                value={form.password_confirmation}
                onChange={handleChange}
                onBlur={handleBlur}
                required
                aria-invalid={Boolean(errors.password_confirmation)}
              />
              {touched.password_confirmation && errors.password_confirmation ? <span className="auth-field-error">{errors.password_confirmation[0]}</span> : null}
            </div>

            <div className="auth-actions">
              <button className="btn-primary auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating Account...' : 'Create Account'}
              </button>
              <Link className="auth-link" to="/login">
                Already registered? Sign in
              </Link>
            </div>
          </form>

          <div className="auth-after">
            <p>Already have an account? Sign in and continue to your dashboard.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
