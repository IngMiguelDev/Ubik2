import { lines, type Dataset, type Row } from '../types/data'
import { format, need, numeric, total, value } from './analytics'

export interface AssistantItem { code: string; name: string; locality: string; value: number | null; grouped: boolean }
export interface AssistantAnswer {
  text: string; note: string; fields: string[]; items: AssistantItem[]; metric: string;
  scope: string; source: string; matchedCodes: string[];
}
export const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const contains = (query: string, phrase: string) => (` ${query} `).includes(` ${normalize(phrase)} `)
const model = 'Necesidad responde «¿cuánto necesita esta zona?» y se construye con la Encuesta Multipropósito. Presencia responde «¿cuánto ha llegado la Caja?» y se construye con las capas de las cinco direcciones. Brecha = necesidad − presencia. Las dos medidas deben ser comparables en escala, territorio y alcance antes de restarlas.'
const dimensionModel = 'Tenencia: propiedad legal → Urbanizaciones y Titulación. Vivienda: estado de la casa → Mejoramiento de Vivienda y Curaduría Pública Social. Entorno: condiciones del barrio → Mejoramiento de Barrios. Riesgo: peligro para la casa → Reasentamientos. Vulnerabilidad transversal: capacidad de los hogares para salir del problema por sus propios medios; pondera la necesidad total y ayuda a priorizar zonas con brechas parecidas, sin una dirección exclusiva.'

