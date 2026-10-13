<script setup lang="ts">
import type { Dataset, Row } from '../types/data'
import { consolidatedField } from '../utils/consolidation'
const props = defineProps<{dataset: Dataset; rows: Row[]; metric: string}>()
const fields = computed(() => (props.dataset.fieldDefinitions || []).filter(f =>
  ['indice_necesidad','indice_presencia','brecha','ind_tenencia','ind_vivienda','ind_entorno','ind_vulnerabilidad','pct_amenaza_alta','pct_amenaza_media'].includes(f.field)
  && props.rows.some(r => typeof r[f.field] === 'number')
))
function display(field: string, unit: string) {
  const value = consolidatedField(props.rows,props.dataset,field)
  if (value === null) return 'Sin dato'
  return new Intl.NumberFormat('es-CO',{maximumFractionDigits:3}).format(value) + ' ' + (field.startsWith('ind_') ? '%' : unit)
}
const presenceLines=[{field:'viv_presencia',label:'Mejoramiento de Vivienda',note:'Plan Terrazas · ejecutados o en ejecución · estados 2021–2024'},{field:'tit_presencia',label:'Titulación Predial',note:'Suma de predios únicos por dominio · 2015–2025'},{field:'barrios_presencia',label:'Mejoramiento de Barrios',note:'Suma de tramos por dominio · contratos 2020–2023'},{field:'reas_presencia',label:'Reasentamientos',note:'Procesos terminados · histórico'},{field:'cps_presencia',label:'Curaduría Pública Social',note:'Actos de reconocimiento · fechas 2021–2024'}]
const details=computed(()=>(props.dataset.fieldDefinitions||[]).filter(f=>['Población','Presencia CVP','Necesidad','Brecha por línea'].includes(f.group)&&!fields.value.some(x=>x.field===f.field)&&!presenceLines.some(x=>x.field===f.field)&&props.rows.some(r=>typeof r[f.field]==='number')))
const indicator = computed(() => props.dataset.fieldDefinitions?.find(f => 'final:' + f.field === props.metric))
</script>
<template>
  <div v-if="indicator" class="territory-highlight"><p>{{ indicator.description }}</p><strong>{{ display(indicator.field,indicator.unit) }}</strong><small>{{ indicator.unit }}</small></div>
  <dl class="facts"><div v-for="field in fields" :key="field.field"><dt>{{ field.field==='integralidad' ? 'Líneas CVP con registros en la selección' : field.description }}</dt><dd>{{ display(field.field,field.unit) }}</dd></div><div><dt>Posición según la brecha</dt><dd>No aplica al consolidado</dd></div><div><dt>Quintil de la brecha</dt><dd>No aplica al consolidado</dd></div></dl>
  <h3>Presencia CVP</h3><div class="territory-presence"><div v-for="line in presenceLines" :key="line.field"><span>{{ line.label }}<small>{{ line.note }}</small></span><strong>{{ display(line.field,'') }}</strong></div></div>
  <details><summary>Otros datos consolidados</summary><dl class="facts"><div v-for="field in details" :key="field.field"><dt>{{ field.description }}</dt><dd>{{ display(field.field,field.unit) }}</dd></div></dl></details>
  <p class="notice">Conteos y áreas: suma de los valores de los dominios. Tasas: total por 1.000 hogares. Indicadores de hogares e índices: promedio ponderado por hogares representados; amenaza: ponderación por área. Proporciones y tasas consolidadas son estimaciones a partir de valores publicados redondeados. No tiene prioridad, quintil ni cuadrante.</p>
  <p class="chart-footnote">Los IDs únicos se contaron por dominio; su suma no acredita unicidad global. Las líneas usan unidades y períodos diferentes. Los filtros delimitan el consolidado; selecciona una UPZ o agrupación para ver solo sus valores.</p>
</template>
