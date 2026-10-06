import fs from 'node:fs/promises'
import path from 'node:path'
import Papa from 'papaparse'
const [input, mapping, output = 'public/data/dataset.json'] = process.argv.slice(2)
if (!input || !mapping) throw new Error('Uso: npm run convert -- archivo.csv esquema.json [salida.json]')
const config = JSON.parse(await fs.readFile(mapping, 'utf8'))
const text = await fs.readFile(input, 'utf8')
const parsed = Papa.parse(text.replace(/^\uFEFF/, ''), { header: true, skipEmptyLines: 'greedy' })
if (parsed.errors.length) throw new Error(JSON.stringify(parsed.errors))
const columns = parsed.meta.fields
if (Object.keys(parsed.meta.renamedHeaders || {}).length) throw new Error('Encabezados duplicados')
if (!columns?.length || new Set(columns).size !== columns.length) throw new Error('Encabezados vacíos o duplicados')
for (const key of ['codigo','nombre','localidad','tipo']) if (!config.schema?.[key]) throw new Error(`Asigna ${key} en el esquema`)
for (const column of Object.values(config.schema).filter(c => !['alta','baja'].includes(c))) if (!columns.includes(column)) throw new Error(`Columna inexistente: ${column}`)
for (const [key,column] of Object.entries(config.schema)) {
  if (key.startsWith('direccion_')) continue
  const identity=['codigo','nombre','localidad','tipo','fuente','corte','limitaciones'].includes(key)
  if (identity && config.numericColumns?.includes(column)) throw new Error(`Preserva como texto la columna ${column}`)
  if (!identity && !config.numericColumns?.includes(column)) throw new Error(`Declara ${column} en numericColumns`)
}
const rows = parsed.data.map((r, i) => Object.fromEntries(columns.map(k => {
  const raw = r[k]
  if (raw === undefined || raw.trim() === '') return [k, null]
  if (!config.numericColumns?.includes(k)) return [k, raw]
  const normalized = raw.trim().replace(',', '.')
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(normalized) || !Number.isFinite(Number(normalized))) throw new Error(`Número inválido, fila ${i+2}, columna ${k}`)
  return [k, Number(normalized)]
})))
const codes=rows.map(r=>r[config.schema.codigo])
if(codes.some(c=>c===null) || new Set(codes).size!==codes.length) throw new Error('Códigos de dominio vacíos o duplicados; se requiere una fila por dominio')
await fs.mkdir(path.dirname(output), { recursive: true })
await fs.writeFile(output, JSON.stringify({ columns, rows, schema: config.schema, source: config.source, status: 'ready' }, null, 2))
await fs.copyFile(input, path.join(path.dirname(output), 'original.csv'))
console.log(`${rows.length} filas y ${columns.length} columnas convertidas; nulos y códigos preservados.`)
