

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

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

const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII='

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MindMirror',
        short_name: 'MindMirror',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        icons: [
          { src: tinyPng, sizes: '192x192', type: 'image/png' },
          { src: tinyPng, sizes: '512x512', type: 'image/png' },
          { src: tinyPng, sizes: '512x512', type: 'image/png', purpose: 'maskable any' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}']
      }
    })
  ],
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
