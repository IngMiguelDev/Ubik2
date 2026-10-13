<script setup lang="ts">
import type { Dataset, Row } from '../types/data'
import { need, numeric, value } from '../utils/analytics'
import { explorerValue } from '../utils/explorer'
const props = defineProps<{ row: Row; dataset: Dataset; consolidated?: boolean }>()
const emit = defineEmits<{ indicator: [key: string] }>()
const get = (key: string) => numeric(value(props.row, props.dataset.schema, key))
const needValue = computed(() => props.dataset.analysis ? explorerValue(props.row,props.dataset,'scenario:need') : need(props.row, props.dataset.rows, props.dataset.schema))
const presenceValue = computed(() => explorerValue(props.row,props.dataset,'scenario:presence'))
const gapValue = computed(() => explorerValue(props.row,props.dataset,'scenario:gap'))
const profile = computed(() => [
  { key: 'tenencia', label: 'Tenencia', value: get('tenencia') },
  { key: 'vivienda', label: 'Vivienda', value: get('vivienda') },
  { key: 'entorno', label: 'Entorno', value: get('entorno') },
  { key: 'riesgo', label: 'Riesgo reportado', value: get('riesgo') },
  { key: 'scenario:vulnerability', label: 'Vulnerabilidad', value: explorerValue(props.row,props.dataset,'scenario:vulnerability') }
])
const conditions = computed(() => [
  { key: 'raw:pct_pobreza_monetaria_hogares', label: 'Pobreza monetaria', value: get('pobreza'), color: '#fa241a' },
  { key: 'raw:pct_pobreza_multidimensional_hogares', label: 'Pobreza multidimensional', value: numeric(props.row.pct_pobreza_multidimensional_hogares), color: '#fa241a' },
  { key: 'raw:pct_jefatura_femenina', label: 'Jefatura femenina', value: get('jefatura'), color: '#ffc400' }
])
const width = (result: number | null) => `${Math.max(0, Math.min(100, result ?? 0))}%`
const display = (result: number | null, unit: string) => result === null ? 'Sin dato' : `${new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(result)} ${unit}`
</script>
<template>
  <section class="territory-charts" :aria-label="consolidated ? 'Gráficos consolidados de la selección' : 'Gráficos del territorio seleccionado'">
    <div class="territory-charts-heading"><div class="section-label">LEE LA FICHA CON GRÁFICOS</div><h2>{{ value(row, dataset.schema, 'nombre') }}</h2></div>
    <template v-if="dataset.status==='final'"><article class="panel territory-chart"><h3>Necesidad frente a presencia</h3><div v-for="item in [{field:'indice_necesidad',label:'Necesidad'},{field:'indice_presencia',label:'Presencia'},{field:'brecha',label:'Brecha'}]" :key="item.field" class="territory-bar"><span>{{ item.label }}</span><i aria-hidden="true"><b :class="{ 'gap-bar': item.field==='brecha', 'index-bar': item.field!=='brecha' }" :style="{width:width(typeof row[item.field]==='number' ? (item.field==='brecha' ? Math.abs(Number(row[item.field])) : Number(row[item.field]))*100 : null)}"/></i><strong>{{ display(typeof row[item.field]==='number' ? Number(row[item.field]) : null, '') }}</strong></div><p v-if="typeof row.brecha==='number' && row.brecha&lt;0" class="chart-footnote">La barra muestra la magnitud de la brecha; el signo negativo indica presencia mayor que necesidad.</p></article><article class="panel territory-chart"><h3>Condiciones de los hogares</h3><button v-for="item in [{field:'ind_tenencia',label:'Tenencia'},{field:'ind_vivienda',label:'Vivienda'},{field:'ind_entorno',label:'Entorno'},{field:'pct_amenaza_alta',label:'Amenaza alta · % del área'},{field:'ind_vulnerabilidad',label:'Vulnerabilidad'}]" :key="item.field" class="territory-bar" @click="emit('indicator',`final:${item.field}`)"><span>{{ item.label }}</span><i><b :class="{ 'female-bar': item.field==='ind_vulnerabilidad', 'risk-bar': item.field==='pct_amenaza_alta', 'tenure-bar': item.field==='ind_tenencia', 'housing-bar': item.field==='ind_vivienda', 'environment-bar': item.field==='ind_entorno' }" :style="{width:width(explorerValue(row,dataset,`final:${item.field}`))}"/></i><strong>{{ display(explorerValue(row,dataset,`final:${item.field}`),'%') }}</strong></button></article></template><template v-else><article class="panel territory-chart">
      <h3>Necesidad frente a presencia</h3>
      <div class="territory-bar"><span>Necesidad</span><i aria-hidden="true"><b class="index-bar" :style="{ width: width(needValue) }"/></i><strong>{{ display(needValue, 'pts') }}</strong></div>
      <div class="territory-bar" :class="{ 'territory-bar-pending': presenceValue === null }"><span>Presencia</span><i v-if="presenceValue !== null" aria-hidden="true"><b class="index-bar" :style="{ width: width(presenceValue) }"/></i><strong>{{ presenceValue === null ? 'Sin dato' : display(presenceValue, 'pts') }}</strong></div>
      <div class="territory-bar" :class="{ 'territory-bar-pending': gapValue === null }"><span>Brecha</span><i v-if="gapValue !== null" aria-hidden="true"><b class="gap-bar" :style="{ width: width(Math.abs(gapValue)) }"/></i><strong>{{ display(gapValue, 'pts') }}</strong></div><p v-if="gapValue !== null && gapValue&lt;0" class="chart-footnote">La barra muestra la magnitud; el valor conserva el signo negativo.</p>
      <p class="territory-chart-note">La diferencia entre las barras es la brecha exploratoria. No equivale a una cantidad de hogares sin atender.</p>
    </article>
    <article class="panel territory-chart">
      <h3>Perfil de las cinco dimensiones</h3>
      <button v-for="item in profile" :key="item.key" class="territory-bar" :class="{ 'territory-bar-pending': item.value === null }" :disabled="item.value === null || !dataset.analysis" :aria-label="`Ver ${item.label} en el mapa`" @click="emit('indicator', item.key)"><span>{{ item.label }}</span><i v-if="item.value !== null" aria-hidden="true"><b :class="{ 'risk-bar': item.key==='riesgo', 'tenure-bar': item.key==='tenencia', 'housing-bar': item.key==='vivienda', 'environment-bar': item.key==='entorno', 'female-bar': item.key==='scenario:vulnerability' }" :style="{ width: dataset.analysis ? width(item.value) : '0%' }"/></i><strong>{{ item.value === null ? 'Pendiente de validación' : display(item.value, dataset.analysis ? 'pts' : '') }}</strong></button>
      <p class="territory-chart-note">Compara índices de 0 a 100. Una barra mayor representa mayor necesidad relativa en ese tema. Pulsa una barra para verla en el mapa. Vulnerabilidad económica usa pobreza monetaria normalizada.</p>
    </article>
    <article class="panel territory-chart">
      <h3>Condiciones de los hogares</h3>
      <button v-for="item in conditions" :key="item.key" class="territory-bar" :disabled="item.value === null || !dataset.columns.includes(item.key.slice(4))" :aria-label="`Ver ${item.label} en el mapa`" @click="emit('indicator', item.key)"><span>{{ item.label }}</span><i aria-hidden="true"><b :style="{ width: width(item.value), background: item.color }"/></i><strong>{{ display(item.value, '%') }}</strong></button>
      <p class="territory-chart-note">Son porcentajes separados de hogares{{ dataset.analysis ? ' en 2021' : '' }}. No se suman ni indican cuántos hogares con jefatura femenina están en pobreza.</p>
    </article>
    </template>
  </section>
</template>
