import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite' // <-- TAMBAHKAN INI

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(), // <-- TAMBAHKAN INI JUGA
  ],
})