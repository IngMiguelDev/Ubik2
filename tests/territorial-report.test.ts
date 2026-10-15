import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import type { Dataset } from '../app/types/data'
import { reportData, type ReportScope } from '../app/utils/territorial-report'
const dataset=JSON.parse(fs.readFileSync('public/data/final-dataset.json','utf8')) as Dataset
const scope:ReportScope={dataset,rows:dataset.rows,locality:'',metric:'final:brecha',metricLabel:'Brecha',presenceFilter:''}
test('report uses exact selection and individual values without mutating final rows',()=>{
 const before=JSON.stringify(dataset)
 const all=reportData(scope)
 assert.equal(all.result('hogares_muestra'),84274)
 assert.equal(all.result('viv_presencia'),402)
 assert.match(all.conclusion,/necesidad es mayor que el de presencia/)
 const lucero=dataset.rows.find(r=>r.cod_upz_grupo===67)!
 const individual=reportData({...scope,territory:lucero})
 assert.equal(individual.rows.length,1)
 assert.equal(individual.result('brecha'),lucero.brecha)
 assert.equal(individual.result('ind_vulnerabilidad'),Number(lucero.ind_vulnerabilidad)*100)
 assert.equal(JSON.stringify(dataset),before)
 const empty=reportData({...scope,rows:[]})
 assert.equal(empty.result('brecha'),null)
 assert.match(empty.conclusion,/Nos faltan datos/)
})
test('conclusions distinguish zero and negative gap without claiming resolved needs',()=>{
 for(const gap of [-.2,0]){
  const row={...dataset.rows[0]!,brecha:gap}
  const report=reportData({...scope,territory:row})
  assert.match(report.conclusion,gap<0?/no demuestra exceso/:/no significa que todos los hogares hayan recibido atención/)
 }
})
