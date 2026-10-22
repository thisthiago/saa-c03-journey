/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rolldownOptions: {
      output: {
        // Conteúdo e bibliotecas em pacotes separados: mudanças de conteúdo não invalidam o cache do resto.
        advancedChunks: {
          groups: [
            { name: 'vendor', test: /node_modules/ },
            { name: 'content-foundations', test: /src[\\/]content[\\/]modules[\\/]foundations[\\/]/ },
            { name: 'content-storage', test: /src[\\/]content[\\/]modules[\\/]storage[\\/]/ },
            { name: 'content-identity', test: /src[\\/]content[\\/]modules[\\/]identity[\\/]/ },
            { name: 'content-compute', test: /src[\\/]content[\\/]modules[\\/]compute[\\/]/ },
            { name: 'content-database', test: /src[\\/]content[\\/]modules[\\/]database[\\/]/ },
            { name: 'content-governance', test: /src[\\/]content[\\/]modules[\\/]governance[\\/]/ },
            { name: 'content-network', test: /src[\\/]content[\\/]modules[\\/]network[\\/]/ },
            { name: 'content-analytics', test: /src[\\/]content[\\/]modules[\\/]analytics[\\/]/ },
            { name: 'content-security', test: /src[\\/]content[\\/]modules[\\/]security[\\/]/ },
            { name: 'content-integration', test: /src[\\/]content[\\/]modules[\\/]integration[\\/]/ },
            { name: 'content', test: /src[\\/]content[\\/]/ },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
})
