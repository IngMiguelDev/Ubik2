import { createError, getHeader, setHeader, getRequestURL, type H3Event } from 'h3'
export function assistantAccess(event:H3Event,allowedOrigins:string) {
  const origin=getHeader(event,'origin')
  const allowed=allowedOrigins.split(',').map(s=>s.trim()).filter(Boolean)
  if(origin&&origin!==getRequestURL(event).origin&&!allowed.includes(origin))throw createError({statusCode:403,statusMessage:'Origen no autorizado para el asistente.'})
  if(origin&&allowed.includes(origin)){setHeader(event,'Access-Control-Allow-Origin',origin);setHeader(event,'Vary','Origin');setHeader(event,'Access-Control-Allow-Methods','GET, POST, OPTIONS');setHeader(event,'Access-Control-Allow-Headers','Content-Type')}
  setHeader(event,'Cache-Control','no-store')
}
const limits=new Map<string,{start:number;count:number;active:number}>()
export function reserveRequest(ip:string) {
  const now=Date.now()
  for(const [key,item] of limits)if(now-item.start>3600000&&item.active===0)limits.delete(key)
  const current=limits.get(ip)||{start:now,count:0,active:0}
  if(current.active>=2||current.count>=30)throw createError({statusCode:429,statusMessage:'Has alcanzado el límite de consultas. Intenta más tarde.'})
  if(limits.size>=10000&&!limits.has(ip))throw createError({statusCode:503,statusMessage:'El asistente está ocupado.'})
  current.count++;current.active++;limits.set(ip,current)
  return ()=>{current.active=Math.max(0,current.active-1)}
}
