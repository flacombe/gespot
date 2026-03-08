import { dirname, resolve} from 'node:path'
import { defineConfig } from 'vite'
import { renderSVG } from 'vite-plugin-render-svg'

export default defineConfig({
  build: {
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

  plugins: [
    renderSVG({
      pattern: 'src/icons/*.svg',
      urlPrefix: 'icons/',
      outputOriginal: true
    })
  ]
})