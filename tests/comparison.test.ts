import {test} from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import type {Dataset} from '../app/types/data'
import {pairedData,pearson,comparisonMetrics} from '../app/utils/comparison'
const dataset=JSON.parse(fs.readFileSync('public/data/dataset.json','utf8')) as Dataset
test('dispersión conserva valores publicados y elimina solo pares incompletos',()=>{
  const points=pairedData(dataset.rows,dataset,'necesidad','registros_barrios')
  assert.equal(points.length,95)
  const first=dataset.rows[0]!
  assert.equal(points[0]?.x,first.indice_necesidad_exploratorio_4dim);assert.equal(points[0]?.y,first.barrios_registros_publicados)
  assert.equal(pairedData([{...first,barrios_registros_publicados:null}],dataset,'necesidad','registros_barrios').length,0)
  assert.ok(comparisonMetrics(dataset).some(m=>m.key==='tasa_barrios'&&m.unit==='Elementos / km²'))
})
test('Pearson distingue correlación perfecta, insuficiencia y dimensiones constantes',()=>{
  assert.equal(pearson([{x:1,y:2},{x:2,y:4},{x:3,y:6}]),1)
  assert.equal(pearson([{x:1,y:6},{x:2,y:4},{x:3,y:2}]),-1)
  assert.equal(pearson([{x:1,y:2},{x:2,y:4}]),null)
  assert.equal(pearson([{x:1,y:2},{x:1,y:4},{x:1,y:6}]),null)
})
