<script setup lang="ts">
import type { Dataset, Row } from '../types/data'
import { format, formatDecimal } from '../utils/analytics'
import { consolidatedField } from '../utils/consolidation'
const props = defineProps<{dataset: Dataset; rows: Row[]; metric: string}>()
function display(field: string, unit: string) {
  const value = consolidatedField(props.rows,props.dataset,field)
  if (value === null) return 'Sin dato'
  return (presenceLines.some(line => line.field === field) || ['hogares_muestra','hogares_expandidos','integralidad'].includes(field) ? format(Math.round(value)) : formatDecimal(value)) + ' ' + (field==='brecha' ? '' : field.startsWith('ind_') ? '%' : unit)
}
const presenceLines=[{field:'viv_presencia',label:'Mejoramiento de Vivienda',note:'Plan Terrazas · ejecutados o en ejecución · estados 2021–2024'},{field:'tit_presencia',label:'Titulación Predial',note:'Suma de predios únicos por territorio · 2015–2025'},{field:'barrios_presencia',label:'Mejoramiento de Barrios',note:'Suma de tramos por territorio · contratos 2020–2023'},{field:'reas_presencia',label:'Reasentamientos',note:'Procesos terminados · histórico'},{field:'cps_presencia',label:'Curaduría Pública Social',note:'Actos de reconocimiento · fechas 2021–2024'}]
const indicator = computed(() => props.dataset.fieldDefinitions?.find(f => 'final:' + f.field === props.metric))
</script>
<template>
  <div v-if="indicator" class="territory-highlight"><p>{{ indicator.description }}</p><strong>{{ display(indicator.field,indicator.unit) }}</strong><small v-if="indicator.field!=='brecha'">{{ indicator.unit }}</small></div>
  <h3>Presencia CVP</h3><div class="territory-presence"><div v-for="line in presenceLines" :key="line.field"><span>{{ line.label }}<small>{{ line.note }}</small></span><strong>{{ display(line.field,'') }}</strong></div></div>
  <p class="notice">Estos son los registros de cada línea. No permiten contar cuántos hogares recibieron atención.</p>
</template>
