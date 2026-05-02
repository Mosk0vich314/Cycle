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
          { src: `/${REPO_NAME}/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `/${REPO_NAME}/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Force the new service worker to activate immediately and take control of all
        // open tabs / PWA windows, then drop stale precache entries from previous builds.
        // Combined with the controllerchange reload in main.jsx, this means a new deploy
        // is picked up automatically — no manual hard-refresh required, even on iOS PWA.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Always serve a fresh index.html when online so users can't get stuck on an
        // old shell that references deleted hashed assets.
        navigateFallback: `/${REPO_NAME}/index.html`,
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
