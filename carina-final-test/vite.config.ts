import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        },
      manifest: {
        name: 'Carina',
        short_name: 'Carina',
        description: 'Personal local-first expense tracker',
        theme_color: '#172235',
        background_color: '#f3ead8',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [{ src: '/icon-512-v2.png', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
      }
    })
  ]
});
