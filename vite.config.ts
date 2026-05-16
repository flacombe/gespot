/// <reference types="vitest/config" />
import { dirname, resolve} from 'node:path'
import { defineConfig } from 'vite'
import { renderSVG } from 'vite-plugin-render-svg'
import i18nextLoader from 'vite-plugin-i18next-loader'

export default defineConfig({
  build: {
    target: 'es2022',
    outDir: './dist',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: {
        main: resolve (__dirname, 'index.html'),
        about: resolve (__dirname, 'about-fr.html'),
        legal: resolve (__dirname, 'legal.html'),
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/maplibre-gl')) {
            return 'maplibre'
          }
        }
      }
    }
  },

  server: {
    fs: {
      // Allow serving files from one level up to the project root
      allow: ['..']
    }
  },

  plugins: [
    renderSVG({
      pattern: 'src/icons/*.svg',
      urlPrefix: 'icons/',
      outputOriginal: true
    }),
    i18nextLoader({ paths: ['./locales'], namespaceResolution: 'relativePath' })
  ],

  test: {
    environment: 'puppeteer',
    globalSetup: 'vitest-environment-puppeteer/global-init',
    globals: true
  }
})
