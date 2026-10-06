export type Cell = string | number | null
export type Row = Record<string, Cell>
export const dimensions = ['tenencia', 'vivienda', 'entorno', 'riesgo'] as const
export const lines = [
  { key: 'barrios', label: 'Mejoramiento de Barrios', color: '#AA1023' },
  { key: 'vivienda', label: 'Mejoramiento de Vivienda', color: '#E3351F' },
  { key: 'curaduria', label: 'Curaduría Pública Social', color: '#F7B325' },
  { key: 'titulacion', label: 'Titulación Predial', color: '#C90B00' },
  { key: 'reasentamientos', label: 'Reasentamientos', color: '#887745' }
] as const
export type Schema = Record<string, string>
export interface Dataset { rows: Row[]; columns: string[]; schema: Schema; source: { name: string; date: string | null; license: string | null }; status?: string; analysis?: { kind: string; dimensionsScale: string; proposal: string; housingScope: string; periods: string } }
