import { queryOptions } from '@tanstack/react-query'
import { getBackendUrl } from './auth'
import { fetchGalleryImages } from './galleryImages'

const STALE_TIME = 5 * 60 * 1000

async function fetchCollection(path, fallbackMessage) {
  const response = await fetch(getBackendUrl(path), {
    headers: { Accept: 'application/json' },
  })
  const payload = await response.json()

  if (!response.ok || !Array.isArray(payload?.data)) {
    throw new Error(payload?.message || fallbackMessage)
  }

  return payload.data
}

async function fetchItem(path, fallbackMessage) {
  const response = await fetch(getBackendUrl(path), {
    headers: { Accept: 'application/json' },
  })
  const payload = await response.json()

  if (!response.ok || !payload?.data) {
    throw new Error(payload?.message || fallbackMessage)
  }

  return payload.data
}

export const publicQueries = {
  massTimes: queryOptions({
    queryKey: ['public', 'mass-times'],
    queryFn: () => fetchCollection('/api/v1/mass-times', 'Mass times could not be loaded.'),
    staleTime: STALE_TIME,
  }),
  events: queryOptions({
    queryKey: ['public', 'events'],
    queryFn: () => fetchCollection('/api/v1/events', 'Published events could not be loaded.'),
    staleTime: STALE_TIME,
  }),
  news: queryOptions({
    queryKey: ['public', 'news'],
    queryFn: () => fetchCollection('/api/v1/news', 'News posts could not be loaded.'),
    staleTime: STALE_TIME,
  }),
  newsletters: queryOptions({
    queryKey: ['public', 'newsletters'],
    queryFn: () => fetchCollection('/api/v1/newsletters', 'Newsletters could not be loaded.'),
    staleTime: STALE_TIME,
  }),
  groups: queryOptions({
    queryKey: ['public', 'groups'],
    queryFn: () => fetchCollection('/api/v1/groups', 'Parish groups could not be loaded.'),
    staleTime: STALE_TIME,
  }),
  councilMembers: queryOptions({
    queryKey: ['public', 'parish-council-members'],
    queryFn: () => fetchCollection('/api/v1/parish-council-members', 'Parish council members could not be loaded.'),
    staleTime: STALE_TIME,
  }),
  gallery: queryOptions({
    queryKey: ['public', 'gallery-images'],
    queryFn: fetchGalleryImages,
    staleTime: STALE_TIME,
  }),
}

export function eventQuery(eventId) {
  return queryOptions({
    queryKey: ['public', 'events', String(eventId)],
    queryFn: () => fetchItem(`/api/v1/events/${eventId}`, 'We could not find that event.'),
    staleTime: STALE_TIME,
  })
}

export function newsPostQuery(newsId) {
  return queryOptions({
    queryKey: ['public', 'news', String(newsId)],
    queryFn: () => fetchItem(`/api/v1/news/${newsId}`, 'We could not find that news post.'),
    staleTime: STALE_TIME,
  })
}

const pathQueries = [
  [/^\/(?:mass-times|mass-sacraments)$/, [publicQueries.massTimes]],
  [/^\/(?:events|news-events)(?:\/|$)/, [publicQueries.events]],
  [/^\/news(?:\/|$)/, [publicQueries.news]],
  [/^\/newsletter(?:-archive)?(?:\/|$)/, [publicQueries.newsletters]],
  [/^\/(?:parish-groups|contact)(?:\/|$)/, [publicQueries.groups]],
  [/^\/parish-council(?:\/|$)/, [publicQueries.councilMembers]],
  [/^\/gallery(?:\/|$)/, [publicQueries.gallery]],
]

export function prefetchPublicDataForPath(queryClient, path) {
  const match = pathQueries.find(([pattern]) => pattern.test(path))
  return match
    ? Promise.allSettled(match[1].map(options => queryClient.prefetchQuery(options)))
    : Promise.resolve([])
}

export function warmPublicData(queryClient) {
  return Promise.allSettled(
    Object.values(publicQueries).map(options => queryClient.prefetchQuery(options)),
  )
}