/** Consultas locales sobre columnas conocidas. No ejecuta código ni envía datos a servicios. */
export function askData(question: string, dataset: Dataset, selection: Row[], scope: 'all' | 'filtered', previousCodes: string[] = []): AssistantAnswer {
  const q = normalize(question), schema = dataset.schema
  const baseRows = scope === 'all' ? dataset.rows : selection
  const answer: AssistantAnswer = { text: '', note: '', fields: [], items: [], metric: '', scope: `${scope === 'all' ? 'Archivo completo' : 'Filtros actuales'} · ${baseRows.length} dominios`, source: dataset.source.name, matchedCodes: [] }
  const finish = (text: string, note = '') => ({ ...answer, text, note })
  const publishedNote = dataset.analysis ? 'El índice disponible es exploratorio de cuatro dimensiones (0–100), no una priorización institucional. Vulnerabilidad aún no está ponderada.' : 'Necesidad exploratoria calculada con las cuatro dimensiones configuradas. No es una priorización institucional.'
  if (!q) return finish('Escribe una pregunta para consultar los datos.')
  if (/\b(inventa|inventar|finge|fingir|ignora|ignorar|ejecuta|ejecutar)\b/.test(q)) return finish('Solo puedo consultar datos y explicar el modelo. No invento cifras ni ejecuto instrucciones contenidas en las preguntas.')
  if (/\b(que es|que significa|diferencia entre|como se calcula)\b/.test(q) && /\b(necesidad|presencia|brecha)\b/.test(q)) return finish(model, publishedNote)
  if (/\b(formula|modelo|dimensiones|dimension|atiende|atienden)\b/.test(q) && !/\b(mayor|menor|mas|menos|top|compara|comparar)\b/.test(q)) return finish(`${model}\n\n${dimensionModel}`, publishedNote)
  if (/\b(vulnerabilidad|vulnerables)\b/.test(q) && !/\b(pobreza|jefatura)\b/.test(q)) return finish(dimensionModel, 'El CSV aporta pobreza y jefatura femenina como contexto. No trae un índice transversal ni una regla validada de ponderación; no los sustituyo por vulnerabilidad.')
  if (/\b(fuente|fuentes|periodo|periodos|fecha|corte|encuesta)\b/.test(q)) {
    answer.fields = ['periodos_presencia', 'fecha_validacion'].filter(c => dataset.columns.includes(c))
    return finish(`Archivo: ${dataset.source.name}. ${dataset.analysis ? 'Necesidad: Encuesta Multipropósito 2021. Presencia publicada: registros de períodos heterogéneos, sin corte común.' : 'Consulta las columnas y la procedencia del archivo cargado; no se presupone su período.'} Fecha declarada: ${dataset.source.date || 'sin dato'}.`, 'La fecha declarada no acredita un corte temporal común de las actuaciones.')
  }

  // Selección territorial: códigos de dominio, UPZ integrantes y nombres explícitos.
  let rows = baseRows
  const explicitCodes = [...q.matchAll(/\b(?:upz|dominio|codigo)\s+(\d+)\b/g)].map(m => m[1]!)
  let matched: Row[] = []
  if (explicitCodes.length) {
    for (const code of explicitCodes) {
      const found = dataset.rows.filter(r => explicitCodes.includes(code) && (String(value(r, schema, 'codigo')) === code || String(r.codigos_upz ?? '').split('|').some(c => c.trim() === code)))
      if (!found.length) return finish(`No encuentro el código ${code} en el archivo. Usa un código de dominio o UPZ integrante disponible.`)
      matched.push(...found)
    }
  } else {
    matched = dataset.rows.filter(r => {
      const name = String(value(r, schema, 'nombre') ?? '')
      // Las partes de una agrupación identifican el dominio completo, nunca estimaciones individuales.
      const aliases = [name, ...(String(value(r, schema, 'tipo')) === 'grupo_UPZ' ? (name.split(':')[1] ?? '').split('+') : [])]
      return aliases.some(a => normalize(a).length > 2 && contains(q, a))
    })
    const localities = [...new Set(dataset.rows.map(r => String(value(r, schema, 'localidad') ?? '')).filter(Boolean))]
    const namedLocalities = localities.filter(l => contains(q, l))
    if (matched.length) {
      // Localidad puede coincidir con el nombre de una UPZ: «localidad de X» pide todos sus dominios.
      if (namedLocalities.some(l => contains(q, `localidad de ${l}`) || contains(q, `localidad ${l}`) || contains(q, `en ${l}`))) matched = dataset.rows.filter(r => namedLocalities.includes(String(value(r, schema, 'localidad'))))
    } else if (namedLocalities.length) matched = dataset.rows.filter(r => namedLocalities.includes(String(value(r, schema, 'localidad'))))
    else if (/\b(upz|dominio|localidad)\s+(?:de\s+)?[a-z0-9]+/.test(q) && !/\b(dominios|localidades)\b/.test(q)) return finish('No identifico ese territorio en el archivo. Prueba con su nombre completo o con «UPZ 46».')
    else if (/\b(necesidad|riesgo|tenencia|vivienda|entorno|brecha|presencia|pobreza) de /.test(q) && !/\bde (los dominios|las zonas|bogota|la seleccion|vivienda|barrios|titulacion|reasentamientos|curaduria)\b/.test(q)) return finish('No identifico el territorio solicitado. Usa su nombre completo o un código UPZ disponible.')
    else if (/\ben\s+/.test(q) && !/\ben (total|el archivo|la seleccion|los filtros|bogota|ejecucion|peligro|buen estado|estas zonas)\b/.test(q)) return finish('No identifico el territorio indicado después de «en». Usa un nombre de localidad o dominio disponible.')
  }
  if (matched.length) {
    const codes = new Set(matched.map(r => String(value(r, schema, 'codigo'))))
    rows = baseRows.filter(r => codes.has(String(value(r, schema, 'codigo'))))
    answer.scope += ` · territorio solicitado: ${rows.length} dominios`
  } else if (/^(y|ahora)\b/.test(q) && previousCodes.length) {
    rows = baseRows.filter(r => previousCodes.includes(String(value(r, schema, 'codigo'))))
    answer.scope += ' · territorios de la respuesta anterior'
  }
  answer.matchedCodes = rows.map(r => String(value(r, schema, 'codigo')))
  if (!rows.length) return finish('No hay dominios para esta consulta dentro del alcance seleccionado. Revisa los filtros o cambia a «Archivo completo».')
  if (/\b(19\d{2}|20\d{2}|desde|hasta|ultimo|ultimos|ano|anos|mes|meses)\b/.test(q)) return finish('No puedo filtrar actuaciones por año o intervalo con estos conteos agregados. Los períodos de presencia son heterogéneos; se necesitan fechas de las actuaciones para responder esa pregunta.')
  if (/\b(multidimensional|deficit|inundacion|derrumbe|hundimiento|escritura|propietarios)\b/.test(q) || (/\b(porcentaje|porcentajes)\b/.test(q) && /\b(tenencia|vivienda|entorno|riesgo)\b/.test(q))) return finish('Esa consulta pide un indicador original específico. Puedes consultarlo con su porcentaje y denominador en la ficha territorial. Aquí puedo comparar los índices relativos por dimensión, pobreza monetaria y jefatura femenina; no sustituyo un porcentaje original por un índice.')

  let key = '', label = '', counts = false
  if (/\b(brecha|brechas|falta|faltan)\b/.test(q)) { key = 'brecha'; label = 'Brecha validada' }
  else if (/\bindice de presencia\b|\bha llegado\b/.test(q) || (/\b(presencia)\b/.test(q) && !/\b(registros|publicada|publicados|titulacion|reasentamiento|reasentamientos|curaduria|barrios|mejoramiento)\b/.test(q))) { key = 'presencia_validada'; label = 'Índice de presencia validado' }
  else if (/\b(riesgo integrado|riesgo pot|amenaza)\b/.test(q)) { key = 'riesgo_integrado'; label = 'Índice de riesgo integrado validado' }
  else {
    const lineMatchers = [ /\b(barrios|barrio)\b/, /\b(mejoramiento de vivienda|plan terrazas)\b|\bvivienda\b/, /\b(curaduria)\b/, /\b(titulacion|titulos)\b/, /\b(reasentamiento|reasentamientos)\b/ ]
    const requested = lines.filter((_, i) => lineMatchers[i]!.test(q))
    const recordIntent = /\b(registros|actuaciones|publicados|publicadas|presencia|cuantos|cuantas|total|totales)\b/.test(q) || /\b(mejoramiento|titulacion|curaduria|reasentamientos?)\b/.test(q)
    if (requested.length > 1 && recordIntent) return finish('Consulta una línea misional por pregunta. Sus registros tienen unidades distintas y no se suman como hogares o beneficiarios únicos.')
    if (requested[0] && recordIntent) {
      if (/\b(tasa|tasas|porcentaje|porcentajes|promedio|media|ids|identificadores)\b/.test(q)) return finish('Esta consulta admite conteos de registros publicados de una línea. Las tasas y los IDs distintos pueden consultarse en la ficha de cada dominio; no los sustituyo por el total de registros.')
      if (/\b(ejecutadas|ejecutados|terminadas|terminados|beneficiarios|beneficiadas|beneficiados|cobertura|hogares|personas|casas|familias)\b/.test(q)) return finish('Los registros publicados no acreditan beneficiarios únicos, obras terminadas ni cobertura efectiva. Esa medida necesita definición y validación.', 'Mejoramiento de Vivienda está limitado a Plan Terrazas; asistencia técnica ejecutada no equivale a obra terminada.')
      key = `registros_${requested[0].key}`; label = `${requested[0].label} · registros publicados`; counts = true
    } else if (/\b(necesidad|necesita|necesitan)\b/.test(q)) { key = 'need'; label = 'Necesidad exploratoria · cuatro dimensiones · 0–100' }
    else if (/\b(tenencia|vivienda|entorno|riesgo)\b/.test(q)) { key = q.match(/\b(tenencia|vivienda|entorno|riesgo)\b/)![1]!; label = `${key[0]!.toUpperCase()}${key.slice(1)}${key === 'riesgo' && dataset.analysis ? ' reportado' : ''} · ${dataset.analysis ? 'dimensión relativa · 0–100' : 'valor original · unidad según diccionario'}` }
    else if (/\b(pobreza)\b/.test(q)) { key = 'pobreza'; label = 'Pobreza monetaria · % de hogares' }
    else if (/\b(jefatura|jefes|jefas)\b/.test(q)) { key = 'jefatura'; label = 'Jefatura femenina · % de hogares' }
  }
  if (!key) return finish('Puedo consultar necesidad exploratoria, sus cuatro dimensiones disponibles, pobreza monetaria, jefatura femenina y registros por línea. También explicar el modelo, la vulnerabilidad y los pendientes de presencia y brecha.', 'Ejemplos: «¿Cuáles son los 5 dominios con mayor necesidad?», «¿Cuántos registros de Barrios hay en Usaquén?» o «Compara la necesidad de UPZ 9 y UPZ 11». Cada pregunta usa el alcance indicado.')
  answer.metric = label
  answer.fields = key === 'need' ? (schema.necesidad_igual ? [schema.necesidad_igual] : ['tenencia','vivienda','entorno','riesgo'].map(k => schema[k]).filter((c): c is string => !!c)) : schema[key] ? [schema[key]!] : []
  const get = (r: Row) => key === 'need' ? need(r, dataset.rows, schema) : numeric(value(r, schema, key))
  const available = rows.filter(r => get(r) !== null)
  if (!available.length) return finish(`${label}: pendiente; no hay valores disponibles en los ${rows.length} dominios consultados.`, key === 'brecha' || key === 'presencia_validada' ? `${model} Los conteos publicados no sustituyen al índice de presencia. Su construcción está a cargo del equipo; no calculo una brecha a partir de conteos.` : 'Los nulos se conservan como datos faltantes, nunca como cero.')
  if (!counts && /\b(total|totales|promedio|media|suma|sumar)\b/.test(q)) return finish('No sumo índices ni promedio porcentajes entre dominios. Para obtener una medida de localidad se requiere una metodología y denominadores compatibles. Puedes comparar los valores de sus dominios.', publishedNote)
  const lowest = /\b(menor|menores|menos|baja|bajo)\b/.test(q)
  const ordered = [...rows].sort((a,b) => { const x=get(a), y=get(b); return x===null ? (y===null?0:1) : y===null ? -1 : (lowest ? x-y : y-x) || String(value(a,schema,'codigo')).localeCompare(String(value(b,schema,'codigo'))) })
  const requestedLimit = q.match(/\b(?:top|los|las)\s+(\d+)\b/)
  const limit = Math.max(1, Math.min(20, requestedLimit ? Number(requestedLimit[1]) : 5))
  const aggregate = counts && !/\b(mayor|mayores|menor|menores|mas|menos|top|compara|comparar|cada)\b/.test(q) && rows.length > 1
  const shown = ordered.slice(0, rows.length <= 2 ? rows.length : limit)
  answer.items = shown.map(r => ({ code: String(value(r,schema,'codigo')), name: String(value(r,schema,'nombre')), locality: String(value(r,schema,'localidad') ?? 'Sin dato'), value: get(r), grouped: String(value(r,schema,'tipo')) === 'grupo_UPZ' }))
  // Tras una comparación/orden, «y vivienda» usa los dominios mostrados; tras un total, todo su ámbito.
  if (!aggregate) answer.matchedCodes = answer.items.map(item => item.code)
  answer.text = aggregate ? `Hay ${format(total(rows,schema,key))} registros publicados de ${lines.find(l=>key===`registros_${l.key}`)?.label}. Suma de ${available.length} de ${rows.length} dominios con dato${available.length < rows.length ? ' (parcial: hay datos faltantes)' : ''}. La tabla muestra ${shown.length} dominios de referencia.` : `${label}: ${rows.length <= 2 ? 'valores de los territorios consultados' : `se muestran ${shown.length} de ${rows.length} dominios, ordenados de ${lowest ? 'menor a mayor' : 'mayor a menor'}`}. ${available.length} dominios tienen dato; ${rows.length - available.length} no tienen dato.`
  answer.note = counts ? (dataset.analysis ? 'Conteos publicados de períodos heterogéneos; no son índice de presencia ni beneficiarios únicos. No se suman líneas ni IDs distintos como personas. Vivienda: solo Plan Terrazas.' : 'Conteos de las columnas asignadas. Verifica unidades, período y alcance del archivo; no son beneficiarios únicos ni índice de presencia.') : key === 'brecha' || key === 'presencia_validada' ? 'Se muestran las columnas asignadas del archivo; esta consulta no certifica su validación. Comprueba escala, período y metodología antes de interpretarlas.' : publishedNote
  if (shown.some(r => String(value(r,schema,'tipo')) === 'grupo_UPZ')) answer.note += ' Una agrupación representa todas sus UPZ: no se atribuye su estimación a una UPZ individual.'
  return answer
}
