import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import FeedbackDialog from '../../components/FeedbackDialog'
import { deleteProfile, updatePassword, updateProfile } from '../../lib/admin'
import { titleCaseWords } from '../../lib/textFormat'
import { asError, hasErrors, requireField, validateEmail, validateMaxLength, validateNameText } from '../../lib/validation'

const emptyPasswordForm = {
  current_password: '',
  password: '',
  password_confirmation: '',
}

function FieldError({ errors, name }) {
  if (!errors?.[name]?.[0]) {
    return null
  }

  return <p className="admin-field-error">{errors[name][0]}</p>
}

function normalizeErrors(error) {
  return error?.errors && typeof error.errors === 'object' ? error.errors : {}
}

function validatePasswordForm(form) {
  const nextErrors = {}

  requireField(nextErrors, 'current_password', form.current_password, 'Current password')
  requireField(nextErrors, 'password', form.password, 'New password')

  if (form.password && form.password.length < 8) {
    nextErrors.password = asError('New password must be at least 8 characters.')
  }

  if (!form.password_confirmation) {
    nextErrors.password_confirmation = asError('Please confirm the new password.')
  } else if (form.password !== form.password_confirmation) {
    nextErrors.password_confirmation = asError('Passwords do not match.')
  }

  return nextErrors
}

