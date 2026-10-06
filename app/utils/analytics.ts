import { dimensions, lines, type Row, type Schema } from '../types/data'
export const numeric = (v: unknown): number | null => typeof v === 'number' && Number.isFinite(v) ? v : null
export const value = (row: Row, schema: Schema, key: string) => schema[key] ? row[schema[key]!] ?? null : null
export const format = (v: unknown) => numeric(v) === null ? 'Sin dato' : new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(v as number)
export function total(rows: Row[], schema: Schema, key: string) {
  const nums = rows.map(r => numeric(value(r, schema, key))).filter((x): x is number => x !== null)
  return nums.length ? nums.reduce((a, b) => a + b, 0) : null
}
export function integral(row: Row, schema: Schema) {
  const vals = lines.map(l => numeric(value(row, schema, `registros_${l.key}`)))
  return vals.every(x => x !== null) ? vals.filter(x => x! > 0).length : null
}
export function need(row: Row, all: Row[], schema: Schema, scenario = 'equal'): number | null {
  let sum = 0, weights = 0
  for (const key of dimensions) {
    const v = numeric(value(row, schema, key))
    const direction = schema[`direccion_${key}`]
    if (v === null || !['alta', 'baja'].includes(direction || '')) return null
    const vals = all.map(r => numeric(value(r, schema, key))).filter((x): x is number => x !== null)
    const lo = Math.min(...vals), hi = Math.max(...vals)
    // Una dimensión constante no discrimina; no se inventa un rango.
    if (lo === hi) return null
    const normalized = direction === 'alta' ? (v - lo) / (hi - lo) : (hi - v) / (hi - lo)
    const w = (scenario === 'housing' && key === 'vivienda') || (scenario === 'risk' && key === 'riesgo') ? 2 : 1
    sum += normalized * w; weights += w
  }
  return 100 * sum / weights
}
export function filterRows(rows: Row[], schema: Schema, filters: { locality: string; domain: string; line: string; search: string }) {
  return rows.filter(r => (!filters.locality || String(value(r, schema, 'localidad')) === filters.locality) && (!filters.domain || String(value(r, schema, 'codigo')) === filters.domain) && (!filters.line || (numeric(value(r, schema, `registros_${filters.line}`)) ?? -1) > 0) && (!filters.search || Object.values(r).some(v => String(v ?? '').toLocaleLowerCase('es').includes(filters.search.toLocaleLowerCase('es')))))
}
