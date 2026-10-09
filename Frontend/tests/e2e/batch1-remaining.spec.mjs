import { test, expect } from '@playwright/test'

const localOrigin = 'http://127.0.0.1:8000'
const publicRoutes = ['/about', '/mass-times', '/mass-sacraments', '/baptism', '/first-holy-communion', '/confirmation', '/marriage', '/reconciliation', '/becoming-catholic', '/prayer-devotions', '/donate', '/parish', '/parish-council', '/parish-groups', '/building-project', '/fundraising', '/safeguarding', '/pastoral-care', '/schools', '/parking', '/cathedral-hire', '/news-events', '/events', '/news', '/newsletter', '/newsletter-archive', '/diocese', '/links']

async function localGuard(page) {
  const bad = []
  page.on('request', request => {
    const url = new URL(request.url())
    if (url.pathname.startsWith('/api/')) console.log(`QA_API_REQUEST ${request.method()} ${request.url()}`)
    if (!['127.0.0.1', 'localhost'].includes(url.hostname) && (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth-api/'))) bad.push(request.url())
  })
  page.on('response', async response => {
    const url = new URL(response.url())
    if (url.pathname.startsWith('/api/')) console.log(`QA_API_RESPONSE ${response.status()} ${response.url()}`)
  })
  await page.addInitScript(origin => {
    if (origin !== 'http://127.0.0.1:8000') throw new Error(`Unexpected QA origin: ${origin}`)
  }, localOrigin)
  return bad
}

test('PUB-TC-003 home cards and hero controls', async ({ page }) => {
  const bad = await localGuard(page)
  await page.goto('/')
  await expect(page.locator('#root')).not.toHaveText('')
  const dots = page.locator('[aria-label*="slide" i], .hero-dot, .carousel-dot')
  if (await dots.count()) { for (let i = 0; i < await dots.count(); i++) await dots.nth(i).click() }
  expect(bad).toEqual([])
})

test('PUB-TC-004 information routes and contact links', async ({ page }) => {
  test.setTimeout(120000)
  const bad = await localGuard(page)
  for (const route of publicRoutes) {
    await page.goto(route)
    await expect(page.locator('#root')).not.toHaveText('')
  }
  await page.goto('/contact?subject=Donation%20Enquiry')
  await expect(page.locator('input[name="subject"]')).toHaveValue('Donation Enquiry')
  const internalTargets = await page.locator('a[href^="/"]').evaluateAll(links => [...new Set(links.map(link => link.getAttribute('href')))])
  expect(internalTargets).toContain('/contact')
  expect(internalTargets).toContain('/registration')
  const externalTargets = await page.locator('a[href^="http"], a[href^="mailto:"], a[href^="tel:"]').evaluateAll(links => links.map(link => link.getAttribute('href')))
  expect(externalTargets.some(href => href?.startsWith('mailto:'))).toBeTruthy()
  expect(externalTargets.some(href => href?.startsWith('tel:'))).toBeTruthy()
  const discoveredInternal = new Set()
  for (const route of publicRoutes) {
    await page.goto(route)
    const hrefs = await page.locator('a[href]').evaluateAll(links => [...new Set(links.map(link => link.getAttribute('href')).filter(Boolean))])
    for (const href of hrefs.filter(value => value.startsWith('/'))) {
      expect(href).toMatch(/^\/(?!\/)/)
      discoveredInternal.add(href.split('?')[0])
    }
  }
  for (const href of discoveredInternal) {
    await page.goto(href)
    await expect(page.locator('#root')).not.toHaveText('')
  }
  expect(bad).toEqual([])
})

test('PUB-TC-005 gallery lightbox controls', async ({ page }) => {
  const bad = await localGuard(page)
  await page.goto('/gallery')
  const cards = page.locator('.pg-card')
  expect(await cards.count()).toBeGreaterThan(0)
  await cards.first().click()
  const overlay = page.locator('.pg-lightbox')
  await expect(overlay.first()).toBeVisible()
  const nav = overlay.getByRole('button', { name: /previous|next/i })
  expect(await nav.count()).toBeGreaterThanOrEqual(2)
  await overlay.getByRole('button', { name: /^next$/i }).click()
  await overlay.getByRole('button', { name: /^previous$/i }).click()
  await overlay.locator('.pg-close').click({ force: true })
  await expect(overlay).toBeHidden()
  expect(bad).toEqual([])
})

test('PUB-TC-006 gallery inactive and API fallback', async ({ page }) => {
  const bad = await localGuard(page)
  await page.goto('/gallery')
  await expect(page.locator('.pg-title').filter({ hasText: 'QA Active Image' })).toBeVisible()
  await expect(page.locator('.pg-title').filter({ hasText: 'QA Inactive Image' })).toHaveCount(0)
  const inactive = await page.evaluate(async () => {
    const response = await fetch('/api/v1/gallery-images/2/image')
    return response.status
  })
  expect(inactive).toBe(404)
  await page.route('**/api/v1/gallery-images', route => route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"forced QA failure"}' }))
  await page.reload()
  expect(await page.locator('.pg-card').count()).toBeGreaterThan(0)
  await expect(page.locator('.pg-title').first()).toHaveText(/Pieta Statue|Cathedral Interior|Mass Celebration/i)
  expect(bad).toEqual([])
})

test('PUB-TC-007 parish group cards and empty fallback', async ({ page }) => {
  const bad = await localGuard(page)
  await page.goto('/parish-groups')
  await expect(page.locator('#root')).toContainText('QA Choir')
  const join = page.locator('a[href*="qa-choir"]')
  await expect(join.first()).toHaveAttribute('href', /qa-choir/)
  await join.first().click()
  await expect(page).toHaveURL(/\/parish-groups\/qa-choir\/join$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/parish-groups$/)
  await page.route('**/api/v1/groups', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) }))
  await page.reload()
  await expect(page.getByRole('link', { name: /join a parish group|enquire online/i }).first()).toBeVisible()
  expect(bad).toEqual([])
})

