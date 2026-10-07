import type { Dataset, Row } from '../types/data'
import { lines } from '../types/data'
import { need, numeric, value } from './analytics'

export const scenarioKeys = ['scenario:need', 'scenario:presence', 'scenario:gap', 'scenario:vulnerability'] as const
const cache = new WeakMap<Dataset, Map<Row, Row>>()
export function scenarioRows(dataset: Dataset): Map<Row, Row> {
  if (!dataset.analysis) return new Map()
  const existing = cache.get(dataset)
  if (existing) return existing
  const normalize = (values: (number | null)[]) => {
    const valid = values.filter((v): v is number => v !== null)
    const lo = Math.min(...valid), hi = Math.max(...valid)
    return values.map(v => v === null ? null : hi === lo ? 0 : 100 * (v - lo) / (hi - lo))
  }
  const vulnerability = normalize(dataset.rows.map(r => numeric(value(r, dataset.schema, 'pobreza'))))
  const programs = lines.map(line => normalize(dataset.rows.map(r => {
    const rate = numeric(value(r, dataset.schema, `tasa_${line.key}`))
    return rate === null || rate < 0 ? null : Math.log1p(rate)
  })))
  const results = new Map<Row, Row>()
  dataset.rows.forEach((row, i) => {
    const physical = need(row, dataset.rows, dataset.schema), v = vulnerability[i] ?? null
    const components = programs.map(values => values[i] ?? null)
    const presence = components.every(c => c !== null) ? components.reduce<number>((sum, c) => sum + c!, 0) / 5 : null
    const adjusted = physical === null || v === null ? null : .8 * physical + .2 * v
    results.set(row, {
      indice_vulnerabilidad_economica_exploratorio: v,
      indice_necesidad_ajustado_vulnerabilidad_exploratorio: adjusted,
      indice_presencia_publicada_exploratorio: presence,
      brecha_relativa_exploratoria: adjusted === null || presence === null ? null : adjusted - presence,
      ...Object.fromEntries(lines.map((line, j) => [`indice_presencia_${line.key === 'reasentamientos' ? 'reasentamiento' : line.key}_publicada_exploratorio`, components[j]!]))
    })
  })
  cache.set(dataset, results)
  return results
}
export function scenarioValue(row: Row, dataset: Dataset, key: string): number | null {
  const columns: Record<string, string> = {
    'scenario:need': 'indice_necesidad_ajustado_vulnerabilidad_exploratorio',
    'scenario:presence': 'indice_presencia_publicada_exploratorio',
    'scenario:gap': 'brecha_relativa_exploratoria',
    'scenario:vulnerability': 'indice_vulnerabilidad_economica_exploratorio'
  }
  return numeric(scenarioRows(dataset).get(row)?.[columns[key] ?? ''])
}
