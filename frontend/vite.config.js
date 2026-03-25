import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_API_URL?.trim() || 'http://127.0.0.1:5001'
  const backendOrigin = new URL(backendUrl).origin

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
        },
      },
    },
  }
})
