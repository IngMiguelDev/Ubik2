import tailwindcss from '@tailwindcss/vite'
import type { NitroConfig } from 'nitropack/types'
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
  app: { baseURL: process.env.NUXT_APP_BASE_URL || '/', head: { htmlAttrs: { lang: 'es' }, title: 'UBiK2 · Observatorio territorial CVP', meta: [{ name: 'description', content: 'Exploración territorial de necesidad habitacional y presencia publicada de la CVP.' }] } }
})
