import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const envDir = path.resolve(import.meta.dirname, '../..');
const env = loadEnv(process.env.NODE_ENV ?? 'development', envDir, '');
const rawPort = process.env.PORT ?? env.PORT ?? '5173';

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? env.BASE_PATH ?? '/';
if (!basePath.startsWith('/') || !basePath.endsWith('/')) throw new Error('BASE_PATH must start and end with /.');

export default defineConfig({
  base: basePath,
  envDir,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'data-sources.txt'],
      manifest: {
        id: basePath,
        name: 'Kana — Japanese Practice',
        short_name: 'Kana',
        description: 'A little Japanese, every day. Private, offline kana, kanji, vocabulary and survival practice.',
        start_url: basePath,
        scope: basePath,
        display: 'standalone',
        background_color: '#f7f8f2',
        theme_color: '#51744c',
        lang: 'en',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,png,svg,woff,woff2}'],
        navigateFallback: `${basePath}index.html`,
        navigateFallbackDenylist: [/^\/api(?:\/|$)/, /^\/__mockup(?:\/|$)/],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
    }),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
