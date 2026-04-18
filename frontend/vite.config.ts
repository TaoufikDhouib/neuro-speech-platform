import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',           // ask user before updating SW
      includeAssets: ['*.svg', '*.png'],
      devOptions: { enabled: true },    // enable SW in dev so you can test

      manifest: {
        name: 'NeuroBright',
        short_name: 'NeuroBright',
        description: 'Speech learning platform for early neurological detection in kids',
        theme_color: '#8b5cf6',
        background_color: '#0f0a1e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: '/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
        ],
        categories: ['education', 'health', 'kids'],
        screenshots: [
          { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', form_factor: 'narrow' },
        ],
      },

      workbox: {
        // Cache strategies
        runtimeCaching: [
          {
            // API: network first, fall back to cache (stale data shown if offline)
            urlPattern: /^https?:\/\/localhost:3001\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 }, // 1 day
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Uploaded audio files: cache first
            urlPattern: /^https?:\/\/localhost:3001\/uploads\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 days
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts: stale while revalidate
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }, // 1 year
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // Precache all built assets (JS, CSS, HTML)
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],

        // Don't cache these at all
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  server: {
    proxy: { '/api': 'http://localhost:3001' },
  },
})
