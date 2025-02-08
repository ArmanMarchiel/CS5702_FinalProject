import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/CS5702_FinalProject/',
  server: {
    port: 3000,
    open: true
  }
})