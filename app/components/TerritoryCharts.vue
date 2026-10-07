<script setup lang="ts">
import type { Dataset, Row } from '../types/data'
import { format, need, numeric, value } from '../utils/analytics'
const props = defineProps<{ row: Row; dataset: Dataset }>()
const emit = defineEmits<{ indicator: [key: string] }>()
const get = (key: string) => numeric(value(props.row, props.dataset.schema, key))
const needValue = computed(() => need(props.row, props.dataset.rows, props.dataset.schema))
const profile = computed(() => [
  { key: 'tenencia', label: 'Tenencia', value: get('tenencia') },
  { key: 'vivienda', label: 'Vivienda', value: get('vivienda') },
  { key: 'entorno', label: 'Entorno', value: get('entorno') },
  { key: 'riesgo', label: 'Riesgo reportado', value: get('riesgo') },
  { key: 'vulnerabilidad', label: 'Vulnerabilidad', value: get('vulnerabilidad') }
])
const conditions = computed(() => [
  { key: 'raw:pct_pobreza_monetaria_hogares', label: 'Pobreza monetaria', value: get('pobreza'), color: '#fa241a' },
  { key: 'raw:pct_pobreza_multidimensional_hogares', label: 'Pobreza multidimensional', value: numeric(props.row.pct_pobreza_multidimensional_hogares), color: '#fa241a' },
  { key: 'raw:pct_jefatura_femenina', label: 'Jefatura femenina', value: get('jefatura'), color: '#b08000' }
])
const width = (result: number | null) => `${Math.max(0, Math.min(100, result ?? 0))}%`
const display = (result: number | null, unit: string) => result === null ? 'Sin dato' : `${format(result)} ${unit}`
</script>
<template>
  <section class="territory-charts" aria-label="Gráficos del territorio seleccionado">
    <div class="territory-charts-heading"><div class="section-label">LEE LA FICHA CON GRÁFICOS</div><h2>{{ value(row, dataset.schema, 'nombre') }}</h2></div>
    <article class="panel territory-chart">
      <h3>Necesidad frente a presencia</h3>
      <div class="territory-bar"><span>Necesidad</span><i aria-hidden="true"><b :style="{ width: width(needValue) }"/></i><strong>{{ display(needValue, 'pts') }}</strong></div>
      <div class="territory-bar"><span>Presencia</span><i aria-hidden="true"><b class="presence-bar" :style="{ width: width(get('presencia_validada')) }"/></i><strong>{{ get('presencia_validada') === null ? 'Pendiente de validación' : display(get('presencia_validada'), 'pts') }}</strong></div>
      <p class="chart-footnote">Brecha validada: <strong>{{ get('brecha') === null ? 'Pendiente de validación' : display(get('brecha'), 'pts') }}</strong></p>
      <p class="territory-chart-note">La necesidad es exploratoria. El CSV aún no aporta un índice de presencia comparable ni una brecha validada.</p>
    </article>
    <article class="panel territory-chart">
      <h3>Perfil de las cinco dimensiones</h3>
      <button v-for="item in profile" :key="item.key" class="territory-bar" :disabled="item.value === null || !dataset.analysis" :aria-label="`Ver ${item.label} en el mapa`" @click="emit('indicator', item.key)"><span>{{ item.label }}</span><i aria-hidden="true"><b :style="{ width: dataset.analysis ? width(item.value) : '0%' }"/></i><strong>{{ item.value === null ? 'Pendiente de validación' : display(item.value, dataset.analysis ? 'pts' : '') }}</strong></button>
      <p class="territory-chart-note">Las cuatro dimensiones publicadas son índices de 0 a 100. Pulsa una barra para verla en el mapa. La vulnerabilidad transversal sigue pendiente de definición.</p>
    </article>
    <article class="panel territory-chart">
      <h3>Condiciones de los hogares</h3>
      <button v-for="item in conditions" :key="item.key" class="territory-bar" :disabled="item.value === null || !dataset.columns.includes(item.key.slice(4))" :aria-label="`Ver ${item.label} en el mapa`" @click="emit('indicator', item.key)"><span>{{ item.label }}</span><i aria-hidden="true"><b :style="{ width: width(item.value), background: item.color }"/></i><strong>{{ display(item.value, '%') }}</strong></button>
      <p class="territory-chart-note">Son porcentajes separados de hogares{{ dataset.analysis ? ' en 2021' : '' }}. No se suman ni indican cuántos hogares con jefatura femenina están en pobreza.</p>
    </article>
  </section>
</template>
