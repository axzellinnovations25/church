import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../lib/auth'
import { hasErrors, requireField, validateEmail } from '../lib/validation'
import './AuthPage.css'

const initialForm = {
  email: '',
  password: '',
  password_confirmation: '',
}

function passwordChecks(password) {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Includes an uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Includes a lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Includes a number', met: /\d/.test(password) },
  ]
}

export default function ResetPasswordPage() {
  const { token } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const emailFromLink = searchParams.get('email') || ''
  const [form, setForm] = useState({ ...initialForm, email: emailFromLink })
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const checks = useMemo(() => passwordChecks(form.password), [form.password])
  const strength = checks.filter(check => check.met).length

  function handleChange(event) {
    const { name, value } = event.target
    const nextErrors = {}

    if (name === 'email') {
      validateEmail(nextErrors, 'email', value)
    }

    if (name === 'password') {
      requireField(nextErrors, 'password', value, 'Password')
      if (value && value.length < 8) {
        nextErrors.password = ['Password must be at least 8 characters.']
      }
    }

    if (name === 'password_confirmation') {
      requireField(nextErrors, 'password_confirmation', value, 'Password confirmation')
      if (value && value !== form.password) {
        nextErrors.password_confirmation = ['Password confirmation must match the password.']
      }
    }

    setForm(current => ({ ...current, [name]: value }))
    setErrors(current => ({ ...current, [name]: nextErrors[name] }))
  }

  function validateForm() {
    const nextErrors = {}

    validateEmail(nextErrors, 'email', form.email)
    requireField(nextErrors, 'password', form.password, 'Password')
    requireField(nextErrors, 'password_confirmation', form.password_confirmation, 'Password confirmation')

    if (form.password && form.password.length < 8) {
      nextErrors.password = ['Password must be at least 8 characters.']
    }

    if (form.password_confirmation && form.password_confirmation !== form.password) {
      nextErrors.password_confirmation = ['Password confirmation must match the password.']
    }

    if (!token) {
      nextErrors.token = ['This password reset link is missing its secure token.']
    }

    return nextErrors
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const validationErrors = validateForm()
    setErrors(validationErrors)
    setStatus({ type: '', message: '' })

    if (hasErrors(validationErrors)) {
      setStatus({
        type: 'error',
        message: validationErrors.token?.[0] || 'Please review the highlighted fields.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const payload = await resetPassword({
        token,
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.password_confirmation,
      })

      setStatus({
        type: 'success',
        message: payload.message || 'Your password has been reset. You can now sign in.',
      })

      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1600)
    } catch (error) {
      setErrors(error.errors || {})
      setStatus({
        type: 'error',
        message: error.message || 'We could not reset your password. Please request a new reset link.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="container auth-layout auth-layout-centered">
        <aside className="auth-panel">
          <div>
            <span className="auth-kicker">Secure Reset</span>
            <h1>Create a new password for your account.</h1>
            <p>
              Use a password you have not used elsewhere. After the reset is complete, you will be returned to the sign-in page.
            </p>
          </div>

          <div className="auth-highlights">
            <div className="auth-highlight">
              <strong>Reset links expire</strong>
              <span>If this link no longer works, request a fresh reset email from the login page.</span>
            </div>
            <div className="auth-highlight">
              <strong>Keep it private</strong>
              <span>Do not share your password with anyone, including parish colleagues.</span>
            </div>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Set new password</h2>
            <p>Confirm your email address and choose a new password.</p>
          </div>

          {status.message ? (
            <div className={`auth-status ${status.type}`}>{status.message}</div>
          ) : null}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? <span className="auth-field-error">{errors.email[0]}</span> : null}
            </div>

            <div className="auth-field">
              <label htmlFor="password">New password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={handleChange}
                required
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password ? <span className="auth-field-error">{errors.password[0]}</span> : null}
            </div>

            <div className="auth-password-meter">
              <div className="auth-password-progress" aria-hidden="true">
                <div className="auth-password-progress-bar" style={{ width: `${(strength / checks.length) * 100}%` }} />
              </div>
              <ul className="auth-password-checklist">
                {checks.map(check => (
                  <li key={check.label} className={check.met ? 'is-met' : 'is-pending'}>
                    {check.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="auth-field">
              <label htmlFor="password_confirmation">Confirm new password</label>
              <input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                autoComplete="new-password"
                value={form.password_confirmation}
                onChange={handleChange}
                required
                aria-invalid={Boolean(errors.password_confirmation)}
              />
              {errors.password_confirmation ? <span className="auth-field-error">{errors.password_confirmation[0]}</span> : null}
            </div>

            <div className="auth-actions auth-actions-stack">
              <button className="btn-primary auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
              </button>
              <Link className="auth-link" to="/forgot-password">
                Request a new link
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

