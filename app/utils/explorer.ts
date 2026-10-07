import type { Dataset, Row } from '../types/data'
import { integral, need, numeric, value } from './analytics'
import { scenarioValue } from './scenario'
export const explorerIndicators = [
  { key:'scenario:need', label:'1. Necesidad ajustada', description:'Escenario exploratorio: necesidad física 80 % y vulnerabilidad económica 20 %. Los pesos son una propuesta.', unit:'Puntos de índice · 0 a 100' },
  { key:'scenario:presence', label:'2. Presencia publicada CVP', description:'Promedio de cinco índices de densidad de registros publicados, con transformación logarítmica. No mide cobertura efectiva ni ejecución validada.', unit:'Puntos de índice · 0 a 100' },
  { key:'scenario:gap', label:'3. Brecha relativa', description:'Necesidad ajustada menos presencia publicada. Positiva: necesidad relativa mayor que presencia relativa. Negativa: la relación inversa, sin demostrar exceso de ayuda. Cero no significa necesidad resuelta.', unit:'Puntos de índice · −100 a 100' },
  { key:'scenario:vulnerability', label:'Vulnerabilidad económica', description:'Pobreza monetaria normalizada sobre todos los dominios originales. Es una aproximación económica y no una medida completa de vulnerabilidad.', unit:'Puntos de índice · 0 a 100' },
  { key:'tenencia', label:'Tenencia · índice relativo', description:'Dimensión de tenencia publicada en el CSV preliminar.', unit:'Índice relativo · 0–100' },
  { key:'vivienda', label:'Vivienda · índice relativo', description:'Dimensión de vivienda publicada en el CSV preliminar.', unit:'Índice relativo · 0–100' },
  { key:'entorno', label:'Entorno · índice relativo', description:'Dimensión de entorno publicada en el CSV preliminar.', unit:'Índice relativo · 0–100' },
  { key:'riesgo', label:'Riesgo reportado · índice relativo', description:'Dimensión de riesgo reportado publicada en el CSV preliminar. No equivale a clasificación técnica de amenaza del POT.', unit:'Índice relativo · 0–100' },
  { key:'raw:pct_jefatura_femenina', label:'Jefatura femenina', description:'Porcentaje de hogares con jefatura femenina. Es contexto diferencial y no se incorpora al índice preliminar. No indica cuántos de estos hogares están en pobreza.', unit:'% de hogares · EM 2021' },
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
  if (key.startsWith('scenario:')) return scenarioValue(row, dataset, key)
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
  return explorerIndicators.filter(i=>i.key.startsWith('scenario:') ? Boolean(dataset.analysis) : i.key.startsWith('raw:') ? dataset.columns.includes(i.key.slice(4)) : ['tenencia','vivienda','entorno','riesgo'].includes(i.key) ? Boolean(dataset.analysis && dataset.schema[i.key]) : true)
}
