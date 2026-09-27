import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative asset paths so the built site also works when served from a
  // sub-path (e.g. GitHub Pages) or opened as a static file — an absolute
  // base is a common cause of a blank/black screen on a phone where the
  // JS/CSS bundle silently 404s.
  base: './',
  build: {
    // A production build (npm run build) transpiles down to this target,
    // widening the range of tablet/phone browsers (especially older
    // budget Android tablets) that can run it at all. Note this does NOT
    // apply to `npm run dev` — the dev server always serves modern native
    // ES modules, so a genuinely old browser needs the built+previewed
    // version, not the dev server, to work.
    target: 'es2015',
  },
  server: {
    host: true, // listen on 0.0.0.0 so phones on the same Wi-Fi can open it
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
})
