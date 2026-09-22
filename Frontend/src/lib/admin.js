import { getBackendUrl } from './auth'

let csrfToken = null
let overviewRequest = null
let headerSummaryRequest = null
let headerSummaryCache = null
let headerSummaryExpiresAt = 0

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return {}
}

async function ensureCsrfToken() {
  if (csrfToken) {
    return csrfToken
  }

  const response = await fetch(getBackendUrl('/auth-api/csrf-token'), {
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })

  const payload = await parseJsonResponse(response)

  if (!response.ok || !payload.csrf_token) {
    throw new Error('Unable to start a secure admin session with the backend.')
  }

  csrfToken = payload.csrf_token
  return csrfToken
}

function buildAdminHeaders(method, body, token) {
  const isFormData = body instanceof FormData
  const headers = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  }

  if (!['GET', 'HEAD'].includes(method)) {
    headers['X-CSRF-TOKEN'] = token

    if (!isFormData) {
      headers['Content-Type'] = 'application/json'
    }
  }

  return headers
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

async function adminRequest(path, { method = 'GET', body } = {}) {
  const upperMethod = method.toUpperCase()
  const isFormData = body instanceof FormData

  async function sendRequest(forceRefreshToken = false) {
    let token = csrfToken

    if (!['GET', 'HEAD'].includes(upperMethod)) {
      if (forceRefreshToken) {
        csrfToken = null
      }

      token = await ensureCsrfToken()
    }

    const response = await fetch(getBackendUrl(path), {
      method: upperMethod,
      credentials: 'include',
      headers: buildAdminHeaders(upperMethod, body, token),
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    })

    const payload = await parseJsonResponse(response)

    return { response, payload }
  }

  let { response, payload } = await sendRequest()

  if (!response.ok && response.status === 419 && !['GET', 'HEAD'].includes(upperMethod)) {
    ;({ response, payload } = await sendRequest(true))
  }

  if (!response.ok) {
    if (response.status === 419) {
      csrfToken = null
    }

    throw normalizeError(payload, 'The admin request could not be completed.')
  }

  return payload
}

export function listEvents(page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  return adminRequest(`/admin/events?${params.toString()}`)
}

export function getOverview() {
  if (!overviewRequest) {
    overviewRequest = adminRequest('/admin/overview').finally(() => {
      overviewRequest = null
    })
  }

  return overviewRequest
}

export function getHeaderSummary() {
  if (headerSummaryCache && Date.now() < headerSummaryExpiresAt) {
    return Promise.resolve(headerSummaryCache)
  }

  if (!headerSummaryRequest) {
    headerSummaryRequest = adminRequest('/admin/header-summary')
      .then(payload => {
        headerSummaryCache = payload
        headerSummaryExpiresAt = Date.now() + 30_000
        return payload
      })
      .finally(() => {
        headerSummaryRequest = null
      })
  }

  return headerSummaryRequest
}

export function updateOverviewItemVisibility(itemKey, visibility) {
  return adminRequest('/admin/overview/items/visibility', {
    method: 'PATCH',
    body: {
      item_key: itemKey,
      visibility,
    },
  })
}

export function getEvent(id) {
  return adminRequest(`/admin/events/${id}/edit`)
}

export function createEvent(data) {
  return adminRequest('/admin/events', { method: 'POST', body: data })
}

export function updateEvent(id, data) {
  if (data instanceof FormData) {
    data.append('_method', 'PUT')
    return adminRequest(`/admin/events/${id}`, { method: 'POST', body: data })
  }

  return adminRequest(`/admin/events/${id}`, { method: 'PUT', body: data })
}

export function deleteEvent(id) {
  return adminRequest(`/admin/events/${id}`, { method: 'DELETE' })
}

export function listEventsByDate(date) {
  const params = new URLSearchParams({ date })
  return adminRequest(`/admin/events/by-date?${params.toString()}`)
}

export function listMassTimes(page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  return adminRequest(`/admin/mass-times?${params.toString()}`)
}

export function getMassTime(id) {
  return adminRequest(`/admin/mass-times/${id}/edit`)
}

export function createMassTime(data) {
  return adminRequest('/admin/mass-times', { method: 'POST', body: data })
}

export function updateMassTime(id, data) {
  return adminRequest(`/admin/mass-times/${id}`, { method: 'PUT', body: data })
}

export function deleteMassTime(id) {
  return adminRequest(`/admin/mass-times/${id}`, { method: 'DELETE' })
}

export function listMassTimesByDay(day, location = '') {
  const params = new URLSearchParams()

  if (day) {
    params.set('day', day)
  }

  if (location) {
    params.set('location', location)
  }

  return adminRequest(`/admin/mass-times/by-day?${params.toString()}`)
}

export function listNewsletters(page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  return adminRequest(`/admin/newsletters?${params.toString()}`)
}

export function getNewsletter(id) {
  return adminRequest(`/admin/newsletters/${id}/edit`)
}

