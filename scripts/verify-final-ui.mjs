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
  const banner=page.locator('.overview-banner');
  await banner.locator('img').evaluate(img=>img.decode());
  assert.match(await banner.locator('img').getAttribute('src'),/images\/bogota_urbana-mejorada\.webp$/);
  assert.equal(await banner.locator('img').evaluate(img=>img.naturalWidth),2058);
  assert.equal(await banner.locator('h1').evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)');
  assert.equal(await banner.locator('.overview-banner-brand').evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)');
  assert.equal(await banner.locator('p').evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)');
  assert.equal(await page.locator('main h1').count(),1);
  assert.equal(await banner.getByRole('heading',{level:1}).innerText(),'UBiK2 · Observatorio territorial');
  assert.equal(await banner.locator('p').innerText(),'Datos para comprender y transformar el territorio de Bogotá.');
  assert.equal(await banner.locator('button,a').count(),0);
  assert.equal(await banner.evaluate(el=>getComputedStyle(el).position),'relative');
  const desktopBanner=await banner.boundingBox();
  assert.ok(desktopBanner.height>=260 && desktopBanner.height<=300);
  assert.equal(await banner.locator('img').evaluate(el=>getComputedStyle(el).animationDuration),'4s');
  assert.equal(await banner.locator('img').evaluate(el=>getComputedStyle(el).animationIterationCount),'1');
  assert.equal(await banner.locator('.overview-banner-content').evaluate(el=>getComputedStyle(el).animationDuration),'0.6s');
  assert.ok(desktopBanner.y<(await page.locator('.territory-results').boundingBox()).y);
  await banner.screenshot({path:'artifacts/panorama-banner-desktop.png'});
  assert.ok(!/\bdominios?\b/i.test(await page.locator('body').innerText()));
  assert.equal(await page.getByRole('heading',{name:'¿Qué nos cuentan estos datos?'}).isVisible(),true);
  await page.getByRole('button',{name:/1. Elige un territorio/}).click();
  assert.equal(await page.locator('#explorar-territorio').evaluate(el=>document.activeElement===el),true);
  await page.getByRole('button',{name:'Empieza aquí · guía de uso',exact:true}).click();
  assert.equal(await page.getByRole('dialog').getByText('Tu primera consulta, en cuatro pasos').isVisible(),true);
  await page.getByRole('dialog').getByText('Diccionario rápido:',{exact:false}).click();
  assert.ok(!/\bdominios?\b/i.test(await page.getByRole('dialog').innerText()));
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
  assert.match(await page.locator('.territory-results').innerText(),/Resumen de tu selección/);
  assert.ok(!/Lucero|Sin dato/.test(await page.locator('.territory-results').innerText()));
  assert.equal(await page.getByLabel('Indicador del mapa',{exact:true}).locator('option').count(),14);
  assert.equal(await page.getByLabel('Indicador del mapa',{exact:true}).locator('option[value^="final:brecha_"]').count(),0);
  const gapSelect=page.getByLabel('Brecha por línea',{exact:true});
  for(const field of ['brecha_tenencia','brecha_vivienda','brecha_entorno','brecha_riesgo']){
    await gapSelect.selectOption('final:'+field);
    assert.equal(await page.getByLabel('Indicador del mapa',{exact:true}).inputValue(),'final:brecha');
    assert.equal(await gapSelect.inputValue(),'final:'+field);
    await page.waitForFunction(()=>document.querySelector('.map-legend')?.classList.contains('gap-legend'));
    await page.waitForFunction(()=>[...document.querySelectorAll('.leaflet-overlay-pane path')].every(p=>['#FFF1A6','#FFDE09','#F7B325','#E3351F','#AA1023','#C4C4C4'].includes(p.getAttribute('fill'))));
    assert.match(await page.locator('.map-legend i').getAttribute('style'),/255, 222, 9|FFDE09/i);
    assert.equal(await page.locator('.leaflet-overlay-pane path').count(),95);
    assert.match(await page.locator('.overview-comparison th.gap-column').innerText(),/Brecha/);
  }
  await page.getByRole('button',{name:'Restablecer filtros',exact:true}).click();
  assert.equal(await gapSelect.inputValue(),'final:brecha');
  await page.getByLabel('Localidad del mapa',{exact:true}).selectOption('Barrios Unidos');
  assert.equal(await page.locator('.upz-check-options input:checked').count(),3);
  await page.getByLabel('Incluir territorio Los Alcázares',{exact:true}).uncheck();
  await page.waitForFunction(()=>document.querySelectorAll('.leaflet-overlay-pane path').length===2);
  await page.getByLabel('Seleccionar todos los territorios',{exact:true}).check();
  await page.waitForFunction(()=>document.querySelectorAll('.leaflet-overlay-pane path').length===3);
  await page.waitForFunction(()=>document.querySelector('.territory-results')?.textContent.includes('Resumen de Barrios Unidos'));
  assert.ok(!/Sin dato/.test(await page.locator('.territory-results').innerText()));
  assert.match(await page.locator('.overview-territory').innerText(),/RESUMEN DE LA LOCALIDAD.*Barrios Unidos/s);
  assert.ok(!/[-−]1 a 1/.test(await page.locator('.overview-territory .territory-highlight').innerText()));
  assert.match(await page.locator('.territory-charts').innerText(),/Resumen de Barrios Unidos.*Necesidad frente a presencia.*Condiciones de los hogares/s);
  assert.match(await page.locator('.overview-territory').innerText(),/Presencia CVP.*Mejoramiento de Vivienda.*Titulación Predial/s);
  assert.ok(!/Sin dato/.test(await page.locator('.overview-territory').innerText()));
  await page.getByRole('button',{name:'Seleccionar territorio Los Alcázares',exact:true}).click();
  assert.match(await page.locator('.overview-territory').innerText(),/TERRITORIO SELECCIONADO.*Los Alcázares/s);
  await page.getByRole('button',{name:'Volver al resumen',exact:true}).click();
  assert.match(await page.locator('.overview-territory').innerText(),/RESUMEN DE LA LOCALIDAD/s);
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
  assert.match(await page.locator('.overview-territory').innerText(),/RESUMEN DE LA LOCALIDAD/);
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
  assert.equal(await page.getByRole('button',{name:'Descargar resultados',exact:true}).count(),0);
  assert.ok(!/\bdominios?\b/i.test(await page.locator('.method-timeline').innerText()));
  await page.getByRole('button',{name:'04 De qué años son los registros',exact:true}).click();
  assert.equal(await page.locator('#method-stage-4').evaluate(el=>document.activeElement===el),true);
  await page.waitForFunction(()=>document.querySelector('#method-stage-4')?.classList.contains('stage-entered'));
  assert.equal(await page.locator('.final-sources tbody tr').count(),8);
  assert.match(await page.locator('.methodology .method-grid').innerText(),/Cómo resumimos tu selección.*Qué significa un cero o un dato faltante/s);
  assert.match(await page.locator('.footer').innerText(),/Archivo final · lectura exploratoria/);
  assert.match(await page.locator('.methodology .method-grid').innerText(),/Cómo hacemos comparables los datos.*Cómo leemos los índices y la brecha.*De qué años son los registros.*Qué muestra el mapa.*De dónde vienen y hasta dónde llegan/s);
  assert.equal(await page.locator('.sources:not(.final-sources)').count(),0);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.getByRole('button',{name:'01 Qué territorios miramos',exact:true}).click();
  assert.equal(await page.locator('#method-stage-1').evaluate(el=>getComputedStyle(el).animationName),'none');
  await page.screenshot({path:'artifacts/methodology-timeline-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  await page.getByRole('button',{name:'08 Qué significa un cero o un dato faltante',exact:true}).click();
  assert.equal(await page.locator('#method-stage-8').evaluate(el=>document.activeElement===el),true);
  await page.screenshot({path:'artifacts/methodology-timeline-mobile.png',fullPage:true});
  await page.setViewportSize({width:1440,height:1000});
  await page.goto('http://127.0.0.1:4174/')
  await page.waitForSelector('.leaflet-overlay-pane path')
  await page.setViewportSize({width:390,height:844})
  assert.equal(await banner.locator('img').evaluate(el=>getComputedStyle(el).animationName),'none');
  assert.equal(await banner.locator('.overview-banner-content').evaluate(el=>getComputedStyle(el).animationName),'none');
  await banner.scrollIntoViewIfNeeded();
  const mobileBanner=await banner.boundingBox();
  assert.ok(mobileBanner.height>=130 && mobileBanner.height<=180);
  assert.ok(await banner.evaluate(el=>{const box=el.getBoundingClientRect(),text=el.querySelector('.overview-banner-content').getBoundingClientRect();return text.left>=box.left && text.right<=box.right && text.top>=box.top && text.bottom<=box.bottom}));
  await banner.screenshot({path:'artifacts/panorama-banner-mobile.png'});
  await page.setViewportSize({width:320,height:740});
  await banner.locator('h1').evaluate(el=>el.style.fontSize='48px');
  await banner.locator('p').evaluate(el=>el.style.fontSize='26px');
  assert.ok(await banner.evaluate(el=>{const box=el.getBoundingClientRect(),text=el.querySelector('.overview-banner-content').getBoundingClientRect();return text.left>=box.left && text.right<=box.right && text.top>=box.top && text.bottom<=box.bottom}));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  await banner.locator('h1,p').evaluateAll(els=>els.forEach(el=>el.style.removeProperty('font-size')));
  await page.setViewportSize({width:390,height:844});
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
  const preliminary=await browser.newPage({viewport:{width:390,height:844}});
  await preliminary.route('**/data/final-dataset.json',async route=>{
    const data=JSON.parse(await fs.readFile('public/data/final-dataset.json','utf8'));
    delete data.status;
    await route.fulfill({json:data});
  });
  await preliminary.goto('http://127.0.0.1:4174/');
  await preliminary.locator('.overview-banner').waitFor();
  assert.equal(await preliminary.getByText('Observatorio territorial · Datos preliminares sujetos a validación',{exact:true}).count(),1);
  assert.equal(await preliminary.locator('.footer').isVisible(),true);
  await preliminary.close();
  console.log('Final UI passed: 95 polygons, legend, IDIGER toggle, filters, percentage units, cards, downloads and mobile render.')
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