test('CNT-TC-001 mass schedule tabs', async ({ page }) => {
  const bad = await localGuard(page)
  await page.goto('/mass-times')
  await expect(page.locator('#root')).not.toHaveText('')
  const tabs = page.getByRole('button')
  expect(await tabs.count()).toBeGreaterThan(0)
  for (let i = 0; i < await tabs.count(); i++) await tabs.nth(i).click()
  await page.goto('/mass-sacraments')
  await expect(page.locator('#root')).not.toHaveText('')
  expect(bad).toEqual([])
})

test('CNT-TC-002 events list and detail', async ({ page }) => {
  const bad = await localGuard(page)
  await page.goto('/events')
  await expect(page.locator('#root')).not.toHaveText('')
  const eventLinks = page.locator('a[href*="/events/"]')
  if (await eventLinks.count()) {
    const href = await eventLinks.first().getAttribute('href')
    await eventLinks.first().click()
    await expect(page).toHaveURL(new RegExp(href.replace('/', '\\/')))
  }
  expect(bad).toEqual([])
})

test('CNT-TC-004 event loading and server error', async ({ page }) => {
  const bad = await localGuard(page)
  let eventsRequested = false
  await page.route('**/api/v1/events', async route => { eventsRequested = true; await new Promise(resolve => setTimeout(resolve, 800)); await route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"forced QA failure"}' }) })
  await page.goto('/events')
  await expect.poll(() => eventsRequested).toBeTruthy()
  await expect(page.locator('#root')).toContainText(/loading|event|error|unable|no events/i)
  await expect(page.locator('#root')).toContainText(/forced QA failure|error|unable|failed|no events/i)
  await page.goto('/events/999999')
  await expect(page.locator('#root')).not.toContainText(/private|draft/i)
  await expect(page.getByRole('link', { name: /back to news & events/i })).toBeVisible()
  await page.getByRole('link', { name: /back to news & events/i }).click()
  await expect(page).toHaveURL(/\/news-events$/)
  expect(bad).toEqual([])
})

test('CNT-TC-005 news list and detail', async ({ page }) => {
  const bad = await localGuard(page)
  await page.goto('/news')
  await expect(page.locator('#root')).not.toHaveText('')
  const newsLinks = page.locator('a[href*="/news/"]')
  if (await newsLinks.count()) {
    const href = await newsLinks.first().getAttribute('href')
    await newsLinks.first().click()
    await expect(page).toHaveURL(new RegExp(href.replace('/', '\\/')))
    await expect(page.locator('#root')).not.toContainText(/draft/i)
  }
  expect(bad).toEqual([])
})

test('CNT-TC-007 newsletter archive controls', async ({ page }) => {
  const bad = await localGuard(page)
  await page.goto('/newsletter-archive')
  await expect(page.locator('#root')).not.toHaveText('')
  const downloads = page.getByRole('link', { name: /download/i })
  for (let i = 0; i < await downloads.count(); i++) await expect(downloads.nth(i)).toHaveAttribute('href', /newsletters/)
  const opens = page.getByRole('link', { name: /open/i })
  for (let i = 0; i < await opens.count(); i++) await expect(opens.nth(i)).toHaveAttribute('href', /newsletters/)
  expect(bad).toEqual([])
})

test('CNT-TC-012 news empty and server error states', async ({ page }) => {
  const bad = await localGuard(page)
  let mode = 'empty'
  await page.route('**/api/v1/news', async route => {
    if (mode === 'empty') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) })
    await new Promise(resolve => setTimeout(resolve, 800))
    return route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"forced QA failure"}' })
  })
  await page.goto('/news')
  await expect(page.locator('#root')).toContainText(/no news|no articles|empty|latest/i)
  mode = 'error'
  await page.reload()
  await expect(page.locator('#root')).toContainText(/forced QA failure|error|unable|failed|no news/i)
  await page.goto('/news/999999')
  await expect(page.locator('#root')).not.toContainText(/false article|private|draft/i)
  await expect(page.getByRole('link', { name: /back to news/i })).toBeVisible()
  await page.getByRole('link', { name: /back to news/i }).click()
  await expect(page).toHaveURL(/\/news$/)
  expect(bad).toEqual([])
})

