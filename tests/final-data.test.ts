import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import type { Dataset } from '../app/types/data'
import { availableIndicators, explorerValue } from '../app/utils/explorer'
import { filterRows, integral } from '../app/utils/analytics'
import { categoryColor, gapCategories } from '../app/utils/final-map'
const dataset = JSON.parse(fs.readFileSync('public/data/final-dataset.json','utf8')) as Dataset
const geo = JSON.parse(fs.readFileSync('public/data/upz_brecha_95.geojson','utf8'))
test('final data preserves all delivered fields and 95 geometries', () => {
  assert.equal(dataset.rows.length,95)
  assert.equal(new Set(dataset.rows.map(r=>r.cod_upz_grupo)).size,95)
  for (const [i,row] of dataset.rows.entries()) {
    for (const [key,v] of Object.entries(geo.features[i].properties)) assert.equal(row[key],v)
    assert.ok(Math.abs(Number(row.brecha)-(Number(row.indice_necesidad)-Number(row.indice_presencia)))<.00011)
    assert.equal(integral(row,dataset.schema),row.integralidad)
  }
})
test('map defaults to delivered gap and displays proportions only as percentages', () => {
  assert.equal(availableIndicators(dataset)[0]?.key,'final:brecha')
  const row=dataset.rows[0]!
  assert.equal(explorerValue(row,dataset,'final:brecha'),row.brecha)
  assert.equal(explorerValue(row,dataset,'final:indice_necesidad'),row.indice_necesidad)
  assert.equal(explorerValue(row,dataset,'final:ind_vivienda'),Number(row.ind_vivienda)*100)
  assert.equal(explorerValue(row,dataset,'final:pct_amenaza_alta'),row.pct_amenaza_alta)
  assert.equal(explorerValue({...row,ind_vivienda:null},dataset,'final:ind_vivienda'),null)
  assert.ok(!availableIndicators(dataset).some(i=>i.key.endsWith('_n')))
})
test('five fixed quintiles remain stable after filters; IDIGER includes high and medium threat', () => {
  for(const category of gapCategories) assert.equal(dataset.rows.filter(r=>r.categoria_brecha===category.label).length,19)
  assert.equal(categoryColor(null),'#C4C4C4')
  const selected=filterRows(dataset.rows,dataset.schema,{locality:'Usaquén',domain:'',line:'',search:''})
  assert.ok(selected.length>0)
  for(const row of selected) assert.equal(categoryColor(row.categoria_brecha),categoryColor(dataset.rows.find(r=>r.cod_upz_grupo===row.cod_upz_grupo)?.categoria_brecha))
  const hazard=JSON.parse(fs.readFileSync('public/data/idiger_amenaza_mm_urbano.geojson','utf8'))
  assert.deepEqual(new Set(hazard.features.map((f:any)=>f.properties.AMENAZA)),new Set(['Amenaza Alta','Amenaza Media']))
})
