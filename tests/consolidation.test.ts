import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import type { Dataset } from '../app/types/data'
import { consolidatedValue } from '../app/utils/consolidation'
import { availableIndicators } from '../app/utils/explorer'
const dataset = JSON.parse(fs.readFileSync('public/data/final-dataset.json','utf8')) as Dataset
test('consolidation uses household weights, preserves gap identity and propagates missing data', () => {
  for (const rows of [dataset.rows, dataset.rows.filter(r => r.localidad === 'Barrios Unidos')]) {
    assert.ok(rows.length)
    const need = consolidatedValue(rows,dataset,'final:indice_necesidad')!
    const presence = consolidatedValue(rows,dataset,'final:indice_presencia')!
    const gap = consolidatedValue(rows,dataset,'final:brecha')!
    assert.ok(Math.abs(need-presence-gap)<1e-12)
    const weight = rows.reduce((s,r)=>s+Number(r.hogares_expandidos),0)
    const expected = rows.reduce((s,r)=>s+Number(r.ind_vulnerabilidad)*Number(r.hogares_expandidos),0)/weight*100
    assert.ok(Math.abs(consolidatedValue(rows,dataset,'final:ind_vulnerabilidad')!-expected)<1e-10)
  }
  assert.equal(consolidatedValue([],dataset,'final:brecha'),null)
  assert.equal(consolidatedValue([{...dataset.rows[0]!,hogares_expandidos:null}],dataset,'final:brecha'),null)
})
test('map has one option per analytical indicator without counts or detail components', () => {
  const keys=availableIndicators(dataset).map(i=>i.key)
  assert.equal(keys.length,18)
  assert.equal(new Set(keys).size,keys.length)
  assert.ok(keys.includes('final:ind_vulnerabilidad'))
  assert.ok(!keys.includes('final:viv_programado'))
  assert.ok(!keys.includes('final:ind_ten_sin_titulo'))
})

import { consolidatedField } from '../app/utils/consolidation'
test('locality totals, pooled rates and threat use the correct denominators', () => {
  const rows=[{hogares_expandidos:100,area_ha:10,pct_amenaza_alta:20,viv_presencia:2},{hogares_expandidos:300,area_ha:30,pct_amenaza_alta:60,viv_presencia:6}]
  assert.equal(consolidatedField(rows,dataset,'viv_presencia'),8)
  assert.equal(consolidatedField(rows,dataset,'viv_x1000hog'),20)
  assert.equal(consolidatedField(rows,dataset,'pct_amenaza_alta'),50)
  assert.equal(consolidatedField(rows,dataset,'prioridad'),null)
  assert.equal(consolidatedField([{...rows[0]!,viv_presencia:null}],dataset,'viv_presencia'),null)
})
