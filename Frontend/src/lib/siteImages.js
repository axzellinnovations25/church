import { getBackendUrl } from './auth'

export function siteImageUrl(path) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  return getBackendUrl(`/api/v1/site-images/${encodedPath}`)
}
