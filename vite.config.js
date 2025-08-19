

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isProd = process.env.NODE_ENV === 'production' || process.env.REPLIT_DEPLOYMENT === 'true'

// Custom hosts via env: "mydomain.com,.another.com"
const envHosts = (process.env.VITE_ALLOWED_HOSTS || '')
  .split(',')
  .map(h => h.trim())
  .filter(Boolean)

const prodHosts = Array.from(new Set([
  '.repl.co',
  '.replit.app',
  '.replit.dev',
  ...envHosts,
]))

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    allowedHosts: isProd ? prodHosts : ['*'],
  },
  preview: {
    host: true,
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    allowedHosts: isProd ? prodHosts : ['*'],
  }
})
