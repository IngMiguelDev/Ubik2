import { spawnSync } from 'node:child_process'
const configured=process.env.NUXT_APP_BASE_URL
const path=process.env.CI_PAGES_URL ? new URL(process.env.CI_PAGES_URL).pathname : '/'
const base=(configured || path).replace(/\/?$/, '/')
if(!base.startsWith('/')) throw new Error('NUXT_APP_BASE_URL debe ser una ruta absoluta, por ejemplo /Ubik2/')
const result=spawnSync(process.execPath,['node_modules/nuxt/bin/nuxt.mjs','generate'],{stdio:'inherit',env:{...process.env,NUXT_APP_BASE_URL:base}})
if(result.error) throw result.error
process.exit(result.status ?? 1)
