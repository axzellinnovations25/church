import { test, expect } from '@playwright/test'

test('PUB-TC-001 desktop and mobile navigation has no broken internal links', async ({ page }) => {
  const unexpectedRequests = []
  const externalAssets = []
  page.on('request', request => {
    const url = new URL(request.url())
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
      if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth-api/')) unexpectedRequests.push(request.url())
      else externalAssets.push(request.url())
    }
  })

  await page.goto('/')
  await expect(page.locator('nav.navbar')).toBeVisible()

  const desktopLinks = page.locator('nav.navbar a[href^="/"]')
  const desktopHrefs = await desktopLinks.evaluateAll(links => [...new Set(links.map(link => link.getAttribute('href')))])
  for (const href of desktopHrefs) {
    await page.goto(href)
    await expect(page).toHaveURL(new RegExp(href.replace('/', '\\/') + '$'))
    await expect(page.locator('#root')).not.toHaveText('')
  }

  await page.setViewportSize({ width: 375, height: 812 })
  await page.goto('/')
  const hamburger = page.getByRole('button', { name: 'Open navigation menu' })
  await hamburger.click()
  await expect(page.locator('#mobile-nav-menu')).toBeVisible()
  for (const category of ['Mass & Sacraments', 'Parish', 'News & Events', 'Contact', 'Links']) {
    await page.getByRole('button', { name: 'Expand ' + category + ' section' }).click()
    const group = page.locator('.mobile-nav-group').filter({ hasText: category })
    await expect(group.locator('.mobile-sub-link').first()).toBeVisible()
  }
  await page.locator('.mobile-sub-link').filter({ hasText: 'Gallery' }).click()
  await expect(page).toHaveURL(/\/gallery$/)
  await expect(page.locator('#mobile-nav-menu')).toBeHidden()
  expect(unexpectedRequests).toEqual([])
})
