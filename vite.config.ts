import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      logLevel: 'warn',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'manifest.json'],
          manifest: {
            id: '/',
            name: 'CrewPulse - Shift & Rota Tracking',
            short_name: 'CrewPulse',
            description: 'Shift-tracking and rota scheduling for field crews with 24-hour offline auto-sync.',
            theme_color: '#0f172a',
            background_color: '#090d16',
            display: 'standalone',
            start_url: '/',
            scope: '/'
          },
          workbox: {
            maximumFileSizeToCacheInBytes: 8 * 1024 * 1024
          },
          devOptions: {
            enabled: true,
            type: 'module'
          }
        })
      ],
      define: {
        'process.env.GOOGLE_MAPS_API_KEY': JSON.stringify(env.GOOGLE_MAPS_API_KEY || env.VITE_GOOGLE_MAPS_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
