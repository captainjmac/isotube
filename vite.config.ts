import path from 'path'
import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    server: {
        host: 'localhost',
        port: 5173,
        // Proxy API calls to `wrangler pages dev` (Functions + local D1) so the
        // browser sees same-origin /api/* during development.
        proxy: {
            '/api': 'http://localhost:8788',
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
})
