import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Single source of truth: read .env from the repo root instead of a client/-local copy.
  // Vite only ever exposes VITE_-prefixed vars to client code, so the server-only
  // secrets living in that same root .env (JWT_SECRET, DATABASE_URL, etc.) are never leaked.
  envDir: path.resolve(__dirname, '..'),
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registers the service worker in `npm run dev` too, not just production builds,
      // so the install prompt / installability can be tested without a full build each time.
      devOptions: { enabled: true, type: 'module' },
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Rotaract Club of Salem Midtown — Dream to Deserve',
        short_name: 'ClubOps',
        description: 'Month-wise event & task management for club operations.',
        theme_color: '#b42244',
        background_color: '#fdfaf9',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
});
