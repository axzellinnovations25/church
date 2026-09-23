import { getBackendUrl } from './auth'
import { queryClient } from './queryClient'

let csrfToken = null
const ADMIN_QUERY_KEY = ['admin']
const ADMIN_STALE_TIME = 30 * 1000

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

function cachedAdminRequest(key, path, staleTime = ADMIN_STALE_TIME) {
  return queryClient.fetchQuery({
    queryKey: [...ADMIN_QUERY_KEY, ...key],
    queryFn: () => adminRequest(path),
    staleTime,
  })
}

function invalidateAdminCache(publicResource) {
  queryClient.invalidateQueries({ queryKey: ADMIN_QUERY_KEY })

  if (publicResource) {
    queryClient.invalidateQueries({ queryKey: ['public', publicResource] })
  }
}

async function adminMutation(path, options, publicResource) {
  const payload = await adminRequest(path, options)
  invalidateAdminCache(publicResource)
  return payload
}

export function clearAdminCache() {
  queryClient.removeQueries({ queryKey: ADMIN_QUERY_KEY })
}

export function listEvents(page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  return cachedAdminRequest(['events', 'list', page], `/admin/events?${params.toString()}`)
}

export function getOverview() {
  return cachedAdminRequest(['overview'], '/admin/overview')
}

export function getHeaderSummary() {
  return cachedAdminRequest(['header-summary'], '/admin/header-summary')
}

export function updateOverviewItemVisibility(itemKey, visibility) {
  return adminMutation('/admin/overview/items/visibility', {
    method: 'PATCH',
    body: {
      item_key: itemKey,
      visibility,
    },
  })
}

export function getEvent(id) {
  return cachedAdminRequest(['events', 'detail', String(id)], `/admin/events/${id}/edit`)
}

export function createEvent(data) {
  return adminMutation('/admin/events', { method: 'POST', body: data }, 'events')
}

export function updateEvent(id, data) {
  if (data instanceof FormData) {
    data.append('_method', 'PUT')
    return adminMutation(`/admin/events/${id}`, { method: 'POST', body: data }, 'events')
  }

  return adminMutation(`/admin/events/${id}`, { method: 'PUT', body: data }, 'events')
}

export function deleteEvent(id) {
  return adminMutation(`/admin/events/${id}`, { method: 'DELETE' }, 'events')
}

export function listEventsByDate(date) {
  const params = new URLSearchParams({ date })
  return cachedAdminRequest(['events', 'by-date', date], `/admin/events/by-date?${params.toString()}`)
}

export function listMassTimes(page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  return cachedAdminRequest(['mass-times', 'list', page], `/admin/mass-times?${params.toString()}`)
}

export function getMassTime(id) {
  return cachedAdminRequest(['mass-times', 'detail', String(id)], `/admin/mass-times/${id}/edit`)
}

export function createMassTime(data) {
  return adminMutation('/admin/mass-times', { method: 'POST', body: data }, 'mass-times')
}

export function updateMassTime(id, data) {
  return adminMutation(`/admin/mass-times/${id}`, { method: 'PUT', body: data }, 'mass-times')
}

export function deleteMassTime(id) {
  return adminMutation(`/admin/mass-times/${id}`, { method: 'DELETE' }, 'mass-times')
}

export function listMassTimesByDay(day, location = '') {
  const params = new URLSearchParams()

  if (day) {
    params.set('day', day)
  }

  if (location) {
    params.set('location', location)
  }

  return cachedAdminRequest(['mass-times', 'by-day', day || '', location || ''], `/admin/mass-times/by-day?${params.toString()}`)
}

export function listNewsletters(page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  return cachedAdminRequest(['newsletters', 'list', page], `/admin/newsletters?${params.toString()}`)
}

export function getNewsletter(id) {
  return cachedAdminRequest(['newsletters', 'detail', String(id)], `/admin/newsletters/${id}/edit`)
}

export function createNewsletter(data) {
  return adminMutation('/admin/newsletters', { method: 'POST', body: data }, 'newsletters')
}

export function updateNewsletter(id, data) {
  return adminMutation(`/admin/newsletters/${id}`, { method: 'POST', body: data }, 'newsletters')
}

export function deleteNewsletter(id) {
  return adminMutation(`/admin/newsletters/${id}`, { method: 'DELETE' }, 'newsletters')
}

export function listNewsPosts(page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  return cachedAdminRequest(['news', 'list', page], `/admin/news?${params.toString()}`)
}

export function getNewsPost(id) {
  return cachedAdminRequest(['news', 'detail', String(id)], `/admin/news/${id}/edit`)
}

export function createNewsPost(data) {
  return adminMutation('/admin/news', { method: 'POST', body: data }, 'news')
}

export function updateNewsPost(id, data) {
  return adminMutation(`/admin/news/${id}`, { method: 'POST', body: data }, 'news')
}

export function deleteNewsPost(id) {
  return adminMutation(`/admin/news/${id}`, { method: 'DELETE' }, 'news')
}

export function listRegistrations(page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  return cachedAdminRequest(['registrations', 'list', page], `/admin/parish-registrations?${params.toString()}`)
}

export function getRegistration(id) {
  return cachedAdminRequest(['registrations', 'detail', String(id)], `/admin/parish-registrations/${id}`)
}

export function updateRegistration(id, data) {
  return adminMutation(`/admin/parish-registrations/${id}`, { method: 'PUT', body: data })
}

export function deleteRegistration(id) {
  return adminMutation(`/admin/parish-registrations/${id}`, { method: 'DELETE' })
}

