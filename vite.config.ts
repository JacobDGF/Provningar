import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Stamped once per build/dev-start. version.json is fetched at runtime
// (no-store) so the running app can detect a newer deploy and prompt a
// reload — GitHub Pages doesn't let us set custom Cache-Control headers,
// so this replaces relying on HTTP caching semantics.
const buildId = Date.now().toString()
fs.writeFileSync(
  path.resolve(__dirname, 'public/version.json'),
  JSON.stringify({ buildId })
)

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative base so the same build works at both the GitHub Pages project URL
  // (github.io/Pr-vingar/) and any future custom domain root.
  base: './',
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
})
