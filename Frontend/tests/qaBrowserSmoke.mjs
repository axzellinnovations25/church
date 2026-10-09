// Package-free browser smoke runner for an already running isolated local Vite
// server, Laravel server, and Edge/Chrome DevTools endpoint. Never targets a
// deployment URL. Example: node tests/qaBrowserSmoke.mjs
const cdpUrl = 'http://127.0.0.1:9222'
const siteUrl = 'http://127.0.0.1:5173'
const contactEmail = `browser.qa+${Date.now()}@example.test`
const signupEmail = `browser.signup+${Date.now()}@example.test`

const targets = await fetch(`${cdpUrl}/json`).then(response => response.json())
const page = targets.find(target => target.type === 'page' && target.webSocketDebuggerUrl)
if (!page) throw new Error('No local DevTools page target')

const ws = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true })
  ws.addEventListener('error', reject, { once: true })
})

let nextId = 0
const waiting = new Map()
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data)
  if (!message.id || !waiting.has(message.id)) return
  const { resolve, reject } = waiting.get(message.id)
  waiting.delete(message.id)
  message.error ? reject(new Error(message.error.message)) : resolve(message.result)
})

function call(method, params = {}) {
  const id = ++nextId
  return new Promise((resolve, reject) => {
    waiting.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
}

async function evaluate(expression) {
  const result = await call('Runtime.evaluate', {
    expression, returnByValue: true, awaitPromise: true,
  })
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
  return result.result.value
}

async function navigate(path, delay = 500) {
  await call('Page.navigate', { url: `${siteUrl}${path}` })
  await new Promise(resolve => setTimeout(resolve, delay))
  let result
  for (let attempt = 0; attempt < (path === '/dashboard' ? 80 : 28); attempt++) {
    result = await evaluate(`({ path: location.pathname, heading: document.querySelector('h1')?.textContent || '', rootLength: document.querySelector('#root')?.innerText.length || 0, text: document.querySelector('#root')?.innerText.slice(0, 300) || '', contactFormReady: Boolean(document.querySelector('.contact-form-minimal')) })`)
    const dashboardRedirectComplete = path === '/dashboard' && (
      (result.path === '/login' && result.heading.includes('Welcome back'))
      || (result.path === '/' && result.heading.includes('Join Us'))
    )
    const targetPageReady = path === '/contact'
      ? result.path === path && result.contactFormReady
      : result.path === path && result.rootLength > 50
    if (path === '/no-such-page' || dashboardRedirectComplete || (path !== '/dashboard' && targetPageReady)) break
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  return result
}

await call('Page.enable')
await call('Runtime.enable')
const results = {}
for (const path of ['/', '/login', '/contact', '/registration', '/news', '/gallery', '/dashboard', '/no-such-page']) {
  results[path] = await navigate(path, path === '/dashboard' ? 2500 : 1800)
}

const remainingPublicPaths = [
  '/about', '/mass-times', '/mass-sacraments', '/baptism', '/first-holy-communion',
  '/confirmation', '/marriage', '/reconciliation', '/becoming-catholic',
  '/prayer-devotions', '/donate', '/signup', '/forgot-password',
  '/reset-password/sample-token', '/parish', '/parish-council', '/parish-groups',
  '/parish-groups/unknown/join', '/building-project', '/fundraising',
  '/safeguarding', '/pastoral-care', '/schools', '/parking', '/cathedral-hire',
  '/news-events', '/events', '/events/999999', '/news/999999',
  '/newsletter', '/newsletter-archive', '/diocese', '/links',
]
const routeFailures = []
if (process.env.QA_FAST !== '1') {
  for (const path of remainingPublicPaths) {
    const result = await navigate(path, 550)
    if (result.rootLength < 50 || result.path !== path) routeFailures.push({ path, result })
  }
}

await navigate('/contact')
await evaluate(`document.querySelector('.contact-form-minimal').requestSubmit()`)
await new Promise(resolve => setTimeout(resolve, 250))
const emptyContactValidation = await evaluate(`({ errors: document.querySelectorAll('.contact-form-minimal .field-error').length, feedback: document.querySelector('.contact-feedback')?.textContent || '' })`)
await evaluate(`(() => {
  const values = { name: 'Browser Qa', email: ${JSON.stringify(contactEmail)}, phone: '01978263943', subject: 'Test Visit', message: 'Please send details about visiting the cathedral.' }
  for (const [name, value] of Object.entries(values)) {
    const element = document.querySelector('.contact-form-minimal [name="' + name + '"]')
    const proto = element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  }
  const category = document.querySelector('.contact-form-minimal [name="category"]')
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(category, 'general')
  category.dispatchEvent(new Event('change', { bubbles: true }))
  return true
})()`)
await new Promise(resolve => setTimeout(resolve, 300))
const filledContact = await evaluate(`Object.fromEntries(['name','email','phone','subject','message','category'].map(name => [name, document.querySelector('.contact-form-minimal [name="' + name + '"]')?.value]))`)
await evaluate(`document.querySelector('.contact-form-minimal').requestSubmit()`)
let submittedContact
for (let attempt = 0; attempt < 40; attempt++) {
  submittedContact = await evaluate(`({ dialog: document.querySelector('[role="dialog"]')?.innerText || '', feedback: document.querySelector('.contact-feedback')?.textContent || '' })`)
  if (submittedContact.dialog || submittedContact.feedback) break
  await new Promise(resolve => setTimeout(resolve, 250))
}

const checks = {
  homeRendered: results['/'].rootLength > 100,
  loginRendered: results['/login'].rootLength > 100,
  contactRendered: results['/contact'].heading.includes('Contact'),
  registrationRendered: results['/registration'].rootLength > 100,
  newsRendered: results['/news'].rootLength > 100,
  galleryRendered: results['/gallery'].rootLength > 100,
  guestDashboardRedirected: results['/dashboard'].path === '/login',
  unknownRouteHasNoPage: results['/no-such-page'].rootLength === 0,
  allPublicRoutesRender: routeFailures.length === 0,
  contactEmptyValidation: emptyContactValidation.errors >= 4,
  contactFieldsFilled: Object.values(filledContact).every(Boolean),
  contactSubmitted: /success|sent/i.test(submittedContact.dialog),
}

const signupResult = await evaluate(`(async () => {
  const csrfResponse = await fetch('/auth-api/csrf-token', { credentials: 'include', headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' } })
  const { csrf_token: csrfToken } = await csrfResponse.json()
  const response = await fetch('/auth-api/signup', {
    method: 'POST', credentials: 'include',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
    body: JSON.stringify({ name: 'Browser Signup', email: ${JSON.stringify(signupEmail)}, password: 'StrongPass12!', password_confirmation: 'StrongPass12!' }),
  })
  return { status: response.status, payload: await response.json() }
})()`)
const ordinaryDashboard = await navigate('/dashboard', 1800)
checks.publicSignupNotAdmin = signupResult.status === 201 && signupResult.payload?.user?.is_main_admin === false
checks.ordinaryUserRedirectedFromDashboard = ordinaryDashboard.path === '/' && ordinaryDashboard.heading.includes('Join Us')

console.log(JSON.stringify({ checks, publicRoutesChecked: (process.env.QA_FAST === '1' ? 0 : remainingPublicPaths.length) + 6, routeFailures, contact: { email: contactEmail, emptyContactValidation, filledContact, submittedContact }, signup: { email: signupEmail, result: signupResult, dashboard: ordinaryDashboard }, routes: Object.fromEntries(Object.entries(results).map(([path, result]) => [path, { finalPath: result.path, heading: result.heading, rootLength: result.rootLength, text: result.text }])) }, null, 2))
ws.close()
if (Object.values(checks).some(value => !value)) process.exitCode = 1
