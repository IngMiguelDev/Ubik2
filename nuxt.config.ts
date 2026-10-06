import tailwindcss from '@tailwindcss/vite'
export default defineNuxtConfig({
  compatibilityDate: '2026-10-06',
  devtools: { enabled: false },
  css: ['~/assets/css/main.css', 'leaflet/dist/leaflet.css'],
  vite: { plugins: [tailwindcss()] },
  app: { baseURL: process.env.NUXT_APP_BASE_URL || '/', head: { htmlAttrs: { lang: 'es' }, title: 'UBiK2 · Observatorio territorial CVP', meta: [{ name: 'description', content: 'Exploración territorial de necesidad habitacional y presencia publicada de la CVP.' }] } }
})
