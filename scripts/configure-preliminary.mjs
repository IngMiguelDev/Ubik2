import fs from 'node:fs/promises'
import Papa from 'papaparse'
const input=process.argv[2]
if(!input) throw new Error('Uso: node scripts/configure-preliminary.mjs archivo.csv')
const parsed=Papa.parse(await fs.readFile(input,'utf8'),{header:true,skipEmptyLines:'greedy'})
if(parsed.errors.length) throw new Error(JSON.stringify(parsed.errors))
const schema={codigo:'codigo_dominio_em',nombre:'nombre_dominio_em',localidad:'localidad',tipo:'tipo_dominio',corte:'fecha_validacion',limitaciones:'periodos_presencia',tenencia:'indice_tenencia_relativo',vivienda:'indice_vivienda_relativo',entorno:'indice_entorno_relativo',riesgo:'indice_riesgo_reportado_relativo',pobreza:'pct_pobreza_monetaria_hogares',jefatura:'pct_jefatura_femenina',brecha:'brecha_total_validada',ranking:'ranking_priorizacion_validado',necesidad_igual:'indice_necesidad_exploratorio_4dim',necesidad_vivienda:'necesidad_peso_doble_vivienda',necesidad_riesgo:'necesidad_peso_doble_riesgo',presencia_validada:'indice_presencia_ejecutada_2021_mas',riesgo_integrado:'indice_riesgo_integrado_validado',direccion_tenencia:'alta',direccion_vivienda:'alta',direccion_entorno:'alta',direccion_riesgo:'alta'}
for(const [key,prefix] of [['barrios','barrios'],['vivienda','vivienda'],['titulacion','titulacion'],['curaduria','curaduria'],['reasentamientos','reasentamiento']]) {
  schema[`registros_${key}`]=`${prefix}_registros_publicados`
  schema[`distintos_${key}`]=`${prefix}_ids_distintos`
  schema[`tasa_${key}`]=key==='barrios' ? 'barrios_elementos_por_km2' : `${prefix}_registros_por_1000_hogares_em2021`
}
const texts=['codigo_dominio_em','codigo_localidad','nombre_dominio_em','localidad','tipo_dominio','codigos_upz','estado_analisis','riesgo_POT_estado','fecha_validacion','alcance_vivienda','periodos_presencia']
const numericColumns=parsed.meta.fields.filter(c=>!texts.includes(c))
const config={schema,numericColumns,source:{name:'ubik2_indicadores_preliminares.csv',date:'2026-10-06',license:null},analysis:{kind:'supplied-normalized',dimensionsScale:'0–100',proposal:'propuesta-data-jam-cvp-2026.pdf',housingScope:'SOLO_PLAN_TERRAZAS',periods:'TODOS_LOS_REGISTROS_PUBLICADOS_NO_PERIODO_COMUN'}}
await fs.mkdir('data',{recursive:true})
await fs.writeFile('data/preliminary-schema.json',JSON.stringify(config,null,2))
console.log('Esquema verificado para las 106 columnas del archivo preliminar.')
