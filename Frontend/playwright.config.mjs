import { defineConfig } from '@playwright/test'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

if (process.env.VITE_BACKEND_ORIGIN !== 'http://127.0.0.1:8000') {
  throw new Error('Refusing Playwright run: VITE_BACKEND_ORIGIN must be http://127.0.0.1:8000')
}

const frontendDir = path.dirname(fileURLToPath(import.meta.url))
const backendDir = path.resolve(frontendDir, '..', 'backend')

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    browserName: 'chromium',
    headless: true,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 900 },
  },
  reporter: [['list'], ['json', { outputFile: 'test-results/batch1-results.json' }]],
  webServer: [
    {
      command: 'php artisan serve --host=127.0.0.1 --port=8000 --env=testing',
      cwd: backendDir,
      url: 'http://127.0.0.1:8000/api/v1/groups',
      timeout: 30_000,
      reuseExistingServer: false,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'npm.cmd run dev -- --host 127.0.0.1',
      cwd: frontendDir,
      url: 'http://127.0.0.1:5173/',
      timeout: 30_000,
      reuseExistingServer: false,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
})
