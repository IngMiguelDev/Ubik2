import type { Dataset, Row } from '../types/data'
import { integral, need, numeric, value } from './analytics'
export const explorerIndicators = [
  { key:'raw:pct_deficit_cualitativo', label:'Viviendas con necesidades de mejora', description:'Hogares cuya vivienda requiere mejoras para superar el déficit cualitativo. No indica que deban cambiar de vivienda.', unit:'% de hogares · EM 2021' },
  { key:'raw:pct_deficit_cuantitativo', label:'Déficit cuantitativo de vivienda', description:'Hogares con déficit cuantitativo según el indicador publicado de la encuesta.', unit:'% de hogares · EM 2021' },
  { key:'raw:pct_tenencia_proxy', label:'Señales de dificultad en la tenencia', description:'Proxy publicado de tenencia. No es una certificación jurídica de propiedad.', unit:'% de hogares · EM 2021' },
  { key:'raw:pct_via_mala', label:'Vías en mal estado', description:'Condición de las vías reportada por los hogares.', unit:'% de hogares · EM 2021' },
  { key:'raw:pct_iluminacion_insuficiente', label:'Iluminación insuficiente', description:'Hogares que reportan iluminación insuficiente en su entorno.', unit:'% de hogares · EM 2021' },
  { key:'raw:pct_basuras_inadecuadas', label:'Problemas con basuras', description:'Hogares que reportan condiciones inadecuadas relacionadas con basuras.', unit:'% de hogares · EM 2021' },
  { key:'raw:pct_riesgo_reportado_alguno', label:'Inundación, derrumbe o hundimiento reportado', description:'Algún riesgo reportado por los hogares. No equivale a clasificación técnica de amenaza del POT.', unit:'% de hogares · EM 2021' },
  { key:'raw:pct_pobreza_monetaria_hogares', label:'Hogares con pobreza monetaria', description:'Pobreza monetaria como contexto de vulnerabilidad. Aún no está ponderada dentro del índice.', unit:'% de hogares · EM 2021' },
  { key:'raw:pct_pobreza_multidimensional_hogares', label:'Hogares con pobreza multidimensional', description:'Pobreza multidimensional como contexto, sin sustituir la dimensión transversal pendiente.', unit:'% de hogares · EM 2021' },
  { key:'necesidad', label:'Necesidad relativa · exploratoria', description:'Escenario preliminar con cuatro dimensiones y pesos iguales. Vulnerabilidad aún no incorporada.', unit:'Índice exploratorio · 0–100' },
  { key:'integralidad', label:'Líneas CVP con registros publicados', description:'Número de las cinco líneas con registros positivos. No mide intensidad ni cobertura efectiva.', unit:'Líneas · 0–5' }
]
export function explorerValue(row: Row, dataset: Dataset, key: string): number | null {
  if (key.startsWith('raw:')) return numeric(row[key.slice(4)])
  if (key === 'necesidad') return need(row,dataset.rows,dataset.schema)
  if (key === 'integralidad') return integral(row,dataset.schema)
  return numeric(value(row,dataset.schema,key))
}
export function presenceFilter(row: Row, dataset: Dataset, filter: string) {
  if (!filter) return true
  const n=integral(row,dataset.schema)
  if(n===null)return false
  return filter==='0' ? n===0 : n>=Number(filter)
}
export function availableIndicators(dataset: Dataset) {
  return explorerIndicators.filter(i=>i.key.startsWith('raw:') ? dataset.columns.includes(i.key.slice(4)) : true)
}
