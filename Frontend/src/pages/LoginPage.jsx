import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../lib/auth'
import { hasErrors, validateEmail, requireField } from '../lib/validation'
import './AuthPage.css'

const initialForm = {
  email: '',
  password: '',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    const nextForm = { ...form, [name]: value }
    const nextErrors = {}

    if (name === 'email') {
      validateEmail(nextErrors, 'email', value)
    }

    if (name === 'password') {
      requireField(nextErrors, 'password', value, 'Password')
    }

    setForm(nextForm)
    setErrors(current => ({ ...current, [name]: nextErrors[name] }))
  }

  function validateForm() {
    const nextErrors = {}

    validateEmail(nextErrors, 'email', form.email)
    requireField(nextErrors, 'password', form.password, 'Password')

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
        message: 'Please fix the highlighted fields before signing in.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      await login(form)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrors(error.errors || {})
      setStatus({
        type: 'error',
        message: error.message || 'We could not log you in. Please try again.',
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
            <span className="auth-kicker">Member Access</span>
            <h1>Welcome back to St Mary's Cathedral.</h1>
            <p>
              Sign in to continue to your account and access the parish administration area.
            </p>
          </div>

          <div className="auth-highlights">
            <div className="auth-highlight">
              <strong>Simple and secure</strong>
              <span>Your account details are protected and your session is securely managed while you sign in.</span>
            </div>
            <div className="auth-highlight">
              <strong>Stay connected</strong>
              <span>Access your dashboard, manage parish content, and continue where you left off.</span>
            </div>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Welcome back</h2>
            <p>Enter your email address and password to sign in to your account.</p>
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
              <div className="auth-label-row">
                <label htmlFor="password">Password</label>
                <Link className="auth-forgot-link" to="/forgot-password">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                required
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password ? <span className="auth-field-error">{errors.password[0]}</span> : null}
            </div>

            <div className="auth-actions">
              <button className="btn-primary auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </button>
              <Link className="auth-link" to="/signup">
                Need an account? Create one
              </Link>
            </div>
          </form>
          <div className="auth-after">
            <p>Need an account? Create one in just a moment and come straight back here.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
