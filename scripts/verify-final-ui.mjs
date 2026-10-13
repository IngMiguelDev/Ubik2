import { chromium } from '@playwright/test'
import { createServer } from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
const root=path.resolve('.output/public')
const server=createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)
    const file=path.resolve(root,`.${pathname==='/'?'/index.html':pathname}`)
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
    res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.geojson':'application/json'})[path.extname(file)]||'application/octet-stream')
    res.end(await fs.readFile(file))
  }catch{res.writeHead(404).end()}
})
await new Promise(resolve=>server.listen(4174,'127.0.0.1',resolve))
let browser
try{
  browser=await chromium.launch({channel:'msedge',headless:true})
  const page=await browser.newPage({viewport:{width:1440,height:1000}})
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto('http://127.0.0.1:4174/')
  await page.waitForSelector('.leaflet-overlay-pane path')
  assert.equal(await page.getByLabel('Indicador del mapa',{exact:true}).inputValue(),'final:brecha')
  assert.equal(await page.locator('.leaflet-overlay-pane path').count(),95)
  assert.match(await page.locator('.map-legend').innerText(),/Muy baja.*Baja.*Media.*Alta.*Muy alta/s)
  const overlay=page.getByRole('checkbox',{name:/Amenaza por movimientos/})
  await overlay.check()
  await page.waitForSelector('.leaflet-hazards-pane path')
  assert.equal(await page.locator('.leaflet-hazards-pane path').count(),2)
  await overlay.uncheck()
  await page.waitForFunction(()=>!document.querySelector('.leaflet-hazards-pane path'))
  await page.getByLabel('Localidad del mapa',{exact:true}).selectOption('Usaquén')
  await page.waitForFunction(()=>document.querySelectorAll('.leaflet-overlay-pane path').length===7)
  await page.getByLabel('Busca una UPZ o agrupación',{exact:true}).fill('Verbenal')
  await page.waitForFunction(()=>document.querySelectorAll('.leaflet-overlay-pane path').length===1)
  await page.getByLabel('Indicador del mapa',{exact:true}).selectOption('final:ind_vivienda')
  assert.match(await page.locator('.territory-highlight').innerText(),/8,19 %/)
  await page.getByLabel('Indicador del mapa',{exact:true}).selectOption('final:brecha')
  assert.match(await page.locator('.territory-highlight').innerText(),/0,352/)
  await page.getByRole('button',{name:/Ver ficha completa/}).click()
  await page.waitForSelector('.territory-card')
  assert.match(await page.locator('.territory-card').innerText(),/8,19 %/)
  assert.ok(!errors.length,errors.join('\n'))
  await page.goto('http://127.0.0.1:4174/')
  await page.waitForSelector('.leaflet-overlay-pane path')
  await page.setViewportSize({width:390,height:844})
  await page.screenshot({path:'artifacts/final-map-mobile.png',fullPage:true})
  for(const file of ['upz_brecha_95.geojson','diccionario_campos_upz_brecha_95.csv','idiger_amenaza_mm_urbano.geojson']){
    assert.equal((await page.request.get(`http://127.0.0.1:4174/data/${file}`)).status(),200)
  }
  console.log('Final UI passed: 95 polygons, legend, IDIGER toggle, filters, percentage units, cards, downloads and mobile render.')
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
