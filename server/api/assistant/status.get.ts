import {assistantAccess} from '../../utils/assistant-access'
export default defineEventHandler(event=>{
  const config=useRuntimeConfig(event)
  assistantAccess(event,config.aiAllowedOrigins)
  return {ready:Boolean(config.openaiApiKey),provider:'OpenAI',model:config.openaiApiKey?config.openaiModel:null,source:'ubik2_indicadores_preliminares.csv'}
})
