import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Repo name on GitHub — used as the base path for GitHub Pages.
const REPO_NAME = 'Cycle';

export default defineConfig({
  base: `/${REPO_NAME}/`,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Cute Period Tracker',
        short_name: 'Cycle',
        description: 'A cute, private period & cycle tracker with Mochi Peach Cat companions.',
        theme_color: '#ffd1dc',
        background_color: '#fff5f7',
        display: 'standalone',
        orientation: 'portrait',
        start_url: `/${REPO_NAME}/`,
        scope: `/${REPO_NAME}/`,
        icons: [
          { src: `/${REPO_NAME}/icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `/${REPO_NAME}/icon-512.png`, sizes: '512x512', type: 'image/png' },
          { src: `/${REPO_NAME}/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/media\.tenor\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'tenor-gifs',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
});
