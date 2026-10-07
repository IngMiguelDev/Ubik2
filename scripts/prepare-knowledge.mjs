import fs from 'node:fs/promises'
import {createHash} from 'node:crypto'
const content=await fs.readFile('public/data/intervenciones-barrios.geojson','utf8')
const geo=JSON.parse(content)
await fs.writeFile('data/intervention-properties.json',JSON.stringify({source:'intervencion_de_mejoramiento_de_barrios.geojson',sha256:createHash('sha256').update(content).digest('hex'),features:geo.features.map(f=>({properties:f.properties}))}))
console.log(`Propiedades originales preparadas: ${geo.features.length} elementos. No se derivaron cruces espaciales.`)
