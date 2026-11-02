/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
