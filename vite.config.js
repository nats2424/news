import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages (https://nats2424.github.io/news/) で配信するため base を指定
export default defineConfig({
  plugins: [react()],
  base: '/news/',
})
