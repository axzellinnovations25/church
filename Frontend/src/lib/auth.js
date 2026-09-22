const AUTH_BASE = '/auth-api'
const FALLBACK_BACKEND_ORIGIN = 'http://127.0.0.1:8000'

let csrfToken = null

function getBackendOrigin() {
  return (import.meta.env.VITE_BACKEND_ORIGIN || '').replace(/\/$/, '')
}

export function getBackendUrl(path = '') {
  const backendOrigin = getBackendOrigin()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (backendOrigin) {
    return `${backendOrigin}${normalizedPath}`
  }

  return normalizedPath
}

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return {}
}

async function ensureCsrfToken() {
  const response = await fetch(getBackendUrl(`${AUTH_BASE}/csrf-token`), {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })

  const payload = await parseJsonResponse(response)

  if (!response.ok || !payload.csrf_token) {
    throw new Error('Unable to start a secure session with the backend.')
  }

  csrfToken = payload.csrf_token
  return csrfToken
}

function normalizeError(payload, fallbackMessage) {
  if (payload?.errors && typeof payload.errors === 'object') {
    return {
      message: payload.message || fallbackMessage,
      errors: payload.errors,
    }
  }

  return {
    message: payload?.message || fallbackMessage,
    errors: {},
  }
}

async function authRequest(path, body) {
  const token = await ensureCsrfToken()

  const response = await fetch(getBackendUrl(`${AUTH_BASE}${path}`), {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': token,
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: JSON.stringify(body),
  })

  const payload = await parseJsonResponse(response)

  if (!response.ok) {
    if (response.status === 419) {
      csrfToken = null
    }

    throw normalizeError(payload, 'Authentication request failed.')
  }

  return payload
}

export async function signup(formData) {
  return authRequest('/signup', formData)
}

export async function login(formData) {
  return authRequest('/login', formData)
}

export async function requestPasswordReset(formData) {
  return authRequest('/forgot-password', formData)
}

export async function resetPassword(formData) {
  return authRequest('/reset-password', formData)
}

export async function logout() {
  return authRequest('/logout', {})
}

export async function getCurrentUser() {
  const response = await fetch(getBackendUrl(`${AUTH_BASE}/me`), {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })

  if (response.status === 401) {
    return null
  }

  const payload = await parseJsonResponse(response)

  if (!response.ok) {
    throw normalizeError(payload, 'Unable to load the current user.')
  }

  return payload.user || null
}

export function getAdminDashboardUrl() {
  const backendOrigin = getBackendOrigin() || FALLBACK_BACKEND_ORIGIN
  return `${backendOrigin}/dashboard`
}
