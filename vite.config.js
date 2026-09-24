import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the built site also works when served from a
  // sub-path (e.g. GitHub Pages) or opened as a static file — an absolute
  // base is a common cause of a blank/black screen on a phone where the
  // JS/CSS bundle silently 404s.
  base: './',
  server: {
    host: true, // listen on 0.0.0.0 so phones on the same Wi-Fi can open it
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
})
