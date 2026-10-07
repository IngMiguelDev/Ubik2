import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import type { Dataset } from '../app/types/data'
import { explorerValue, presenceFilter, availableIndicators } from '../app/utils/explorer'
const data=JSON.parse(fs.readFileSync('public/data/dataset.json','utf8')) as Dataset
test('explorador distingue porcentajes originales de índices, conservando agrupaciones y nulos',()=>{
  const row=data.rows.find(r=>r.codigo_dominio_em==='802')!
  assert.equal(explorerValue(row,data,'raw:pct_deficit_cualitativo'),row.pct_deficit_cualitativo)
  assert.equal(explorerValue(row,data,'necesidad'),row.indice_necesidad_exploratorio_4dim)
  assert.equal(explorerValue({...row,pct_deficit_cualitativo:null},data,'raw:pct_deficit_cualitativo'),null)
  assert.ok(availableIndicators(data).some(i=>i.key==='raw:pct_pobreza_multidimensional_hogares'))
  assert.ok(!availableIndicators({...data,columns:[]}).some(i=>i.key.startsWith('raw:')))
})
test('filtro de líneas mantiene faltantes separados de cero y verifica integralidad real',()=>{
  assert.equal(data.rows.filter(r=>presenceFilter(r,data,'5')).length,9)
  assert.ok(data.rows.filter(r=>presenceFilter(r,data,'0')).every(r=>r.lineas_con_registro_publicado===0))
  const missing={...data.rows[0]!,barrios_registros_publicados:null}
  assert.equal(presenceFilter(missing,data,'0'),false)
  assert.equal(presenceFilter(missing,data,'1'),false)
  assert.equal(presenceFilter(missing,data,''),true)
})
