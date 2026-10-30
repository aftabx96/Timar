import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Same origin for the API in development, so the session cookie stays first party.
    proxy: { '/api': 'http://localhost:4000', '/uploads': 'http://localhost:4000' },
  },
})
