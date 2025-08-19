// vite.config.mts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://buddy-tour-production.up.railway.app',
        changeOrigin: true, // يخلّي Origin يبان كأنه من السيرفر الهدف
        secure: true,       // Railway شهادة SSL صحيحة، سيبه true
        // مفيش rewrite — إحنا عايزين /api تروح /api زي ما هي
      },
    },
  },
})

