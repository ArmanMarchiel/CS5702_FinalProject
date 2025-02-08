import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/CS5702_FinalProject/',
  build: {
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  // Explicitly copy public files
  publicDir: 'public'
})