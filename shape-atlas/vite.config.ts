/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

const NIGHT = '#070B1F'
// GitHub Pages serves the game from /<repo-name>/; the deploy workflow sets BASE_PATH. Locally it's /.
const BASE = process.env.BASE_PATH ?? '/'

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    tailwindcss(),
    // Installable app: manifest, icons (from pwa-assets.config.ts) and an offline service worker
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets: { config: true, overrideManifestIcons: true },
      includeAssets: ['app-icon.svg'],
      manifest: {
        name: 'Atlas Challenge',
        short_name: 'Atlas',
        description: 'Guess all 197 countries from their shapes, or find and name them on the world map.',
        theme_color: NIGHT,
        background_color: NIGHT,
        display: 'standalone',
        orientation: 'any',
        start_url: BASE,
        scope: BASE,
        categories: ['games', 'education'],
      },
      workbox: {
        // the game itself, both maps and the fonts work offline from the first visit
        globPatterns: ['**/*.{js,css,html,woff2,png,ico}', 'app-icon.svg'],
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        // flags (2.6 MB in total) are cached one by one as they're shown
        runtimeCaching: [
          {
            // a RegExp, not a function: Workbox copies this into the service worker as text, so it can't use BASE at runtime
            urlPattern: new RegExp(`${BASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}assets/[^/]+\\.svg$`),
            handler: 'CacheFirst',
            options: { cacheName: 'flags', expiration: { maxEntries: 300 } },
          },
        ],
      },
    }),
  ],
  // countries.json (~330 KB gzipped) is a deliberate lazy chunk
  build: {
    chunkSizeWarningLimit: 900,
    // keep flags as separate files so only the ones shown are downloaded
    assetsInlineLimit: (file) => (file.includes('flag-icons') ? false : undefined),
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
