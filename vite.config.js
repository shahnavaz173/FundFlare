import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const appVersion = new Date().toISOString();

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'icons/*.png'],
      cacheId: `fundflare-${appVersion}`,

      manifest: {
        name: 'FundFlare Personal Finance',
        short_name: 'FundFlare',
        description: 'FundFlare app to manage personal finance',
        theme_color: '#1976D2',
        start_url: "/",
        display: "standalone",
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
