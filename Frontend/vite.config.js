import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_ORIGIN || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/auth-api': {
        target: process.env.VITE_BACKEND_ORIGIN || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/admin': {
        target: process.env.VITE_BACKEND_ORIGIN || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/profile': {
        target: process.env.VITE_BACKEND_ORIGIN || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/password': {
        target: process.env.VITE_BACKEND_ORIGIN || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/newsletters': {
        target: process.env.VITE_BACKEND_ORIGIN || 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
