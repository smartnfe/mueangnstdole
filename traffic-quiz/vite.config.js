import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // ใช้ relative path เพื่อให้สามารถรันจากโฟลเดอร์ย่อยบน GitHub Pages ได้
})
