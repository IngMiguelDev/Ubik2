// Solo para integración local: el servidor de producción nunca importa este archivo.
// Evita cualquier llamada de red al proveedor; prueba el flujo HTTP y las herramientas.
const originalFetch=globalThis.fetch
globalThis.fetch=async(url,options)=>{
  if(String(url)!=='https://api.openai.com/v1/responses')return originalFetch(url,options)
  const body=JSON.parse(options.body)
  const outputs=body.input.filter(item=>item.type==='function_call_output')
  if(!outputs.length){
    const args={operation:'sum',columns:['registros_barrios'],locality:null,codes:[],filters:[],sortBy:null,direction:'desc',limit:100,groupBy:null}
    return Response.json({status:'completed',output:[{type:'function_call',name:'query_data',call_id:'local_test',arguments:JSON.stringify(args)}]})
  }
  const result=JSON.parse(outputs.at(-1).output)
  const text=`Hay ${result.totals[0].total??'datos faltantes'} registros publicados de Barrios en el alcance consultado [${result.citation}]. No equivalen a beneficiarios únicos.`
  return Response.json({status:'completed',output:[{type:'message',content:[{type:'output_text',text}]}]})
}
