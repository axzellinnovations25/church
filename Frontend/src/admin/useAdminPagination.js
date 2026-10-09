import { useState } from 'react'
import { paginateItems } from '../lib/adminPagination'

export function useAdminPagination(items, filters) {
  const filterKey = JSON.stringify(filters)
  const [selection, setSelection] = useState({ filterKey, page: 1 })
  const page = selection.filterKey === filterKey ? selection.page : 1
  const result = paginateItems(items, page)
  function setPage(nextPage) {
    setSelection({ filterKey, page: nextPage })
  }
  return { ...result, setPage }
}
