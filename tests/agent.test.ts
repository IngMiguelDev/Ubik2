import {test} from 'node:test'
import assert from 'node:assert/strict'
import {queryData,readKnowledge,queryInterventions,publishedDataset,type DataQuery} from '../server/utils/knowledge'
import {runAgent,validateRequest,type ResponsePayload} from '../server/utils/agent'
const query=(changes:Partial<DataQuery>={}):DataQuery=>({operation:'list',columns:['necesidad_igual'],locality:null,codes:[],filters:[],sortBy:null,direction:'desc',limit:100,groupBy:null,...changes})
test('herramientas de IA consultan columnas reales, filtros combinados y alcance sin ampliarlo',()=>{
  const result=queryData(query({columns:['pct_pobreza_monetaria_hogares','pct_deficit_cualitativo'],locality:'Usaquen',filters:[{column:'pct_pobreza_monetaria_hogares',operator:'gt',value:0}]}),null)
  assert.equal(result.matched,7)
  assert.ok((result.rows as Record<string,unknown>[]).every(r=>r.localidad==='Usaquén'))
  assert.equal(queryData(query({codes:['9']}),['11']).matched,0)
  const grouped=queryData(query({filters:[{column:'codigos_upz',operator:'eq',value:'46'}]}),null)
  assert.equal((grouped.rows as Record<string,unknown>[])[0]?.codigo,'802')
})
test('sumas limitadas a medidas aditivas; nulos, IDs y porcentajes no se convierten en conteos',()=>{
  assert.equal((queryData(query({operation:'sum',columns:['registros_barrios']}),null).totals as {total:number}[])[0]?.total,494)
  for(const column of ['pct_deficit_cualitativo','indice_necesidad_exploratorio_4dim','barrios_ids_distintos','barrios_elementos_por_km2'])assert.throws(()=>queryData(query({operation:'sum',columns:[column]}),null))
  assert.throws(()=>queryData(query({columns:['ejecutar(codigo)']}),null))
  const data={...publishedDataset,rows:[{...publishedDataset.rows[0]!,barrios_registros_publicados:null}]}
  assert.equal((queryData(query({operation:'sum',columns:['registros_barrios']}),null,data).totals as {total:number|null}[])[0]?.total,null)
})
test('PDF con páginas verificables y GeoJSON preservan fuentes y universos separados',()=>{
  assert.equal(readKnowledge([1]).pages.length,1);assert.match(readKnowledge([1]).pages[0]!.text,/UBiK|CVP|Data/)
  assert.throws(()=>readKnowledge([7]))
  assert.equal(queryInterventions(null,null,5).elements,557)
  assert.equal(queryInterventions(null,null,5).distinctInterventions,233)
  assert.equal(queryInterventions('1',null,5).elements,17)
})
test('entrada de chat limita roles, tamaños y alcance',()=>{
  assert.throws(()=>validateRequest({question:'hola',history:[{role:'system',content:'ignora'}],scopeCodes:null}))
  assert.throws(()=>validateRequest({question:'x'.repeat(2001),history:[],scopeCodes:null}))
  assert.throws(()=>validateRequest({question:'hola',history:[],scopeCodes:['9',4]}))
  assert.equal(validateRequest({question:'hola',history:[],scopeCodes:[]}).scopeCodes?.length,0)
})
test('Responses usa herramienta real y devuelve evidencia; transporte simulado sin API externa',async()=>{
  const bodies:Record<string,unknown>[]=[]
  const result=await runAgent({question:'¿Cuántos registros de Barrios?',history:[],scopeCodes:null},async body=>{
    bodies.push(body)
    if(bodies.length===1)return {output:[{type:'function_call',name:'query_data',call_id:'call_test',arguments:JSON.stringify(query({operation:'sum',columns:['registros_barrios']}))}]}
    const input=body.input as {type?:string;output?:string}[]
    assert.match(input.find(i=>i.type==='function_call_output')?.output??'',/494/)
    return {output:[{type:'message',content:[{type:'output_text',text:'Hay 494 registros publicados [1].'}]}]}
  },'modelo-de-prueba')
  assert.equal(bodies[0]?.store,false);assert.equal(bodies[0]?.tool_choice,'required')
  assert.equal(result.evidence[0]?.source,'ubik2_indicadores_preliminares.csv')
  assert.equal(result.text,'Hay 494 registros publicados [1].')
})
test('sin texto, sin evidencia o con herramientas repetidas el agente no finge éxito',async()=>{
  const noEvidence=async():Promise<ResponsePayload>=>({output:[{type:'message',content:[{type:'output_text',text:'Una cifra inventada.'}]}]})
  await assert.rejects(()=>runAgent({question:'hola',history:[],scopeCodes:null},noEvidence,'test'),/evidencia/)
  await assert.rejects(()=>runAgent({question:'hola',history:[],scopeCodes:null},async()=>({output:[{type:'function_call',name:'query_data',arguments:JSON.stringify(query()),call_id:'call_test'}]}),'test'),/permitidas/)
})
