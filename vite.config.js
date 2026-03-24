import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.PORT || '5000'

  return {
    root: 'frontend',
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      proxy: {
        '/api': {
          target: `http://127.0.0.1:${backendPort}`,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
    },
  }
})
