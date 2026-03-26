import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  root: path.resolve(__dirname, 'frontend'),
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  }
})
