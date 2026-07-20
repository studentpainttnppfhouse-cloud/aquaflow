import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves the app under /<repo>/ — Vercel and local dev serve from /.
// The deploy workflow sets GITHUB_PAGES=true.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/aquaflow/' : '/',
})
