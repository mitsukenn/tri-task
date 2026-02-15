import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    base: '/tri-task/',
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
                name: '今日もS++ランク！',
                short_name: 'tri-rank',
                description: '毎日のタスクをS++ランクで達成しよう',
                theme_color: '#38bdf8',
                background_color: '#f8fbff',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/tri-task/',
                scope: '/tri-task/',
                icons: [
                    {
                        src: 'icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: 'icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            },
        }),
    ],
});
