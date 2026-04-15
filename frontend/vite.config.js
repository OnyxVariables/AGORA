import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
  server: {
    watch: {
      usePolling: true,
      interval: 1000
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist'
  },

  define: {
    'process.env': {
      VITE_API_URL: JSON.stringify(process.env.VITE_API_URL),
      VITE_AUTH_URL: JSON.stringify(process.env.VITE_AUTH_URL),
    }
  }
})
