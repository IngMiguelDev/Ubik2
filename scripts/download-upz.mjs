import fs from 'node:fs/promises'
const url='https://serviciosgis.catastrobogota.gov.co/arcgis/rest/services/ordenamientoterritorial/unidadplaneamiento/MapServer/55/query?where=UPLTIPO%3D1&outFields=UPLCODIGO%2CUPLNOMBRE%2CUPLTIPO&outSR=4326&f=geojson'
const response=await fetch(url,{signal:AbortSignal.timeout(30000)})
if(!response.ok) throw new Error(`Descarga oficial: HTTP ${response.status}`)
const data=await response.json()
if(data.type!=='FeatureCollection' || !data.features.length || data.exceededTransferLimit) throw new Error('Respuesta oficial vacía o incompleta')
await fs.writeFile('public/data/upz-oficiales.geojson',JSON.stringify(data))
console.log(`${data.features.length} geometrías oficiales descargadas en WGS84. Ejecuta build-domains.mjs y revisa el corte cartográfico.`)