export function createNewsletter(data) {
  return adminRequest('/admin/newsletters', { method: 'POST', body: data })
}

export function updateNewsletter(id, data) {
  return adminRequest(`/admin/newsletters/${id}`, { method: 'POST', body: data })
}

export function deleteNewsletter(id) {
  return adminRequest(`/admin/newsletters/${id}`, { method: 'DELETE' })
}

export function listNewsPosts(page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  return adminRequest(`/admin/news?${params.toString()}`)
}

export function getNewsPost(id) {
  return adminRequest(`/admin/news/${id}/edit`)
}

export function createNewsPost(data) {
  return adminRequest('/admin/news', { method: 'POST', body: data })
}

export function updateNewsPost(id, data) {
  return adminRequest(`/admin/news/${id}`, { method: 'POST', body: data })
}

export function deleteNewsPost(id) {
  return adminRequest(`/admin/news/${id}`, { method: 'DELETE' })
}

export function listRegistrations(page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  return adminRequest(`/admin/parish-registrations?${params.toString()}`)
}

export function getRegistration(id) {
  return adminRequest(`/admin/parish-registrations/${id}`)
}

export function updateRegistration(id, data) {
  return adminRequest(`/admin/parish-registrations/${id}`, { method: 'PUT', body: data })
}

export function deleteRegistration(id) {
  return adminRequest(`/admin/parish-registrations/${id}`, { method: 'DELETE' })
}

export function listContactMessages(page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  return adminRequest(`/admin/contact-messages?${params.toString()}`)
}

export function getContactMessage(id) {
  return adminRequest(`/admin/contact-messages/${id}`)
}

export function updateContactMessageStatus(id, status) {
  return adminRequest(`/admin/contact-messages/${id}`, {
    method: 'PATCH',
    body: { status },
  })
}

export function deleteContactMessage(id) {
  return adminRequest(`/admin/contact-messages/${id}`, { method: 'DELETE' })
}

export function listParishCouncilMembers(page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  return adminRequest(`/admin/parish-council-members?${params.toString()}`)
}

export function getParishCouncilMember(id) {
  return adminRequest(`/admin/parish-council-members/${id}/edit`)
}

export function createParishCouncilMember(data) {
  return adminRequest('/admin/parish-council-members', { method: 'POST', body: data })
}

export function updateParishCouncilMember(id, data) {
  return adminRequest(`/admin/parish-council-members/${id}`, { method: 'POST', body: data })
}

export function deleteParishCouncilMember(id) {
  return adminRequest(`/admin/parish-council-members/${id}`, { method: 'DELETE' })
}

export function listGalleryImages(page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  return adminRequest(`/admin/gallery-images?${params.toString()}`)
}

export function getGalleryImage(id) {
  return adminRequest(`/admin/gallery-images/${id}/edit`)
}

export function createGalleryImage(data) {
  return adminRequest('/admin/gallery-images', { method: 'POST', body: data })
}

export function updateGalleryImage(id, data) {
  return adminRequest(`/admin/gallery-images/${id}`, { method: 'POST', body: data })
}

export function deleteGalleryImage(id) {
  return adminRequest(`/admin/gallery-images/${id}`, { method: 'DELETE' })
}

export function listGroups() {
  return adminRequest('/admin/groups')
}

export function getGroup(id) {
  return adminRequest(`/admin/groups/${id}/edit`)
}

export function createGroup(data) {
  return adminRequest('/admin/groups', { method: 'POST', body: data })
}

export function updateGroup(id, data) {
  return adminRequest(`/admin/groups/${id}`, { method: 'POST', body: data })
}

export function deleteGroup(id) {
  return adminRequest(`/admin/groups/${id}`, { method: 'DELETE' })
}

export function createAdminAccount(data) {
  return adminRequest('/admin/admin-accounts', { method: 'POST', body: data })
}

export function updateAdminAccount(id, data) {
  return adminRequest(`/admin/admin-accounts/${id}`, { method: 'PUT', body: data })
}

export function deleteAdminAccount(id) {
  return adminRequest(`/admin/admin-accounts/${id}`, { method: 'DELETE' })
}

export function createGroupMember(groupId, data) {
  return adminRequest(`/admin/groups/${groupId}/members`, { method: 'POST', body: data })
}

export function updateGroupMember(groupId, memberId, data) {
  return adminRequest(`/admin/groups/${groupId}/members/${memberId}`, { method: 'PUT', body: data })
}

export function deleteGroupMember(groupId, memberId) {
  return adminRequest(`/admin/groups/${groupId}/members/${memberId}`, { method: 'DELETE' })
}

export function updateProfile(data) {
  return adminRequest('/profile', { method: 'PATCH', body: data })
}

export function updatePassword(data) {
  return adminRequest('/password', { method: 'PUT', body: data })
}

export function deleteProfile(data) {
  return adminRequest('/profile', { method: 'DELETE', body: data })
}
