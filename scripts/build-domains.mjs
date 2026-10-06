import fs from 'node:fs/promises'
const dataset=JSON.parse(await fs.readFile('public/data/dataset.json','utf8'))
const raw=JSON.parse((await fs.readFile('public/data/upz-oficiales.geojson','utf8')).replace(/^\uFEFF/,''))
if(raw.type!=='FeatureCollection' || raw.exceededTransferLimit) throw new Error('Descarga UPZ incompleta')
const codes=new Map()
for(const f of raw.features) {
  const code=f.properties.UPLCODIGO
  if(!/^UPZ\d+$/.test(code) || f.properties.UPLTIPO!==1 || !['Polygon','MultiPolygon'].includes(f.geometry.type)) throw new Error('Geometría o código UPZ inesperado')
  const parts=f.geometry.type==='Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
  codes.set(code,[...(codes.get(code)||[]),...parts])
}
const used=new Set()
const features=dataset.rows.map(r=>{
  const members=r.codigos_upz.split('|')
  const polygons=members.flatMap(c=>{
    if(used.has(c)) throw new Error(`UPZ ${c} asignada a más de un dominio`)
    used.add(c)
    if(!codes.has(`UPZ${c}`)) throw new Error(`Falta geometría oficial de UPZ ${c}`)
    return codes.get(`UPZ${c}`)
  })
  return {type:'Feature',properties:{codigo_dominio_em:r.codigo_dominio_em,nombre_dominio_em:r.nombre_dominio_em,tipo_dominio:r.tipo_dominio,codigos_upz:r.codigos_upz},geometry:{type:'MultiPolygon',coordinates:polygons}}
})
const provenance={source:'Secretaría Distrital de Planeación / servicio Catastro Distrital',url:'https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/ordenamientoterritorial/unidadplaneamiento/MapServer/55',downloadedAt:'2026-10-06',license:'CC BY 4.0 (ficha IDECA)',crs:'EPSG:4326',sourceFeatures:raw.features.length,domains:features.length,memberUpz:used.size,method:'Multipartes oficiales agrupadas por codigos_upz del CSV; se preservan los límites internos, sin desagregar indicadores.',limitation:'Correspondencia por códigos verificada; equivalencia exacta con límites históricos EM 2021 pendiente de validación SIG.'}
await fs.writeFile('public/data/dominios.geojson',JSON.stringify({type:'FeatureCollection',features}))
await fs.writeFile('public/data/geometry-provenance.json',JSON.stringify(provenance,null,2))
console.log(`${features.length} dominios completos; ${used.size} UPZ integrantes; ninguna clave faltante ni duplicada.`)
