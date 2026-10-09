// Load all authorized pages before applying client-side filters. Keep requests
// bounded so larger lists do not issue a burst of simultaneous requests.
export async function loadAdminPages(fetchPage, field) {
  const first = await fetchPage(1)
  const rows = [...(first[field] || [])]
  const lastPage = first.meta?.last_page || 1
  for (let page = 2; page <= lastPage; page += 4) {
    const pages = await Promise.all(
      Array.from({ length: Math.min(4, lastPage - page + 1) }, (_, index) => fetchPage(page + index)),
    )
    for (const payload of pages) rows.push(...(payload[field] || []))
  }
  return { ...first, [field]: [...new Map(rows.map(row => [row.id, row])).values()] }
}

export function paginateItems(items, requestedPage, pageSize = 10) {
  const lastPage = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.max(1, Math.min(requestedPage, lastPage))
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    meta: { current_page: page, last_page: lastPage, total: items.length },
  }
}
