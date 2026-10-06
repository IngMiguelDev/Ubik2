import Papa from 'papaparse'
import type { Dataset, Row } from '../types/data'
export function parseCsv(text: string): Dataset {
  const parsed = Papa.parse<Record<string, string>>(text.replace(/^\uFEFF/, ''), { header: true, skipEmptyLines: 'greedy' })
  if (parsed.errors.length) throw new Error(`CSV inválido: ${parsed.errors[0]?.message}`)
  const columns = parsed.meta.fields || []
  if (Object.keys((parsed.meta as { renamedHeaders?: Record<string,string> }).renamedHeaders || {}).length) throw new Error('El CSV contiene encabezados duplicados.')
  if (!columns.length || new Set(columns).size !== columns.length) throw new Error('El CSV requiere encabezados únicos.')
  // Se preservan los textos y códigos; conversión numérica únicamente al asignar indicadores.
  return { rows: parsed.data.map(r => Object.fromEntries(columns.map(k => [k, r[k]?.trim() === '' ? null : r[k] ?? null])) as Row), columns, schema: {}, source: { name: 'CSV cargado localmente', date: null, license: null } }
}
export function numberColumn(rows: Row[], column: string) {
  return rows.map(r => {
    const raw = r[column]
    if (raw === null || raw === undefined) return { ...r, [column]: null }
    if (typeof raw === 'number') return r
    const clean = raw.trim().replace(',', '.')
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(clean)) throw new Error(`Valor no numérico en ${column}: ${raw}`)
    const num = Number(clean)
    if (!Number.isFinite(num)) throw new Error(`Valor fuera de rango en ${column}`)
    return { ...r, [column]: num }
  })
}
export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
}
export function exportRows(rows: Row[]) {
  // Evita fórmulas al abrir los resultados en una hoja de cálculo.
  return Papa.unparse(rows, { escapeFormulae: true })
}