export default function AdminProfilePage() {
  const navigate = useNavigate()
  const { user, refreshUser, isLoggingOut, requestLogout } = useOutletContext()
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm)
  const [deletePassword, setDeletePassword] = useState('')
  const [profileErrors, setProfileErrors] = useState({})
  const [passwordErrors, setPasswordErrors] = useState({})
  const [deleteErrors, setDeleteErrors] = useState({})
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPassword, setIsSavingPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [dialogState, setDialogState] = useState({
    open: false,
    tone: 'neutral',
    title: '',
    message: '',
  })

  useEffect(() => {
    setProfileForm({ name: user?.name || '', email: user?.email || '' })
  }, [user])

  function closeDialog() {
    setDialogState(current => ({ ...current, open: false }))
  }

  function openDialog(tone, title, message) {
    setDialogState({ open: true, tone, title, message })
  }

  function validateProfile(form = profileForm) {
    const nextErrors = {}

    validateNameText(nextErrors, 'name', form.name, 'Name', true)
    validateMaxLength(nextErrors, 'name', form.name, 255, 'Name')
    validateEmail(nextErrors, 'email', form.email)
    validateMaxLength(nextErrors, 'email', form.email, 255, 'Email address')

    return nextErrors
  }

  function handleProfileChange(event) {
    const { name, value } = event.target
    const nextForm = { ...profileForm, [name]: value }
    const nextErrors = validateProfile(nextForm)

    setProfileForm(nextForm)
    setProfileErrors(current => ({ ...current, [name]: nextErrors[name] }))
  }

  function formatProfileField(name) {
    setProfileForm(current => ({
      ...current,
      [name]: titleCaseWords(current[name] || ''),
    }))
  }

  function handlePasswordChange(event) {
    const { name, value } = event.target
    const nextForm = { ...passwordForm, [name]: value }
    const nextErrors = validatePasswordForm(nextForm)

    setPasswordForm(nextForm)
    setPasswordErrors(current => ({
      ...current,
      [name]: nextErrors[name],
      password_confirmation: name === 'password' || name === 'password_confirmation'
        ? nextErrors.password_confirmation
        : current.password_confirmation,
    }))
  }

  async function submitProfile(event) {
    event.preventDefault()

    const nextErrors = validateProfile()
    setProfileErrors(nextErrors)

    if (hasErrors(nextErrors)) {
      return
    }

    setIsSavingProfile(true)

    try {
      const payload = await updateProfile({
        name: profileForm.name.trim(),
        email: profileForm.email.trim().toLowerCase(),
      })

      setProfileErrors({})
      await refreshUser?.()
      openDialog('success', 'Profile updated', payload.message || 'Your admin profile has been updated.')
    } catch (error) {
      setProfileErrors(normalizeErrors(error))
      openDialog('error', 'Unable to update profile', error.message || 'Please check the profile details and try again.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function submitPassword(event) {
    event.preventDefault()

    const nextErrors = validatePasswordForm(passwordForm)
    setPasswordErrors(nextErrors)

    if (hasErrors(nextErrors)) {
      return
    }

    setIsSavingPassword(true)

    try {
      const payload = await updatePassword(passwordForm)

      setPasswordForm(emptyPasswordForm)
      setPasswordErrors({})
      openDialog('success', 'Password updated', payload.message || 'Your password has been changed.')
    } catch (error) {
      setPasswordErrors(normalizeErrors(error))
      openDialog('error', 'Unable to update password', error.message || 'Please check your current password and try again.')
    } finally {
      setIsSavingPassword(false)
    }
  }

  function requestDelete(event) {
    event.preventDefault()

    if (!deletePassword) {
      setDeleteErrors({ password: asError('Password is required before deleting this account.') })
      return
    }

    setDeleteErrors({})
    setConfirmDeleteOpen(true)
  }

  async function confirmDelete() {
    setIsDeleting(true)

    try {
      await deleteProfile({ password: deletePassword })
      setConfirmDeleteOpen(false)
      navigate('/login', { replace: true })
    } catch (error) {
      setConfirmDeleteOpen(false)
      setDeleteErrors(normalizeErrors(error))
      openDialog('error', 'Unable to delete account', error.message || 'Please check your password and try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="admin-page-grid">
      <article className="admin-surface">
          <div className="admin-section-head">
            <div>
              <h2>Admin profile</h2>
              <p>Keep the account name and email address used for admin access up to date.</p>
            </div>
            <button className="btn-outline admin-logout-inline" type="button" onClick={requestLogout} disabled={isLoggingOut}>
              {isLoggingOut ? 'Signing Out...' : 'Logout'}
            </button>
          </div>

        <form className="admin-form" onSubmit={submitProfile} noValidate>
          <div className="admin-form-grid">
            <label htmlFor="admin-profile-name">
              <span>Name</span>
              <input
                id="admin-profile-name"
                name="name"
                type="text"
                value={profileForm.name}
                onChange={handleProfileChange}
                onBlur={() => formatProfileField('name')}
                aria-invalid={Boolean(profileErrors.name)}
                autoComplete="name"
              />
              <FieldError errors={profileErrors} name="name" />
            </label>

            <label htmlFor="admin-profile-email">
              <span>Email address</span>
              <input
                id="admin-profile-email"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                aria-invalid={Boolean(profileErrors.email)}
                autoComplete="email"
              />
              <FieldError errors={profileErrors} name="email" />
            </label>
          </div>

          <div className="admin-detail-grid">
            <div className="admin-detail-card">
              <span>Current account</span>
              <strong>{user?.name ? titleCaseWords(user.name) : 'Admin User'}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Login email</span>
              <strong>{user?.email || 'Not available'}</strong>
            </div>
            <div className="admin-detail-card">
              <span>Username</span>
              <strong>{user?.email || (user?.name ? titleCaseWords(user.name) : 'Not available')}</strong>
            </div>
          </div>

          <div className="admin-actions">
            <button className="btn-primary" type="submit" disabled={isSavingProfile}>
              {isSavingProfile ? 'Saving...' : 'Save profile'}
            </button>
          </div>
        </form>
      </article>

      <div className="admin-page-grid">
        <article className="admin-surface">
          <div className="admin-section-head">
            <div>
              <h2>Password</h2>
              <p>Change the password for this admin account.</p>
            </div>
          </div>

          <form className="admin-form" onSubmit={submitPassword} noValidate>
            <label htmlFor="admin-current-password">
              <span>Current password</span>
              <input
                id="admin-current-password"
                name="current_password"
                type="password"
                value={passwordForm.current_password}
                onChange={handlePasswordChange}
                aria-invalid={Boolean(passwordErrors.current_password)}
                autoComplete="current-password"
              />
              <FieldError errors={passwordErrors} name="current_password" />
            </label>

            <label htmlFor="admin-new-password">
              <span>New password</span>
              <input
                id="admin-new-password"
                name="password"
                type="password"
                value={passwordForm.password}
                onChange={handlePasswordChange}
                aria-invalid={Boolean(passwordErrors.password)}
                autoComplete="new-password"
              />
              <FieldError errors={passwordErrors} name="password" />
            </label>

            <label htmlFor="admin-password-confirmation">
              <span>Confirm new password</span>
              <input
                id="admin-password-confirmation"
                name="password_confirmation"
                type="password"
                value={passwordForm.password_confirmation}
                onChange={handlePasswordChange}
                aria-invalid={Boolean(passwordErrors.password_confirmation)}
                autoComplete="new-password"
              />
              <FieldError errors={passwordErrors} name="password_confirmation" />
            </label>

            <div className="admin-actions">
              <button className="btn-primary" type="submit" disabled={isSavingPassword}>
                {isSavingPassword ? 'Updating...' : 'Update password'}
              </button>
            </div>
          </form>
        </article>

        <article className="admin-surface admin-danger-surface">
          <div className="admin-section-head">
            <div>
              <h2>Delete account</h2>
              <p>Remove this admin account permanently after confirming the password.</p>
            </div>
          </div>

          <form className="admin-form" onSubmit={requestDelete} noValidate>
            <label htmlFor="admin-delete-password">
              <span>Confirm password</span>
              <input
                id="admin-delete-password"
                name="password"
                type="password"
                value={deletePassword}
                onChange={event => {
                  setDeletePassword(event.target.value)
                  setDeleteErrors({})
                }}
                aria-invalid={Boolean(deleteErrors.password)}
                autoComplete="current-password"
              />
              <FieldError errors={deleteErrors} name="password" />
            </label>

            <div className="admin-actions">
              <button className="btn-outline admin-danger-button" type="submit" disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete account'}
              </button>
            </div>
          </form>
        </article>
      </div>

      <FeedbackDialog
        open={dialogState.open}
        tone={dialogState.tone}
        title={dialogState.title}
        message={dialogState.message}
        onClose={closeDialog}
      />
      <FeedbackDialog
        open={confirmDeleteOpen}
        tone="error"
        variant="confirm"
        title="Delete this admin account?"
        message="This will permanently remove the account and sign you out."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete account'}
        cancelLabel="Keep account"
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}
