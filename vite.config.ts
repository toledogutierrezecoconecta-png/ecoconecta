import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' permite publicar en GitHub Pages bajo cualquier subcarpeta.
// El enrutado usa HashRouter, por lo que no hace falta configurar 404.html.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
