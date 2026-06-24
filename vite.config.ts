import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative base so the same build works at both the GitHub Pages project URL
  // (github.io/Pr-vingar/) and the provningsguiden.se custom domain root.
  base: './',
})
