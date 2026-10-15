import {chromium} from '@playwright/test'
import {createServer} from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
const root=path.resolve('.output/public')
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname))
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.geojson':'application/json','.png':'image/png'})[path.extname(file)]||'application/octet-stream')
  res.end(await fs.readFile(file))
 }catch{res.writeHead(404).end()}
})
await new Promise(resolve=>server.listen(4175,'127.0.0.1',resolve))
let browser
try{
 browser=await chromium.launch({executablePath:process.argv[2],headless:true})
 const page=await browser.newPage({viewport:{width:1440,height:1000}})
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.goto('http://127.0.0.1:4175/')
 await page.waitForSelector('.leaflet-overlay-pane path')
 await fs.mkdir('artifacts/reports',{recursive:true})
 async function report(name){
  const download=page.waitForEvent('download')
  await page.getByRole('button',{name:'Descargar reporte PDF',exact:true}).click()
  const file=await download
  const dest='artifacts/reports/'+name+'.pdf'
  await file.saveAs(dest)
  const data=await fs.readFile(dest)
  assert.ok(data.subarray(0,8).toString().startsWith('%PDF-1.4'))
  assert.ok(data.length>10000)
  const text=data.toString('latin1')
  assert.ok(text.includes('¿Qué nos dice tu selección?'))
  assert.ok(text.includes('Necesidad frente a presencia'))
  if(name==='general'){assert.ok(text.includes('84.274'));assert.ok(text.includes('2.801.128'))}
  if(name==='localidad'){assert.ok(text.includes('Resumen de Antonio Nariño'));assert.ok(text.includes('28.218'))}
  if(name==='upz'){assert.ok(text.includes('Ciudad Jardín'));assert.ok(text.includes('Ficha individual seleccionada'))}
  assert.equal(await file.failure(),null)
  assert.ok(!await page.locator('[role="alert"]').count())
 }
 await report('general')
 await page.getByLabel('Localidad del mapa',{exact:true}).selectOption('Antonio Nariño')
 await page.waitForFunction(()=>document.querySelectorAll('.leaflet-overlay-pane path').length===2)
 await report('localidad')
 await page.getByLabel('Incluir territorio Restrepo',{exact:true}).uncheck()
 await page.waitForFunction(()=>document.querySelectorAll('.leaflet-overlay-pane path').length===1)
 await report('seleccion')
 await page.getByRole('button',{name:'Seleccionar territorio Ciudad Jardín',exact:true}).click()
 await report('upz')
 await page.getByLabel('Seleccionar todos los territorios',{exact:true}).check()
 await page.getByLabel('Seleccionar todos los territorios',{exact:true}).uncheck()
 await page.waitForFunction(()=>document.querySelectorAll('.leaflet-overlay-pane path').length===0)
 assert.equal(await page.getByRole('button',{name:'Descargar reporte PDF',exact:true}).isDisabled(),true)
 assert.equal(errors.length,0,errors.join('\n'))
 console.log('PDF reports passed: general, locality, subset, individual and empty selection.')
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
