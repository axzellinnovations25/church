import assert from 'node:assert/strict'
import test from 'node:test'
import { loadAdminPages, paginateItems } from '../src/lib/adminPagination.js'

test('search finds records beyond page one and paginates the matching results', async () => {
  const records = Array.from({ length: 35 }, (_, i) => ({ id: i + 1, title: i >= 10 ? 'Choir' : 'Other' }))
  const payload = await loadAdminPages(async page => ({
    events: records.slice((page - 1) * 10, page * 10), meta: { last_page: 4 },
  }), 'events')
  const matches = payload.events.filter(row => row.title === 'Choir')
  const page = paginateItems(matches, 2)
  assert.equal(payload.events.length, 35)
  assert.deepEqual(page.items.map(row => row.id), [21, 22, 23, 24, 25, 26, 27, 28, 29, 30])
  assert.deepEqual(page.meta, { current_page: 2, last_page: 3, total: 25 })
})

test('deleting the only record on the last page clamps pagination to a valid page', () => {
  const records = Array.from({ length: 10 }, (_, id) => ({ id }))
  assert.equal(paginateItems(records, 2).meta.current_page, 1)
  assert.deepEqual(paginateItems([], 4), { items: [], meta: { current_page: 1, last_page: 1, total: 0 } })
})

test('a failure on a later page rejects the load instead of showing incomplete search results', async () => {
  await assert.rejects(loadAdminPages(async page => {
    if (page === 2) throw new Error('Session expired')
    return { events: [{ id: 1 }], meta: { last_page: 2 } }
  }, 'events'), /Session expired/)
})

test('page aggregation handles an empty list', async () => {
  const payload = await loadAdminPages(async () => ({ events: [], meta: { last_page: 1 } }), 'events')
  assert.deepEqual(payload.events, [])
})

test('aggregates 500 rows with no more than four concurrent page requests', async () => {
  const records = Array.from({ length: 500 }, (_, index) => ({ id: index + 1, title: `QA News ${index + 1}` }))
  let inFlight = 0
  let peak = 0
  const payload = await loadAdminPages(async page => {
    inFlight += 1
    peak = Math.max(peak, inFlight)
    await new Promise(resolve => setTimeout(resolve, 1))
    inFlight -= 1
    return { news_posts: records.slice((page - 1) * 10, page * 10), meta: { last_page: 50 } }
  }, 'news_posts')
  assert.equal(payload.news_posts.length, 500)
  assert.equal(payload.news_posts.find(row => row.title === 'QA News 500')?.id, 500)
  assert.ok(peak <= 4)
})
