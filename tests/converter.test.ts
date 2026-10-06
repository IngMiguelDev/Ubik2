import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
test('conversor reproducible conserva tipos, nulos y el original',async()=> {
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'ubik2-test-'))
  const input=path.join(dir,'input.csv'), mapping=path.join(dir,'schema.json'), output=path.join(dir,'dataset.json'), original=path.join(dir,'original.csv')
  const text='id,nombre,loc,tipo,reg\n001,Prueba,L,Agrupación UPZ,2\n002,Otro,L,UPZ individual,\n'
  try {
    await fs.writeFile(input,text)
    await fs.writeFile(mapping,JSON.stringify({schema:{codigo:'id',nombre:'nombre',localidad:'loc',tipo:'tipo',registros_barrios:'reg'},numericColumns:['reg'],source:{name:'Prueba',date:null,license:null}}))
    execFileSync(process.execPath,['scripts/convert-csv.mjs',input,mapping,output])
    const data=JSON.parse(await fs.readFile(output,'utf8'))
    assert.equal(data.rows.length,2); assert.equal(data.rows[0].id,'001'); assert.equal(data.rows[0].reg,2); assert.equal(data.rows[1].reg,null); assert.equal(await fs.readFile(original,'utf8'),text)
  } finally { for(const f of [input,mapping,output,original]) await fs.rm(f,{force:true}); await fs.rmdir(dir) }
})