export function listContactMessages(page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  return cachedAdminRequest(['contact-messages', 'list', page], `/admin/contact-messages?${params.toString()}`)
}

export function getContactMessage(id) {
  return cachedAdminRequest(['contact-messages', 'detail', String(id)], `/admin/contact-messages/${id}`)
}

export function updateContactMessageStatus(id, status) {
  return adminMutation(`/admin/contact-messages/${id}`, {
    method: 'PATCH',
    body: { status },
  })
}

export function deleteContactMessage(id) {
  return adminMutation(`/admin/contact-messages/${id}`, { method: 'DELETE' })
}

export function listParishCouncilMembers(page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  return cachedAdminRequest(['parish-council-members', 'list', page], `/admin/parish-council-members?${params.toString()}`)
}

export function getParishCouncilMember(id) {
  return cachedAdminRequest(['parish-council-members', 'detail', String(id)], `/admin/parish-council-members/${id}/edit`)
}

export function createParishCouncilMember(data) {
  return adminMutation('/admin/parish-council-members', { method: 'POST', body: data }, 'parish-council-members')
}

export function updateParishCouncilMember(id, data) {
  return adminMutation(`/admin/parish-council-members/${id}`, { method: 'POST', body: data }, 'parish-council-members')
}

export function deleteParishCouncilMember(id) {
  return adminMutation(`/admin/parish-council-members/${id}`, { method: 'DELETE' }, 'parish-council-members')
}

export function listGalleryImages(page = 1) {
  const params = new URLSearchParams({ page: String(page) })
  return cachedAdminRequest(['gallery-images', 'list', page], `/admin/gallery-images?${params.toString()}`)
}

export function getGalleryImage(id) {
  return cachedAdminRequest(['gallery-images', 'detail', String(id)], `/admin/gallery-images/${id}/edit`)
}

export function createGalleryImage(data) {
  return adminMutation('/admin/gallery-images', { method: 'POST', body: data }, 'gallery-images')
}

export function updateGalleryImage(id, data) {
  return adminMutation(`/admin/gallery-images/${id}`, { method: 'POST', body: data }, 'gallery-images')
}

export function deleteGalleryImage(id) {
  return adminMutation(`/admin/gallery-images/${id}`, { method: 'DELETE' }, 'gallery-images')
}

export function listGroups() {
  return cachedAdminRequest(['groups', 'list'], '/admin/groups')
}

export function getGroup(id) {
  return cachedAdminRequest(['groups', 'detail', String(id)], `/admin/groups/${id}/edit`)
}

export function createGroup(data) {
  return adminMutation('/admin/groups', { method: 'POST', body: data }, 'groups')
}

export function updateGroup(id, data) {
  return adminMutation(`/admin/groups/${id}`, { method: 'POST', body: data }, 'groups')
}

export function deleteGroup(id) {
  return adminMutation(`/admin/groups/${id}`, { method: 'DELETE' }, 'groups')
}

export function createAdminAccount(data) {
  return adminMutation('/admin/admin-accounts', { method: 'POST', body: data })
}

export function updateAdminAccount(id, data) {
  return adminMutation(`/admin/admin-accounts/${id}`, { method: 'PUT', body: data })
}

export function deleteAdminAccount(id) {
  return adminMutation(`/admin/admin-accounts/${id}`, { method: 'DELETE' })
}

export function createGroupMember(groupId, data) {
  return adminMutation(`/admin/groups/${groupId}/members`, { method: 'POST', body: data })
}

export function updateGroupMember(groupId, memberId, data) {
  return adminMutation(`/admin/groups/${groupId}/members/${memberId}`, { method: 'PUT', body: data })
}

export function deleteGroupMember(groupId, memberId) {
  return adminMutation(`/admin/groups/${groupId}/members/${memberId}`, { method: 'DELETE' })
}

export function updateProfile(data) {
  return adminMutation('/profile', { method: 'PATCH', body: data })
}

export function updatePassword(data) {
  return adminMutation('/password', { method: 'PUT', body: data })
}

export function deleteProfile(data) {
  return adminMutation('/profile', { method: 'DELETE', body: data })
}

const adminPathLoaders = {
  '/dashboard': getOverview,
  '/dashboard/events': () => listEvents(1),
  '/dashboard/mass-times': () => listMassTimes(1),
  '/dashboard/newsletters': () => listNewsletters(1),
  '/dashboard/news': () => listNewsPosts(1),
  '/dashboard/registrations': () => listRegistrations(1),
  '/dashboard/contact-messages': () => listContactMessages(1),
  '/dashboard/parish-council': () => listParishCouncilMembers(1),
  '/dashboard/groups': listGroups,
  '/dashboard/my-group': listGroups,
  '/dashboard/gallery': () => listGalleryImages(1),
  '/dashboard/accounts': listGroups,
}

export function prefetchAdminDataForPath(path) {
  const loader = adminPathLoaders[path]
  return loader ? loader().catch(() => null) : Promise.resolve(null)
}

export function warmAdminData(user) {
  const loaders = [
    getOverview,
    getHeaderSummary,
    () => listEvents(1),
    () => listContactMessages(1),
    listGroups,
  ]

  if (user?.is_main_admin) {
    loaders.push(
      () => listMassTimes(1),
      () => listNewsletters(1),
      () => listNewsPosts(1),
      () => listRegistrations(1),
      () => listParishCouncilMembers(1),
      () => listGalleryImages(1),
    )
  }

  return Promise.allSettled(loaders.map(loader => loader()))
}
