import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

/**
 * Eklenti olarak yüklenen bir sayfa dosya kökünden (`chrome-extension://`)
 * servis ediliyor; mutlak yollar (`/assets/...`) çalışmaz, `base: './'`
 * şart.
 */
export default defineConfig({
  plugins: [vue()],
  base: './',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: { input: { newtab: fileURLToPath(new URL('./index.html', import.meta.url)) } },
  },
})
