import { chromium } from '@playwright/test'
import { createServer } from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
const root = path.resolve('.output/public')
const base=process.env.VERIFY_BASE_URL || '/'
const server = createServer(async(req,res)=> {
  try {
    const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname)
    if(!requested.startsWith(base)) {res.writeHead(404).end(); return}
    const pathname=`/${requested.slice(base.length)}`
    const file=path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`)
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return }
    const types={ '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png' }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(await fs.readFile(file))
  } catch { res.writeHead(404).end() }
})
await new Promise(resolve=>server.listen(4173,'127.0.0.1',resolve))
let browser, page
try {
  browser=await chromium.launch({ channel:'msedge', headless:true })
  page=await browser.newPage({ viewport: { width:1440,height:1100 } })
  const errors=[]; page.on('pageerror',e=>errors.push(e.stack||e.message))
  await page.goto(`http://127.0.0.1:4173${base}`)
  await page.getByText('95 dominios en la selección · 95 en el archivo',{exact:true}).waitFor()
  await page.locator('.chart canvas').first().waitFor()
  await fs.mkdir('artifacts', { recursive:true })
  await page.screenshot({ path:'artifacts/desktop.png', fullPage:true })
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true)
  await page.locator('nav').getByRole('link',{name:'Explorador geográfico',exact:true}).click()
  await page.getByText('Gris: sin dato · 95 geometrías coincidentes',{exact:true}).waitFor()
  await page.getByRole('checkbox',{name:'Superponer elementos de Barrios',exact:false}).check()
  await page.getByText('Azul: 557 elementos cartográficos',{exact:false}).waitFor()
  await page.screenshot({path:'artifacts/map-real.png',fullPage:true})
  await page.locator('.filter-panel').getByLabel('Localidad',{exact:true}).selectOption('Usaquén')
  await page.getByText('Azul: 17 elementos cartográficos',{exact:false}).waitFor()
  await page.getByRole('button',{name:'Limpiar filtros',exact:true}).click()
  await page.locator('nav').getByRole('link',{name:'Panorama territorial',exact:true}).click()
  await page.getByLabel('Dominio representativo',{exact:true}).selectOption('802')
  await page.getByRole('button',{name:'Ver ficha de KENNEDY: Castilla + Bavaria',exact:true}).click()
  await page.locator('.territory-card').getByText('grupo_UPZ',{exact:false}).waitFor()
  await page.locator('.territory-card').getByText('Pendiente de validación',{exact:true}).first().waitFor()
  await page.getByRole('button',{name:'Limpiar filtros',exact:true}).click()
  await page.setViewportSize({width:390,height:844})
  await page.getByRole('button',{name:'Abrir navegación',exact:true}).click()
  await page.locator('nav').getByRole('link',{name:'Panorama territorial',exact:true}).click()
  await page.waitForFunction(()=>document.querySelector('.sidebar').getBoundingClientRect().right<=0)
  await page.locator('.chart canvas').first().waitFor()
  await page.screenshot({path:'artifacts/mobile-real.png',fullPage:true})
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  await page.setViewportSize({width:1440,height:1100})
  await page.locator('nav').getByRole('link',{name:'Metodología y fuentes',exact:true}).click()
  // Archivo artificial de prueba; nunca se incorpora al conjunto público.
  const headers=['codigo','nombre','localidad','tipo','tenencia','vivienda','entorno','riesgo','barrios','mv','cps','tp','reas','brecha','ranking','ejec']
  const testRows=Array.from({length:12},(_,i)=>[String(i+1).padStart(3,'0'),`Dominio de prueba ${String(i+1).padStart(2,'0')}`,i<6?'Localidad A':'Localidad B',i%2?'Agrupación UPZ':'UPZ individual',i,12-i,i*2,i*3,i===0?0:i,1,2,3,4,'','',''])
  const csv=[headers.join(','),...testRows.map(r=>r.join(','))].join('\n')
  await page.locator('.methodology input[type=file]').setInputFiles({ name:'prueba.csv', mimeType:'text/csv', buffer:Buffer.from(csv) })
  await page.locator('.mapper').waitFor()
  for (const [label,column] of [['Código de dominio','codigo'],['Nombre del dominio','nombre'],['Localidad','localidad'],['Tipo de dominio','tipo'],['Dimensión: tenencia','tenencia'],['Dimensión: vivienda','vivienda'],['Dimensión: entorno','entorno'],['Dimensión: riesgo','riesgo'],['Registros: Mejoramiento de Barrios','barrios'],['Registros: Mejoramiento de Vivienda','mv'],['Registros: Curaduría Pública Social','cps'],['Registros: Titulación Predial','tp'],['Registros: Reasentamientos','reas'],['Brecha validada','brecha'],['Ranking validado','ranking'],['Actuaciones ejecutadas: Mejoramiento de Barrios','ejec']]) await page.locator('.mapper').getByLabel(label,{exact:true}).selectOption(column)
  for (const key of ['tenencia','vivienda','entorno','riesgo']) await page.getByLabel(`Mayor necesidad en ${key}`,{exact:true}).selectOption('alta')
  await page.getByRole('button',{ name:'Aplicar asignación',exact:true }).click()
  await page.locator('nav').getByRole('link',{name:'Panorama territorial',exact:true}).click()
  await page.getByText('Página 1 de 2',{exact:true}).waitFor()
  await page.getByRole('button',{name:'Página siguiente',exact:true}).click()
  await page.getByText('Página 2 de 2',{exact:true}).waitFor()
  await page.locator('.filter-panel').getByLabel('Localidad',{exact:true}).selectOption('Localidad A')
  await page.getByText('Resultados 1–6 de 6',{exact:true}).waitFor()
  await page.getByLabel('Línea misional',{exact:true}).selectOption('barrios')
  await page.getByText('Resultados 1–5 de 5',{exact:true}).waitFor()
  await page.getByLabel('Buscar territorio',{exact:true}).fill('inexistente')
  await page.getByText('No hay dominios en esta selección',{exact:true}).waitFor()
  await page.getByRole('button',{name:'Limpiar filtros',exact:true}).click()
  const downloadEvent=page.waitForEvent('download')
  await page.getByRole('button',{name:'Exportar resultados',exact:true}).click()
  const downloaded=await downloadEvent; await downloaded.saveAs('artifacts/filtered.csv')
  assert.equal((await fs.readFile('artifacts/filtered.csv','utf8')).split('\r\n').length,13)
  await page.getByRole('button',{name:'Ver ficha de Dominio de prueba 01',exact:true}).click()
  await page.locator('.territory-card').getByText('Pendiente de validación',{exact:true}).first().waitFor()
  await page.locator('nav').getByRole('link',{name:'Explorador geográfico',exact:true}).click()
  await page.getByText('Geometrías pendientes de verificación',{exact:true}).waitFor()
  // Polígono de prueba del dominio completo; solo ejercita el importador y no se publica.
  const geo={type:'FeatureCollection',features:[{type:'Feature',properties:{domain:'001'},geometry:{type:'Polygon',coordinates:[[[-74.12,4.6],[-74.10,4.6],[-74.10,4.62],[-74.12,4.62],[-74.12,4.6]]]}}]}
  await page.locator('input[accept=".geojson,.json"]').setInputFiles({name:'prueba.geojson',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(geo))})
  await page.getByLabel('Propiedad con código de dominio',{exact:true}).selectOption('domain')
  await page.getByLabel('Procedencia oficial / licencia',{exact:true}).fill('Procedencia ficticia solo para prueba automatizada')
  await page.getByRole('checkbox').check()
  await page.getByText('Gris: sin dato · 1 geometrías coincidentes',{exact:true}).waitFor()
  assert.equal(await page.locator('.leaflet-interactive').count(),1)
  await page.locator('.leaflet-interactive').click()
  await page.locator('.territory-card').getByRole('heading',{name:'Dominio de prueba 01',exact:true}).waitFor()
  await page.setViewportSize({width:390,height:844})
  await page.getByRole('button',{name:'Abrir navegación',exact:true}).click()
  await page.locator('nav').getByRole('link',{name:'Panorama territorial',exact:true}).click()
  await page.waitForFunction(()=>document.querySelector('.sidebar').getBoundingClientRect().right <= 0)
  await page.locator('.chart canvas').first().waitFor()
  await page.screenshot({path:'artifacts/mobile-loaded.png',fullPage:true})
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth),true)
  assert.deepEqual(errors,[])
  console.log('UI verificada: 95 dominios reales, 557 intervenciones (17 en Usaquén), ficha de agrupación, logo, escritorio/móvil; importación alternativa, filtros, paginación y descarga de 12 filas de prueba; sin errores JavaScript.')
} catch(e) { await page?.screenshot({path:'artifacts/failure.png',fullPage:true}); if(page) await fs.writeFile('artifacts/failure.html',await page.content()); throw e }
finally { await browser?.close(); await new Promise(resolve=>server.close(resolve)) }
