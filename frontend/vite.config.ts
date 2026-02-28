import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api/ingestion': { target: 'http://localhost:8001', changeOrigin: true, rewrite: p => p.replace(/^\/api\/ingestion/, '/api/v1') },
            '/api/graph': { target: 'http://localhost:8002', changeOrigin: true, rewrite: p => p.replace(/^\/api\/graph/, '/api/v1') },
            '/api/ledger': { target: 'http://localhost:8008', changeOrigin: true, rewrite: p => p.replace(/^\/api\/ledger/, '/api/v1') },
            '/api/governance': { target: 'http://localhost:8010', changeOrigin: true, rewrite: p => p.replace(/^\/api\/governance/, '/api/v1') },
            '/ws': { target: 'ws://localhost:9000', ws: true },
        },
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    three: ['three', '@react-three/fiber', '@react-three/drei'],
                    mapbox: ['mapbox-gl', 'react-map-gl'],
                    charts: ['recharts', 'd3'],
                },
            },
        },
    },
})
