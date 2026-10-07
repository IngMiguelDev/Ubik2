import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import type { Dataset, Row } from '../app/types/data'
import { scenarioRows, scenarioValue } from '../app/utils/scenario'
import { availableIndicators } from '../app/utils/explorer'
const data=JSON.parse(fs.readFileSync('public/data/dataset.json','utf8')) as Dataset
const expected=JSON.parse(fs.readFileSync('tests/fixtures/scenario-reference.json','utf8')) as Row[]
test('escenario V1 reproduce los 95 resultados de referencia sin alterar campos originales ni validados',()=>{
  const before=JSON.stringify(data)
  const scenario=scenarioRows(data)
  assert.equal(scenario.size,95)
  for(const row of data.rows){
    const ref=expected.find(r=>String(r.codigo_dominio_em)===String(row.codigo_dominio_em))!
    for(const column of Object.keys(ref).filter(c=>c!=='codigo_dominio_em')){
      assert.ok(Math.abs(Number(scenario.get(row)![column])-Number(ref[column]))<0.00002,`${row.codigo_dominio_em}: ${column}`)
    }
  }
  assert.equal(JSON.stringify(data),before)
})
test('escenario conserva rangos al filtrar, propaga faltantes y no usa jefatura femenina como carencia',()=>{
  const row=data.rows.find(r=>r.nombre_dominio_em==='Corabastos')!
  assert.ok(Math.abs(scenarioValue(row,data,'scenario:gap')!-25.2)<.1)
  const changed={...data,rows:data.rows.map(r=>({...r,pct_jefatura_femenina:0}))}
  assert.equal(scenarioValue(changed.rows[0]!,changed,'scenario:need'),scenarioValue(data.rows[0]!,data,'scenario:need'))
  const missing={...data,rows:data.rows.map((r,i)=>i===0?{...r,[data.schema.tasa_barrios!]:null}:r)}
  assert.equal(scenarioValue(missing.rows[0]!,missing,'scenario:presence'),null)
  assert.equal(scenarioValue(missing.rows[0]!,missing,'scenario:gap'),null)
  const custom={...data,analysis:undefined}
  assert.equal(scenarioValue(row,custom,'scenario:need'),null)
  assert.ok(!availableIndicators(custom).some(i=>i.key.startsWith('scenario:')))
})
