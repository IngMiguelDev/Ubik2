import {assistantAccess,reserveRequest} from '../../utils/assistant-access'
import {runAgent,validateRequest,type ResponsePayload} from '../../utils/agent'
export default defineEventHandler(async event=>{
  const config=useRuntimeConfig(event)
  assistantAccess(event,config.aiAllowedOrigins)
  if(!config.openaiApiKey)throw createError({statusCode:503,statusMessage:'La IA está pendiente de conexión. El administrador debe configurar la clave en el servidor.'})
  if(!getHeader(event,'content-type')?.startsWith('application/json'))throw createError({statusCode:415,statusMessage:'Se requiere JSON.'})
  const raw=await readRawBody(event)
  if(!raw||Buffer.byteLength(raw)>100000)throw createError({statusCode:413,statusMessage:'Solicitud demasiado grande.'})
  let request
  try{request=validateRequest(JSON.parse(raw))}catch{throw createError({statusCode:400,statusMessage:'Pregunta, historial o alcance inválidos.'})}
  const release=reserveRequest(getRequestIP(event,{xForwardedFor:false})||'unknown')
  const deadline=Date.now()+110000
  try {
    return await runAgent(request,async body=>{
      const remaining=deadline-Date.now();if(remaining<=0)throw new Error('Tiempo de consulta agotado.')
      const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${config.openaiApiKey}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(Math.min(45000,remaining))})
      if(!response.ok)throw createError({statusCode:response.status===429?429:502,statusMessage:response.status===429?'El proveedor está ocupado. Intenta más tarde.':'No se pudo completar la respuesta de IA. Revisa la conexión del servidor.'})
      return await response.json() as ResponsePayload
    },config.openaiModel)
  }catch(error){const status=(error as {statusCode?:number}).statusCode;throw createError({statusCode:status===429?429:502,statusMessage:status===429?'El proveedor está ocupado. Intenta más tarde.':'No se pudo completar la respuesta de IA con evidencia. Intenta una pregunta más concreta.'})}
  finally{release()}
})
