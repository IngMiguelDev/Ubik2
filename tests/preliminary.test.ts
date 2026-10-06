import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import Papa from 'papaparse'
import type { Dataset } from '../app/types/data'
import { total, need, integral, filterRows } from '../app/utils/analytics'
const dataset:Dataset=JSON.parse(await fs.readFile('public/data/dataset.json','utf8'))
const config=JSON.parse(await fs.readFile('data/preliminary-schema.json','utf8'))
test('95 dominios, 106 columnas; cada celda coincide con el CSV original',async()=>{
  const parsed=Papa.parse<Record<string,string>>(await fs.readFile('public/data/original.csv','utf8'),{header:true,skipEmptyLines:'greedy'})
  assert.equal(parsed.errors.length,0);assert.equal(parsed.data.length,95);assert.equal(dataset.columns.length,106)
  for(let i=0;i<95;i++)for(const column of dataset.columns){const raw=parsed.data[i]![column];assert.equal(dataset.rows[i]![column],raw===''?null:config.numericColumns.includes(column)?Number(raw):raw)}
  assert.equal(dataset.rows.filter(r=>r.tipo_dominio==='UPZ').length,80);assert.equal(dataset.rows.filter(r=>r.tipo_dominio==='grupo_UPZ').length,15)
})
test('conteos originales por línea y filtros sobre datos reales',()=>{
  for(const [key,count]of [['barrios',494],['vivienda',864],['curaduria',1185],['titulacion',5899],['reasentamientos',18347]] as const)assert.equal(total(dataset.rows,dataset.schema,`registros_${key}`),count)
  const filtered=filterRows(dataset.rows,dataset.schema,{locality:'Usaquén',domain:'',line:'barrios',search:''})
  assert.equal(filtered.length,dataset.rows.filter(r=>r.localidad==='Usaquén'&&Number(r.barrios_registros_publicados)>0).length)
  assert.equal(new Set(dataset.rows.map(r=>r.localidad)).size,19)
})
test('índices publicados, sensibilidad y pendientes conservados en las 95 filas',()=>{
  for(const [raw,index] of [['pct_tenencia_proxy','indice_tenencia_relativo'],['pct_deficit_cualitativo','indice_vivienda_relativo'],['entorno_proxy_pct_medio','indice_entorno_relativo'],['pct_riesgo_reportado_alguno','indice_riesgo_reportado_relativo']]){
    const values=dataset.rows.map(r=>Number(r[raw!])),lo=Math.min(...values),hi=Math.max(...values)
    for(const row of dataset.rows)assert.ok(Math.abs(100*(Number(row[raw!])-lo)/(hi-lo)-Number(row[index!]))<.000004)
  }
  for(const row of dataset.rows){
    const dims=['indice_tenencia_relativo','indice_vivienda_relativo','indice_entorno_relativo','indice_riesgo_reportado_relativo'].map(k=>Number(row[k]))
    for(const [scenario,weights]of [['equal',[1,1,1,1]],['housing',[1,2,1,1]],['risk',[1,1,1,2]]] as const){const expected=dims.reduce((s,v,i)=>s+v*weights[i]!,0)/weights.reduce((s,v)=>s+v,0);assert.ok(Math.abs(need(row,dataset.rows,dataset.schema,scenario)!-expected)<.000001)}
    assert.equal(integral(row,dataset.schema),row.lineas_con_registro_publicado)
    for(const key of ['indice_presencia_ejecutada_2021_mas','brecha_total_validada','ranking_priorizacion_validado','indice_riesgo_integrado_validado'])assert.equal(row[key],null)
    assert.equal(row.alcance_vivienda,'SOLO_PLAN_TERRAZAS')
  }
})
test('cartografía: dominios completos y GeoJSON de actuaciones separado',async()=>{
  const geo=JSON.parse(await fs.readFile('public/data/dominios.geojson','utf8'))
  const original=JSON.parse(await fs.readFile('public/data/upz-oficiales.geojson','utf8'))
  assert.equal(geo.features.length,95);assert.equal(new Set(original.features.map((f:any)=>f.properties.UPLCODIGO)).size,112)
  const members=new Set<string>()
  for(const row of dataset.rows){const f=geo.features.find((f:any)=>f.properties.codigo_dominio_em===row.codigo_dominio_em);assert.ok(f);assert.equal(f.properties.codigos_upz,row.codigos_upz);assert.equal(f.geometry.type,'MultiPolygon');for(const code of String(row.codigos_upz).split('|')){assert.ok(!members.has(code));members.add(code)}const expected=original.features.filter((o:any)=>String(row.codigos_upz).split('|').includes(o.properties.UPLCODIGO.replace(/^UPZ/,''))).reduce((n:number,o:any)=>n+(o.geometry.type==='Polygon'?1:o.geometry.coordinates.length),0);assert.equal(f.geometry.coordinates.length,expected)}
  assert.equal(members.size,112)
  const works=JSON.parse(await fs.readFile('public/data/intervenciones-barrios.geojson','utf8'));assert.equal(works.features.length,557);assert.equal(new Set(works.features.map((f:any)=>f.properties.id_interve)).size,233)
})
