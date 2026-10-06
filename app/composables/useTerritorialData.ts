import type { Dataset, Schema } from '../types/data'
import { parseCsv, numberColumn, download, exportRows } from '../utils/csv'
import { filterRows, need, integral } from '../utils/analytics'
export function useTerritorialData() {
  const dataset = ref<Dataset>({ rows: [], columns: [], schema: {}, source: { name: 'Sin archivo', date: null, license: null } })
  const loading = ref(true), error = ref(''), original = ref(''), configured = ref(false)
  const filters = reactive({ locality: '', domain: '', line: '', search: '' })
  const config = useRuntimeConfig()
  async function load() {
    loading.value = true; error.value = ''
    try {
      const data = await $fetch<Dataset>(`${config.app.baseURL}data/dataset.json`)
      if (!Array.isArray(data.rows) || !Array.isArray(data.columns)) throw new Error('Estructura de datos inválida.')
      dataset.value = data; configured.value = Boolean(data.schema.codigo && data.schema.nombre)
      if (data.rows.length) original.value = await $fetch<string>(`${config.app.baseURL}data/original.csv`, { responseType: 'text' })
    } catch (e) { error.value = e instanceof Error ? e.message : 'No se pudieron cargar los datos.' }
    finally { loading.value = false }
  }
  async function upload(file: File) {
    loading.value = true; error.value = ''
    try { const text = await file.text(); const data = parseCsv(text); data.source.name = file.name; dataset.value = data; original.value = text; configured.value = false; reset() }
    catch (e) { error.value = (e as Error).message }
    finally { loading.value = false }
  }
  function applySchema(schema: Schema, source: Dataset['source']) {
    error.value = ''
    try {
      for (const [key, column] of Object.entries(schema)) if (column && !key.startsWith('direccion_') && !dataset.value.columns.includes(column)) throw new Error(`Columna inexistente: ${column}`)
      if (!schema.codigo || !schema.nombre || !schema.localidad || !schema.tipo) throw new Error('Asigna código, nombre, localidad y tipo de dominio.')
      let rows = parseCsv(original.value).rows
      const numericKeys = Object.keys(schema).filter(k => !['codigo', 'nombre', 'localidad', 'tipo', 'fuente', 'corte', 'limitaciones'].includes(k) && !k.startsWith('direccion_'))
      const textColumns = ['codigo','nombre','localidad','tipo','fuente','corte','limitaciones'].map(k => schema[k]).filter(Boolean)
      if (numericKeys.some(k => textColumns.includes(schema[k]))) throw new Error('Una columna de identificación no puede asignarse también como indicador numérico.')
      for (const key of numericKeys) if (schema[key]) rows = numberColumn(rows, schema[key]!)
      const codes = rows.map(r => r[schema.codigo!])
      if (codes.some(c => c === null) || new Set(codes).size !== codes.length) throw new Error('Se requiere una fila por dominio y códigos únicos no vacíos. Revisa la unidad del CSV.')
      dataset.value = { ...dataset.value, rows, schema: { ...schema }, source: { ...source } }; configured.value = true; reset()
    } catch (e) { error.value = (e as Error).message }
  }
  function reset() { Object.assign(filters, { locality: '', domain: '', line: '', search: '' }) }
  const filtered = computed(() => configured.value ? filterRows(dataset.value.rows, dataset.value.schema, filters) : [])
  const downloadOriginal = () => download(dataset.value.source.name, original.value, 'text/csv;charset=utf-8')
  const downloadFiltered = () => {
    const columns = new Set(dataset.value.columns)
    const unique = (base: string) => { let name=base; while (columns.has(name)) name=`_${name}`; columns.add(name); return name }
    const keys = ['ubik2_necesidad_pesos_iguales','ubik2_necesidad_vivienda_doble','ubik2_necesidad_riesgo_doble','ubik2_integralidad_publicada'].map(unique)
    const results = filtered.value.map(r => ({ ...r,
      [keys[0]!]: need(r,dataset.value.rows,dataset.value.schema),
      [keys[1]!]: need(r,dataset.value.rows,dataset.value.schema,'housing'),
      [keys[2]!]: need(r,dataset.value.rows,dataset.value.schema,'risk'),
      [keys[3]!]: integral(r,dataset.value.schema)
    }))
    download('ubik2_resultados_filtrados.csv', exportRows(results), 'text/csv;charset=utf-8')
  }
  onMounted(load)
  return { dataset, loading, error, configured, filters, filtered, original, load, upload, applySchema, reset, downloadOriginal, downloadFiltered }
}
