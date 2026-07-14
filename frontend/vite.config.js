import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// WRS Clinic PWA — installable, offline-first clinic operating system
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'WRS Clinic',
        short_name: 'WRS Clinic',
        description: 'Your clinic in your pocket.',
        theme_color: '#0f766e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'wrs-api-cache',
              networkTimeoutSeconds: 3,
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    // In local dev the proxy is what makes relative /api/* calls work.
    // Once you're behind a Cloudflare tunnel, VITE_API_BASE_URL (or the
    // in-app Marketplace > Gateway URL override) takes over — see
    // src/config.js. This proxy just covers plain `npm run dev` on one box.
    proxy: {
      '/api': 'http://localhost:4000'
    },
    // Allow Termux/Cloudflare tunnel hostnames through Vite's dev host
    // check. Set VITE_DEV_ALLOWED_HOST in .env if Vite rejects your
    // tunnel's Host header (e.g. "Blocked request. This host is not
    // allowed").
    allowedHosts: process.env.VITE_DEV_ALLOWED_HOST
      ? [process.env.VITE_DEV_ALLOWED_HOST]
      : true
  }
});
