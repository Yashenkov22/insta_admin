import { useState, useMemo } from 'react'
import { PAGE_SIZE } from '../utils'

export function usePagination(items, pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(page, totalPages)

  const slice = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize]
  )

  return {
    page: safePage,
    setPage,
    totalPages,
    slice,
    total: items.length,
  }
}
