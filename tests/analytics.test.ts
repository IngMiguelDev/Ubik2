import { test } from 'node:test'
import assert from 'node:assert/strict'
import { filterRows, need, total, integral } from '../app/utils/analytics'
import { numberColumn, parseCsv, exportRows } from '../app/utils/csv'
// Datos sintéticos únicamente de prueba: no se publican ni se cargan en la aplicación.
const schema = { codigo:'id', nombre:'name', localidad:'loc', tenencia:'t', vivienda:'v', entorno:'e', riesgo:'r', direccion_tenencia:'alta', direccion_vivienda:'alta', direccion_entorno:'baja', direccion_riesgo:'alta', registros_barrios:'b' }
const rows = [{ id:'001',name:'Prueba A',loc:'L1',t:0,v:10,e:10,r:0,b:2 },{ id:'002',name:'Prueba B',loc:'L2',t:10,v:0,e:0,r:10,b:null }]
test('nulos preservados, códigos como texto, coma decimal explícita', () => {
  const data=parseCsv('id;v;name\n001;1,5;"Nombre; con separador"\n002;;Otro\n')
  assert.equal(data.rows[0]?.id,'001'); assert.equal(data.rows[1]?.v,null)
  assert.equal(numberColumn(data.rows,'v')[0]?.v,1.5)
  assert.throws(()=>numberColumn([{ v:'estado 2' }],'v'))
})
test('suma parcial no imputa nulos y todo faltante es null', () => { assert.equal(total(rows,schema,'registros_barrios'),2); assert.equal(total([rows[1]!],schema,'registros_barrios'),null); assert.equal(total([],schema,'registros_barrios'),null); assert.equal(integral(rows[0]!,schema),null) })
test('filtros combinados y ausencia de registros', () => {
  assert.equal(filterRows(rows,schema,{ locality:'L1', domain:'001', line:'barrios', search:'prueba' }).length,1)
  assert.equal(filterRows(rows,schema,{ locality:'L2',domain:'',line:'barrios',search:'' }).length,0)
  assert.equal(filterRows(rows,schema,{ locality:'',domain:'',line:'',search:'002' }).length,1)
  assert.equal(filterRows([{...rows[0]!,b:7777}],schema,{locality:'',domain:'',line:'',search:'7777'}).length,0)
  assert.equal(filterRows([{...rows[0]!,name:'Chicó'}],schema,{locality:'',domain:'',line:'',search:'chico'}).length,1)
})
test('normalización, inversión y sensibilidad', () => {
  assert.equal(need(rows[0]!,rows,schema),25); assert.equal(need(rows[0]!,rows,schema,'housing'),40); assert.equal(need(rows[0]!,rows,schema,'risk'),20)
  assert.equal(need({ ...rows[0]!, v:null },rows,schema),null)
  assert.equal(need(rows[0]!,rows,{ ...schema, direccion_riesgo:'' }),null)
  assert.equal(need(rows[0]!,[rows[0]!],schema),null)
})
test('exportación evita fórmulas y conserva filas',()=> { const csv=exportRows([{ name:'=1+1',v:null },{name:'A',v:0}]); assert.ok(csv.includes("'=1+1")); assert.equal(parseCsv(csv).rows.length,2) })
