import datasetJson from '../../public/data/dataset.json'
import proposal from '../../data/proposal-text.json'
import interventionsJson from '../../data/intervention-properties.json'
import provenance from '../../public/data/geometry-provenance.json'
import type {Dataset, Row, Cell} from '../../app/types/data'
import {value, numeric, need} from '../../app/utils/analytics'
import {pearson} from '../../app/utils/comparison'
export const publishedDataset=datasetJson as unknown as Dataset
const interventions=interventionsJson as {features:{properties:Record<string,unknown>}[]}
export interface Evidence { id:number; source:string; fields:string[]; description:string; result:Record<string,unknown> }
export interface DataQuery {
  operation:'list'|'sum'|'count'|'correlation'; columns:string[];
  locality:string|null; codes:string[]; filters:{column:string;operator:'eq'|'gt'|'gte'|'lt'|'lte'|'contains'|'not_null';value:Cell}[];
  sortBy:string|null; direction:'asc'|'desc'; limit:number; groupBy:'localidad'|null;
}
const normalize=(v:unknown)=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()
export function resolveColumn(field:string,dataset=publishedDataset) {
  if(field==='need')return 'need'
  if(dataset.columns.includes(field))return field
  const mapped=dataset.schema[field]
  if(mapped&&dataset.columns.includes(mapped))return mapped
  throw new Error(`Campo desconocido: ${field}. Usa el catálogo de columnas.`)
}
function read(row:Row,column:string,dataset:Dataset):Cell{return column==='need'?need(row,dataset.rows,dataset.schema):row[column]??null}
function filter(row:Row,column:string,op:string,target:Cell,dataset:Dataset) {
  const cell=read(row,column,dataset)
  if(op==='not_null')return cell!==null
  if(op==='eq')return column==='codigos_upz'?String(cell??'').split('|').some(c=>normalize(c)===normalize(target)):target===null?cell===null:normalize(cell)===normalize(target)
  if(cell===null||target===null)return false
  if(op==='contains')return normalize(cell).includes(normalize(target))
  const n=numeric(cell),t=numeric(target);if(n===null||t===null)return false
  return op==='gt'?n>t:op==='gte'?n>=t:op==='lt'?n<t:op==='lte'?n<=t:false
}
const sumAllowed=(column:string)=>/(?:_registros_publicados)$/.test(column)||['n_hogares_muestra','hogares_expandidos_em2021','area_km2','vivienda_programados','vivienda_en_ejecucion','vivienda_asistencia_ejecutada','vivienda_no_ejecutables'].includes(column)
export function queryData(query:DataQuery, scopeCodes:string[]|null, dataset=publishedDataset):Record<string,unknown> {
  if(!query || !['list','sum','count','correlation'].includes(query.operation))throw new Error('Operación no admitida.')
  if(!Array.isArray(query.columns)||query.columns.length>8||!Array.isArray(query.filters)||query.filters.length>8||!Array.isArray(query.codes)||query.codes.length>120)throw new Error('Consulta demasiado extensa.')
  if(!Number.isInteger(query.limit)||query.limit<1||query.limit>100||!['asc','desc'].includes(query.direction)||![null,'localidad'].includes(query.groupBy))throw new Error('Límite, agrupación u orden inválidos.')
  const columns=query.columns.map(c=>resolveColumn(c,dataset)),sortBy=query.sortBy?resolveColumn(query.sortBy,dataset):null
  const filters=query.filters.map(f=>{if(!['eq','gt','gte','lt','lte','contains','not_null'].includes(f.operator))throw new Error('Filtro inválido.');if(['gt','gte','lt','lte'].includes(f.operator)&&numeric(f.value)===null)throw new Error('Las comparaciones numéricas requieren un valor numérico.');return {...f,column:resolveColumn(f.column,dataset)}})
  let rows=dataset.rows.filter(r=>(scopeCodes===null||scopeCodes.includes(String(value(r,dataset.schema,'codigo')))) && (!query.codes.length||query.codes.includes(String(value(r,dataset.schema,'codigo')))) && (!query.locality||normalize(value(r,dataset.schema,'localidad'))===normalize(query.locality)) && filters.every(f=>filter(r,f.column,f.operator,f.value,dataset)))
  const base={source:dataset.source.name,fields:[...new Set([...columns,...filters.map(f=>f.column),...(sortBy?[sortBy]:[])])],matched:rows.length,scope:scopeCodes===null?'archivo completo':'dominios de los filtros actuales'}
  if(query.operation==='count')return {...base,count:rows.length,unit:'dominios completos'}
  if(query.operation==='correlation') {
    if(columns.length!==2)throw new Error('Correlación requiere exactamente dos columnas numéricas.')
    const pairs=rows.map(r=>({x:numeric(read(r,columns[0]!,dataset)),y:numeric(read(r,columns[1]!,dataset))})).filter((p):p is {x:number;y:number}=>p.x!==null&&p.y!==null)
    return {...base,pairs:pairs.length,missing:rows.length-pairs.length,pearson:pearson(pairs),limitation:'Descriptiva, sin ponderación muestral. No demuestra causalidad ni cobertura.'}
  }
  if(query.operation==='sum') {
    if(columns.length!==1||!sumAllowed(columns[0]!))throw new Error('Solo se suma una medida aditiva: registros de una línea, hogares, muestra, área o estados explícitos de Plan Terrazas. No se suman índices, porcentajes, tasas ni IDs distintos.')
    const groups=query.groupBy?[...new Set(rows.map(r=>String(value(r,dataset.schema,'localidad'))))]:['selección']
    return {...base,totals:groups.map(group=>{const subset=query.groupBy?rows.filter(r=>String(value(r,dataset.schema,'localidad'))===group):rows;const nums=subset.map(r=>numeric(read(r,columns[0]!,dataset))).filter((n):n is number=>n!==null);return {group,total:nums.length?nums.reduce((a,b)=>a+b,0):null,available:nums.length,domains:subset.length,partial:nums.length!==subset.length}})}
  }
  if(sortBy)rows=[...rows].sort((a,b)=>{const av=read(a,sortBy,dataset),bv=read(b,sortBy,dataset);if(av===null)return bv===null?0:1;if(bv===null)return -1;const delta=typeof av==='number'&&typeof bv==='number'?av-bv:String(av).localeCompare(String(bv),'es');return delta*(query.direction==='desc'?-1:1)})
  return {...base,returned:Math.min(rows.length,query.limit),truncated:rows.length>query.limit,rows:rows.slice(0,query.limit).map(r=>({codigo:String(value(r,dataset.schema,'codigo')),nombre:String(value(r,dataset.schema,'nombre')),localidad:String(value(r,dataset.schema,'localidad')??''),tipo:value(r,dataset.schema,'tipo'),codigos_upz:r.codigos_upz??null,...Object.fromEntries(columns.map(c=>[c,read(r,c,dataset)]))}))}
}
export function readKnowledge(pages:number[]) {
  if(!Array.isArray(pages)||pages.some(n=>!Number.isInteger(n)||n<1||n>proposal.pages.length))throw new Error('Páginas inválidas.')
  return {source:proposal.source,pages:proposal.pages.filter(p=>!pages.length||pages.includes(p.page)),model:'Necesidad (EM, cinco dimensiones) → presencia (cinco direcciones) → brecha = necesidad − presencia. Tenencia: Urbanizaciones y Titulación; vivienda: Mejoramiento y Curaduría Pública Social; entorno: Barrios; riesgo: Reasentamientos; vulnerabilidad transversal sin dirección exclusiva, ponderación pendiente.',currentState:'CSV preliminar de cuatro dimensiones. Presencia ejecutada, brecha, ranking y riesgo integrado están vacíos. El usuario construirá presencia. No confundir propuesta PDF con resultados validados.',geometryProvenance:provenance}
}
export function queryInterventions(localityCode:string|null,year:number|null,limit:number) {
  if(!Number.isInteger(limit)||limit<1||limit>30)throw new Error('Límite inválido.')
  const features=interventions.features.filter(f=>(!localityCode||String(Number(f.properties.loccodigo))===String(Number(localityCode)))&&(year===null||Number(f.properties['año_contr'])===year))
  return {source:'intervencion_de_mejoramiento_de_barrios.geojson',fields:['loccodigo','año_contr','id_interve','id_element','estado_con'],elements:features.length,distinctInterventions:new Set(features.map(f=>f.properties.id_interve).filter(v=>v!==null&&v!==undefined)).size,sample:features.slice(0,limit).map(f=>f.properties),limitation:'Universo del GeoJSON, distinto del CSV. Año de contrato, no fecha de ejecución. Estados sin diccionario. No hay cruce espacial validado por dominio; los filtros de dominios no se trasladan al GeoJSON.'}
}
