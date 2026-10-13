import tailwindcss from '@tailwindcss/vite'
import type { NitroConfig } from 'nitropack/types'
const appBaseURL = (process.env.NUXT_APP_BASE_URL || '/').replace(/\/?$/, '/')
export default defineNuxtConfig({
  compatibilityDate: '2026-10-06',
  devtools: { enabled: false },
  hooks: {
    'nitro:config'(config) {
      // PapaParse contiene código de worker en una cadena con comillas dobles.
      // La sustitución equivalente con comillas simples conserva esa cadena al compilar SSR.
      const nitroConfig = config as NitroConfig
      nitroConfig.replace = { ...nitroConfig.replace, 'typeof window': "'undefined'" }
    }
  },
  runtimeConfig: {
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    aiAllowedOrigins: '',
    public: { aiBaseUrl: '', aiEnabled: true }
  },
  css: ['~/assets/css/main.css', 'leaflet/dist/leaflet.css'],
  vite: { plugins: [tailwindcss()] },
  app: { baseURL: appBaseURL, head: { htmlAttrs: { lang: 'es' }, title: 'UBiK2 · Observatorio territorial CVP', link: [
    { rel: 'icon', type: 'image/x-icon', href: `${appBaseURL}favicon.ico` },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: `${appBaseURL}favicon.png` },
    { rel: 'apple-touch-icon', sizes: '180x180', href: `${appBaseURL}apple-touch-icon.png` }
  ], meta: [{ name: 'description', content: 'Exploración territorial de necesidad habitacional y presencia publicada de la CVP.' }] } }
})
