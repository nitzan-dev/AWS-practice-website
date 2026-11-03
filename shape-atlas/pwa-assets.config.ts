import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Generates the PWA / Apple touch icons and favicon from public/app-icon.svg.
// The artwork is full-bleed with the globe inside the mask safe zone, so no extra padding.
const background = '#070B1F'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0, resizeOptions: { background } },
    apple: { ...minimal2023Preset.apple, padding: 0, resizeOptions: { background } },
  },
  images: ['public/app-icon.svg'],
})
