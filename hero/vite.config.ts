import fs from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// The hero shows the real app UI, so `@/` points at the prototype's source, as it does inside the app.
// Expects the app checked out next to this repo; set GQ_APP to build from somewhere else.
const prototype = fs.realpathSync(path.resolve(process.env.GQ_APP ?? path.join(import.meta.dirname, '../../great-questions')))
const stylesheet = path.join(prototype, 'src/index.css')

/**
 * The app's stylesheet, adapted for the page: fonts come from the page's Google Fonts link instead of bundled
 * files, and Tailwind scans the prototype's components and the hero's own files for classes.
 */
function pageStyles(): Plugin {
  return {
    name: 'hero-page-styles',
    enforce: 'pre',
    transform(code, id) {
      if (id.split('?')[0] !== stylesheet) return
      return [
        code
          .replace(/^@import "@fontsource.*$/gm, '')
          .replace('"Inter Variable",', '"Inter Variable", "Inter",')
          .replace('"Newsreader Variable",', '"Newsreader Variable", "Newsreader",'),
        '@source "./";',
        `@source "${path.join(import.meta.dirname, 'src')}";`,
      ].join('\n')
    },
  }
}

export default defineConfig({
  plugins: [pageStyles(), react(), tailwindcss()],
  resolve: {
    alias: [{ find: '@', replacement: path.join(prototype, 'src') }],
    // One copy of each, or prototype components and hero code end up with separate React instances.
    dedupe: ['react', 'react-dom', 'motion', 'lucide-react'],
  },
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    outDir: '../assets',
    // Library mode skips whitespace minification for ES output by default; this is a page script, not a library.
    minify: true,
    rolldownOptions: { output: { minify: true } },
    emptyOutDir: false,
    lib: { entry: 'src/main.tsx', formats: ['es'], fileName: () => 'hero.js' },
  },
})
