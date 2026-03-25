import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_API_URL?.trim() || 'https://floorwebsitenew.onrender.com/'
  const backendOrigin = new URL(backendUrl).origin

  return {
    plugins: [react()],
    server: {
      host: 'https://floorwebsitenew.onrender.com/',
      proxy: {
        '/api': {
          target: backendOrigin,
          changeOrigin: true,
        },
      },
    },
  }
})
