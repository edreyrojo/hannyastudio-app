import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // El aviso de actualización se maneja en App.jsx con virtual:pwa-register.
      registerType: 'prompt',
      injectRegister: null,
      // El manifest vive en public/manifest.json y se mantiene a mano.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,webp,png,woff2,svg,json}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
