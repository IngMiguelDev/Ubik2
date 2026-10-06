<script setup lang="ts">
import L from 'leaflet'
import type { FeatureCollection } from 'geojson'
import { dimensions, type Dataset, type Row } from '../types/data'
import { value, numeric, format } from '../utils/analytics'
const props = defineProps<{ dataset: Dataset; rows: Row[]; line: string }>()
const emit = defineEmits<{ select: [code: string] }>()
const host = ref<HTMLElement>(); const geo = shallowRef<FeatureCollection>(); const key = ref(''); const error = ref(''); const indicator = ref('vivienda'); const provenance = ref(''); const acknowledged = ref(false)
const fields = computed(() => [...new Set(geo.value?.features.flatMap(f => Object.keys(f.properties || {})) || [])])
let map: L.Map | undefined, layer: L.GeoJSON | undefined, observer: ResizeObserver | undefined
const metric = (r: Row) => numeric(value(r, props.dataset.schema, indicator.value === 'presencia' ? `registros_${props.line || 'barrios'}` : indicator.value))
const vals = computed(() => props.rows.map(metric).filter((v): v is number => v !== null))
const lo = computed(() => vals.value.length ? Math.min(...vals.value) : null), hi = computed(() => vals.value.length ? Math.max(...vals.value) : null)
const matched = ref(0)
function color(v: number | null) { if (v === null || lo.value === null || hi.value === null) return '#d7d5d5'; const t = hi.value === lo.value ? 0 : (v-lo.value)/(hi.value-lo.value); return ['#fff4ba','#F7B325','#E3351F','#AA1023'][Math.min(3, Math.floor(t*4))]! }
async function upload(e: Event) {
  error.value = ''
  try {
    const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return
    const data = JSON.parse(await file.text())
    if (data.type !== 'FeatureCollection' || !Array.isArray(data.features) || !data.features.length) throw new Error('Carga un FeatureCollection de polígonos de dominios, no puntos de actuaciones.')
    function coords(v: any): boolean { if (!Array.isArray(v) || !v.length) return false; if (typeof v[0] === 'number') return v.length >= 2 && Number.isFinite(v[0]) && Number.isFinite(v[1]) && Math.abs(v[0]) <= 180 && Math.abs(v[1]) <= 90; return v.every(coords) }
    if (data.features.some((f: any) => !['Polygon','MultiPolygon'].includes(f.geometry?.type) || !coords(f.geometry.coordinates))) throw new Error('Se requieren polígonos en WGS84 (longitud/latitud). Reproyecta el archivo antes de cargarlo.')
    geo.value = data; key.value = ''; acknowledged.value = false
  } catch (e) { error.value = (e as Error).message }
}
async function draw() {
  if (!geo.value || !key.value || !acknowledged.value || !provenance.value) { layer?.remove(); matched.value = 0; return }
  await nextTick()
  if (!host.value) return
  if (!map) { map = L.map(host.value).setView([4.65,-74.1], 10); observer = new ResizeObserver(() => map?.invalidateSize()); observer.observe(host.value) }
  layer?.remove(); matched.value = 0
  layer = L.geoJSON(geo.value, {
    style: f => { const r = props.rows.find(r => String(value(r, props.dataset.schema, 'codigo')) === String(f?.properties?.[key.value])); return { color: '#7b6f70', weight: 1, fillOpacity: 0.8, fillColor: color(r ? metric(r) : null) } },
    onEachFeature: (f, shape) => {
      const code = String(f.properties?.[key.value] ?? '')
      const r = props.rows.find(r => String(value(r, props.dataset.schema, 'codigo')) === code)
      if (r) matched.value++
      const label = document.createElement('div')
      label.textContent = r ? `${value(r, props.dataset.schema, 'nombre')} · ${format(metric(r))} · Dominio completo` : `${code}: sin coincidencia en los filtros`
      shape.bindTooltip(label); shape.bindPopup(label.cloneNode(true) as HTMLElement)
      if (r) shape.on('click', () => emit('select', code))
    }
  }).addTo(map)
  const bounds = layer.getBounds(); if (bounds.isValid()) map.fitBounds(bounds, { padding: [20,20] })
}
watch([geo, key, indicator, provenance, acknowledged, () => props.rows, () => props.line], draw)
onBeforeUnmount(() => { observer?.disconnect(); map?.remove() })
</script>
<template>
  <section class="panel">
    <div class="panel-heading"><div><h2>Explorador geográfico</h2><p>Geometrías de dominios · coincidencia por código exacto</p></div><label class="upload-button">Cargar GeoJSON<input type="file" accept=".geojson,.json" @change="upload"></label></div>
    <div class="mapping-grid"><label>Indicador<select aria-label="Indicador" v-model="indicator"><option v-for="d in dimensions" :key="d" :value="d">{{ d }}</option><option value="presencia">Registros · línea seleccionada o Barrios</option></select></label><label v-if="geo">Propiedad con código de dominio<select aria-label="Propiedad con código de dominio" v-model="key"><option value="">Selecciona una propiedad</option><option v-for="f in fields" :key="f">{{ f }}</option></select></label><label v-if="geo">Procedencia oficial / licencia<input v-model="provenance" placeholder="URL y licencia verificadas"></label></div>
    <label v-if="geo" class="check-label"><input v-model="acknowledged" type="checkbox">Confirmo que son geometrías oficiales de dominios completos; las agrupaciones están unidas y no se desagregan.</label>
    <p v-if="error" role="alert" class="notice error">{{ error }}</p>
    <EmptyState v-if="!geo || !key || !acknowledged || !provenance" title="Geometrías pendientes de verificación" description="Carga un GeoJSON oficial en WGS84 y documenta su procedencia. Los puntos de actuaciones CVP no son límites de los dominios de la EM 2021."/>
    <div ref="host" v-show="geo && key && acknowledged && provenance" class="map" aria-label="Mapa de dominios territoriales"/>
    <div v-if="geo && key && acknowledged && provenance" class="map-legend"><span>Menor: {{ format(lo) }}</span><i/><span>Mayor: {{ format(hi) }}</span><span class="muted">Gris: sin dato · {{ matched }} geometrías coincidentes</span></div>
    <p class="muted">No se desagregan estimaciones de agrupaciones. Los valores muestran la unidad original del indicador; verifica su diccionario. Selecciona también un dominio en la tabla para consultar la ficha mediante teclado.</p>
  </section>
</template>
