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
  browser=await chromium.launch({...(process.argv[2] ? {executablePath:process.argv[2]} : {channel:'msedge'}),headless:true})
  const page=await browser.newPage({viewport:{width:1440,height:1000}})
  const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto('http://127.0.0.1:4174/')
  await page.waitForSelector('.leaflet-overlay-pane path')
  assert.equal(await page.getByRole('heading',{name:'¿Qué nos cuentan estos datos?'}).isVisible(),true);
  await page.getByRole('button',{name:/1. Elige un territorio/}).click();
  assert.equal(await page.locator('#explorar-territorio').evaluate(el=>document.activeElement===el),true);
  await page.getByRole('button',{name:'Empieza aquí · guía de uso',exact:true}).click();
  assert.equal(await page.getByRole('dialog').getByText('Tu primera consulta, en cuatro pasos').isVisible(),true);
  await page.getByRole('dialog').getByText('Diccionario rápido:',{exact:false}).click();
  assert.equal(await page.getByRole('dialog').getByText('Unidad de Planeamiento Zonal:',{exact:false}).isVisible(),true);
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Empieza aquí · guía de uso',exact:true}).click();
  assert.equal(await page.getByRole('dialog',{name:'Cómo leer los datos'}).isVisible(),true);
  var centered=await page.getByRole('dialog',{name:'Cómo leer los datos'}).boundingBox();
  assert.ok(Math.abs(centered.x+centered.width/2-page.viewportSize().width/2)<2);
  assert.ok(Math.abs(centered.y+centered.height/2-page.viewportSize().height/2)<2);
  assert.equal(await page.getByRole('dialog').getByAltText('UBiK2').isVisible(),true);
  await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog',{name:'Cómo leer los datos'}).isVisible(),false);
  assert.match(await page.locator('.territory-results').innerText(),/Consolidado general/);
  assert.ok(!/Lucero|Sin dato/.test(await page.locator('.territory-results').innerText()));
  assert.equal(await page.getByLabel('Indicador del mapa',{exact:true}).locator('option').count(),14);
  await page.getByLabel('Localidad del mapa',{exact:true}).selectOption('Barrios Unidos');
  assert.equal(await page.locator('.upz-check-options input:checked').count(),3);
  await page.getByLabel('Incluir territorio Los Alcázares',{exact:true}).uncheck();
  await page.waitForFunction(()=>document.querySelectorAll('.leaflet-overlay-pane path').length===2);
  await page.getByLabel('Seleccionar todos los territorios',{exact:true}).check();
  await page.waitForFunction(()=>document.querySelectorAll('.leaflet-overlay-pane path').length===3);
  await page.waitForFunction(()=>document.querySelector('.territory-results')?.textContent.includes('Consolidado de Barrios Unidos'));
  assert.ok(!/Sin dato/.test(await page.locator('.territory-results').innerText()));
  assert.match(await page.locator('.overview-territory').innerText(),/CONSOLIDADO DE LA LOCALIDAD.*Barrios Unidos/s);
  assert.ok(!/[-−]1 a 1/.test(await page.locator('.overview-territory .territory-highlight').innerText()));
  assert.match(await page.locator('.territory-charts').innerText(),/Consolidado de Barrios Unidos.*Necesidad frente a presencia.*Condiciones de los hogares/s);
  assert.match(await page.locator('.overview-territory').innerText(),/Presencia CVP.*Mejoramiento de Vivienda.*Titulación Predial/s);
  assert.ok(!/Sin dato/.test(await page.locator('.overview-territory').innerText()));
  await page.getByRole('button',{name:'Seleccionar territorio Los Alcázares',exact:true}).click();
  assert.match(await page.locator('.overview-territory').innerText(),/TERRITORIO SELECCIONADO.*Los Alcázares/s);
  await page.getByRole('button',{name:'Limpiar selección territorial',exact:true}).click();
  assert.match(await page.locator('.overview-territory').innerText(),/CONSOLIDADO DE LA LOCALIDAD/s);
  await page.getByLabel('Localidad del mapa',{exact:true}).selectOption('');
  await page.waitForFunction(()=>document.querySelectorAll('.leaflet-overlay-pane path').length===95);
  assert.equal(await page.getByLabel('Indicador del mapa',{exact:true}).inputValue(),'final:brecha')
  assert.equal(await page.locator('.leaflet-overlay-pane path').count(),95)
  assert.match(await page.locator('.map-legend').innerText(),/Muy baja.*Baja.*Media.*Alta.*Muy alta/s)
  const overlay=page.getByRole('checkbox',{name:/Amenaza por movimientos/})
  assert.equal(await page.locator('.overview-filters').getByRole('checkbox',{name:/Amenaza por movimientos/}).count(),1);
  assert.equal(await page.locator('.overview-date').count(),0);
  await overlay.check()
  await page.waitForSelector('.leaflet-hazards-pane path')
  assert.equal(await page.getByRole('group',{name:'Leyenda de amenaza por movimientos en masa'}).isVisible(),true)
  assert.match(await page.locator('.hazard-legend').innerText(),/Amenaza alta.*Amenaza media/s)
  assert.equal(await page.locator('.leaflet-hazards-pane path').count(),2)
  await page.getByRole('button',{name:'Restablecer filtros',exact:true}).click()
  assert.equal(await overlay.isChecked(),false)
  assert.equal(await page.locator('.hazard-legend').count(),0)
  await page.waitForFunction(()=>!document.querySelector('.leaflet-hazards-pane path'))
  await page.getByLabel('Localidad del mapa',{exact:true}).selectOption('Usaquén')
  await page.waitForFunction(()=>document.querySelectorAll('.leaflet-overlay-pane path').length===7)
  assert.equal(await page.locator('.upz-check-options input:checked').count(),7);
  await page.getByLabel('Seleccionar todos los territorios',{exact:true}).uncheck();
  await page.waitForFunction(()=>document.querySelectorAll('.leaflet-overlay-pane path').length===0);
  await page.getByLabel('Buscar territorio',{exact:true}).fill('Verbenal');
  await page.getByLabel('Incluir territorio Verbenal',{exact:true}).check()
  await page.waitForFunction(()=>document.querySelectorAll('.leaflet-overlay-pane path').length===1)
  assert.match(await page.locator('.overview-territory').innerText(),/CONSOLIDADO DE LA LOCALIDAD/);
  assert.ok(!/TERRITORIO SELECCIONADO/.test(await page.locator('.overview-territory').innerText()));
  assert.ok(!/Sin dato/.test(await page.locator('.territory-results').innerText()));
  await page.getByRole('button',{name:'Seleccionar territorio Verbenal',exact:true}).click();
  assert.equal(await page.locator('.territory-result-cards>.stat').count(),4);
  assert.equal(await page.locator('.result-reading, .result-caveat, .result-details').count(),0);
  assert.match(await page.locator('.territory-results').innerText(),/Jefatura femenina/);
  await page.getByLabel('Indicador del mapa',{exact:true}).selectOption('final:ind_vivienda')
  assert.match(await page.locator('.territory-highlight').innerText(),/8,19 %/)
  await page.getByLabel('Indicador del mapa',{exact:true}).selectOption('final:brecha')
  assert.match(await page.locator('.territory-highlight').innerText(),/0,35/)
  await page.getByRole('button',{name:/Ver ficha completa/}).click()
  await page.waitForSelector('.territory-card')
  assert.match(await page.locator('.territory-card').innerText(),/8,19 %/)
  assert.ok(!errors.length,errors.join('\n'));
  await page.goto('http://127.0.0.1:4174/#metodologia');
  await page.waitForSelector('.final-sources table');
  assert.equal(await page.locator('.intro-notice, .filter-panel').count(),0);
  assert.equal(await page.getByText('Asignar columnas del CSV',{exact:false}).count(),0);
  assert.equal(await page.locator('.methodology .method-grid article').count(),8);
  assert.equal(await page.locator('.timeline-stage [role="img"]').count(),8);
  assert.equal(await page.getByRole('button',{name:'Exportar resultados',exact:true}).count(),0);
  assert.ok(!/\bdominios?\b/i.test(await page.locator('.method-timeline').innerText()));
  await page.getByRole('button',{name:'04 Temporalidad y unidades',exact:true}).click();
  assert.equal(await page.locator('#method-stage-4').evaluate(el=>document.activeElement===el),true);
  await page.waitForFunction(()=>document.querySelector('#method-stage-4')?.classList.contains('stage-entered'));
  assert.equal(await page.locator('.final-sources tbody tr').count(),8);
  assert.match(await page.locator('.methodology .method-grid').innerText(),/Consolidados y selección.*Ceros, faltantes y precisión/s);
  assert.match(await page.locator('.footer').innerText(),/Archivo final · lectura exploratoria/);
  assert.match(await page.locator('.methodology .method-grid').innerText(),/Indicadores y normalización.*Índices, brecha y posición.*Temporalidad y unidades.*Cartografía y alcance.*Procedencia y límites/s);
  assert.equal(await page.locator('.sources:not(.final-sources)').count(),0);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.getByRole('button',{name:'01 Unidad de análisis',exact:true}).click();
  assert.equal(await page.locator('#method-stage-1').evaluate(el=>getComputedStyle(el).animationName),'none');
  await page.screenshot({path:'artifacts/methodology-timeline-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  await page.getByRole('button',{name:'08 Ceros, faltantes y precisión',exact:true}).click();
  assert.equal(await page.locator('#method-stage-8').evaluate(el=>document.activeElement===el),true);
  await page.screenshot({path:'artifacts/methodology-timeline-mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('http://127.0.0.1:4174/')
  await page.waitForSelector('.leaflet-overlay-pane path')
  await page.setViewportSize({width:390,height:844})
  assert.equal(await page.getByRole('button',{name:'Empieza aquí · guía de uso',exact:true}).isVisible(),true);
  await page.getByRole('button',{name:'Empieza aquí · guía de uso',exact:true}).click();
  assert.equal(await page.getByRole('dialog').isVisible(),true);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  await page.setViewportSize({width:1440,height:1000});
  await page.screenshot({path:'artifacts/redesign-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  await page.screenshot({path:'artifacts/final-map-mobile.png',fullPage:true})
  for(const file of ['upz_brecha_95.geojson','diccionario_campos_upz_brecha_95.csv','idiger_amenaza_mm_urbano.geojson']){
    assert.equal((await page.request.get(`http://127.0.0.1:4174/data/${file}`)).status(),200)
  }
  console.log('Final UI passed: 95 polygons, legend, IDIGER toggle, filters, percentage units, cards, downloads and mobile render.')
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
