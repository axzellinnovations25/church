import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../lib/auth'
import { hasErrors, validateEmail } from '../lib/validation'
import './AuthPage.css'

const initialForm = {
  email: '',
}

export default function ForgotPasswordPage() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ type: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    const nextErrors = {}

    if (name === 'email') {
      validateEmail(nextErrors, 'email', value)
    }

    setForm(current => ({ ...current, [name]: value }))
    setErrors(current => ({ ...current, [name]: nextErrors[name] }))
  }

  function validateForm() {
    const nextErrors = {}
    validateEmail(nextErrors, 'email', form.email)
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
        message: 'Please enter a valid email address.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const payload = await requestPasswordReset({ email: form.email.trim() })
      setStatus({
        type: 'success',
        message: payload.message || 'If an account exists for that email address, a password reset link has been sent.',
      })
    } catch (error) {
      setErrors(error.errors || {})
      setStatus({
        type: 'error',
        message: error.message || 'We could not send a reset link. Please try again.',
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
            <span className="auth-kicker">Password Help</span>
            <h1>Reset your admin password securely.</h1>
            <p>
              Enter the email address linked to your St Mary's Cathedral account and we will send a secure reset link.
            </p>
          </div>

          <div className="auth-highlights">
            <div className="auth-highlight">
              <strong>Check your inbox</strong>
              <span>The reset email may take a few minutes to arrive. Please also check your spam folder.</span>
            </div>
            <div className="auth-highlight">
              <strong>Use a strong password</strong>
              <span>Choose a password that is unique to this account and difficult to guess.</span>
            </div>
          </div>
        </aside>

        <div className="auth-card">
          <div className="auth-card-header">
            <h2>Forgot password?</h2>
            <p>We will email you a secure link to create a new password.</p>
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

            <div className="auth-actions auth-actions-stack">
              <button className="btn-primary auth-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
              </button>
              <Link className="auth-link" to="/login">
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

