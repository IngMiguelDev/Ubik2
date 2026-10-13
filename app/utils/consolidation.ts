import type { Dataset, Row } from '../types/data'
import { numeric } from './analytics'
import { explorerValue } from './explorer'

/** Descriptive household-weighted summary; never recalculates territorial indices. */
export function consolidatedValue(rows: Row[], dataset: Dataset, key: string): number | null {
  if (dataset.status !== 'final' || !rows.length) return null
  let total = 0, households = 0
  for (const row of rows) {
    const weight = numeric(row.hogares_expandidos)
    const indicator = explorerValue(row, dataset, key)
    if (weight === null || weight <= 0 || indicator === null) return null
    total += weight * indicator
    households += weight
  }
  return total / households
}

/** Field-specific consolidation: additive totals, pooled rates, area-weighted threat. */
export function consolidatedField(rows: Row[], dataset: Dataset, field: string): number | null {
  if (dataset.status !== 'final' || !rows.length) return null
  const total = (column: string) => {
    const values = rows.map(row => numeric(row[column]))
    return values.some(v => v === null) ? null : values.reduce<number>((sum,v) => sum + v!,0)
  }
  const additive = ['area_ha','hogares_muestra','hogares_expandidos','viv_presencia','viv_programado','cps_presencia','tit_presencia','reas_presencia','reas_en_proceso','barrios_presencia','barrios_area_m2']
  if (additive.includes(field)) return total(field)
  if (field.endsWith('_x1000hog')) {
    const count = total(field.replace('_x1000hog','_presencia')), households = total('hogares_expandidos')
    return count === null || households === null || households <= 0 ? null : count / households * 1000
  }
  if (field.startsWith('pct_amenaza_')) {
    const area = total('area_ha')
    if (area === null || area <= 0) return null
    let weighted = 0
    for (const row of rows) {
      const percentage = numeric(row[field]), weight = numeric(row.area_ha)
      if (percentage === null || weight === null || weight < 0) return null
      weighted += percentage * weight
    }
    return weighted / area
  }
  if (field === 'integralidad') {
    const counts = ['viv_presencia','cps_presencia','tit_presencia','reas_presencia','barrios_presencia'].map(total)
    return counts.some(v => v === null) ? null : counts.filter(v => v! > 0).length
  }
  if ((field.startsWith('ind_') && !field.endsWith('_n')) || ['indice_necesidad','indice_presencia','brecha','brecha_tenencia','brecha_vivienda','brecha_entorno','brecha_riesgo'].includes(field)) {
    return consolidatedValue(rows,dataset,'final:' + field)
  }
  return null
}
