import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    host: '0.0.0.0',
  },
  preview: {
    allowedHosts: ['bordados-silvinha.ddnsfree.com'],
  },
  plugins: [react()],
})