test('FRM-TC-003 contact query and group form', async ({ page }) => {
  const bad = await localGuard(page)
  await page.goto('/contact?subject=Donation%20Enquiry')
  await expect(page.locator('input[name="subject"]')).toHaveValue('Donation Enquiry')
  await page.locator('select[name="category"]').selectOption('group_join')
  await page.locator('select[name="group_id"]').selectOption({ index: 1 })
  await page.locator('input[name="name"]').fill('QA Group Routing')
  await page.locator('input[name="email"]').fill('qa-group@example.test')
  await page.locator('input[name="phone"]').fill('01978263943')
  await page.locator('textarea[name="message"]').fill('Synthetic group routing verification')
  await page.locator('form.contact-form-minimal').evaluate(form => form.requestSubmit())
  await expect(page.getByText('Message sent successfully')).toBeVisible()
  expect(await page.locator('.contact-feedback.error').count()).toBe(0)
  await page.goto('/login')
  await page.locator('input[name="email"]').fill('qa-admin@example.test')
  await page.locator('input[name="password"]').fill('QA-password-123!')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await page.goto('/dashboard/contact-messages')
  const submittedRow = page.locator('.admin-row-contact').filter({ hasText: /QA Group Routing.*qa-group@example\.test/i }).last()
  await expect(submittedRow).toBeVisible()
  await submittedRow.click()
  await expect(page.locator('#admin-editor').getByText('qa-group@example.test')).toBeVisible()
  await expect(page.locator('#admin-editor').getByText('01978263943')).toBeVisible()
  await expect(page.locator('#admin-editor').getByText('Donation Enquiry')).toBeVisible()
  await expect(page.locator('#admin-editor').getByText('Synthetic group routing verification')).toBeVisible()
  await page.reload()
  await expect(page.locator('.admin-row-contact').filter({ hasText: 'QA Group Routing' }).first()).toBeVisible()
  const unauthorized = await page.context().browser()?.newContext()
  if (unauthorized) {
    const guest = await unauthorized.newPage()
    await guest.goto('/dashboard/contact-messages')
    await expect(guest).toHaveURL(/\/login/)
    await unauthorized.close()
  }
  expect(bad).toEqual([])
})

test('FRM-TC-004 contact invalid group and escaped input', async ({ page }) => {
  const bad = await localGuard(page)
  await page.goto('/contact')
  await expect(page.locator('.contact-form-minimal')).toBeVisible()
  await page.locator('select[name="category"]').selectOption('group_join')
  await page.locator('input[name="name"]').fill('<script>alert(1)</script>')
  await page.locator('input[name="email"]').fill('security@example.test')
  await page.locator('input[name="phone"]').fill('01978263943')
  await page.locator('input[name="subject"]').fill('Injection')
  await page.locator('textarea[name="message"]').fill("' OR 1=1 --")
  await page.locator('form.contact-form-minimal').evaluate(form => form.requestSubmit())
  await expect(page.locator('.field-error').filter({ hasText: /group/i })).toBeVisible()
  await expect(page.locator('.contact-form-minimal')).not.toContainText('<script>')
  await expect(page.locator('body')).not.toContainText('alert(1)')
  expect(bad).toEqual([])
})

test('FRM-TC-005 contact reset and retry after failure', async ({ page }) => {
  const bad = await localGuard(page)
  await page.route('**/api/v1/contact', route => route.fulfill({ status: 500, contentType: 'application/json', body: '{"message":"forced QA failure"}' }))
  await page.goto('/contact')
  await page.locator('input[name="name"]').fill('QA Retry')
  await page.locator('input[name="email"]').fill('retry@example.test')
  await page.locator('input[name="phone"]').fill('01978263943')
  await page.locator('input[name="subject"]').fill('Retry')
  await page.locator('textarea[name="message"]').fill('A valid retry message')
  await page.locator('select[name="category"]').selectOption('general')
  await page.locator('form.contact-form-minimal').evaluate(form => form.requestSubmit())
  await expect(page.locator('.contact-feedback.error')).toContainText(/could not send|try again|contact the parish office/i)
  await expect(page.locator('input[name="name"]')).toHaveValue('QA Retry')
  await expect(page.getByRole('button', { name: /reset|clear/i })).toHaveCount(1)
  expect(bad).toEqual([])
})
