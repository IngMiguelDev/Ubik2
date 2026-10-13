<script setup lang="ts">
import type { Dataset, Row } from '../types/data'
import { value } from '../utils/analytics'
import { explorerValue } from '../utils/explorer'
const props = defineProps<{ row?: Row; dataset: Dataset; metric: string }>()
const emit = defineEmits<{ indicator: [key: string] }>()
const cards = computed(() => props.dataset.status==='final' ? [
  {key:'final:indice_necesidad',label:'Necesidad',note:'Promedio de cinco dimensiones normalizadas · 0 a 1.'},
  {key:'final:indice_presencia',label:'Presencia CVP',note:'Promedio de cinco líneas normalizadas · 0 a 1.'},
  {key:'final:brecha',label:'Brecha',note:'Necesidad menos presencia · -1 a 1.'},
  {key:'final:ind_vulnerabilidad',label:'Vulnerabilidad',note:'Hogares con jefatura femenina en pobreza monetaria · %.'}
] : [
  { key: 'scenario:need', label: '1. Necesidad ajustada', note: 'Mayor valor: mayor necesidad relativa.' },
  { key: 'scenario:presence', label: '2. Presencia publicada', note: 'Mayor valor: mayor densidad relativa de registros.' },
  { key: 'scenario:gap', label: '3. Brecha relativa', note: 'Necesidad − presencia; no equivale a hogares sin ayuda.' },
  { key: 'scenario:vulnerability', label: 'Vulnerabilidad económica', note: 'Pobreza monetaria normalizada.' }
])
const result = (key: string) => props.row ? explorerValue(props.row, props.dataset, key) : null
const display = (key: string) => { const v = result(key); return v === null ? 'Sin dato' : new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 }).format(v) }
</script>
<template>
  <section class="panel territory-results" aria-label="Resultados del territorio">
    <div class="panel-heading"><div><div class="section-label">NECESIDAD · PRESENCIA · BRECHA</div><h2>Los resultados del territorio</h2><p>{{ row ? `${value(row,dataset.schema,'nombre')} · ${value(row,dataset.schema,'localidad')}` : 'Sin territorios con estos filtros' }}</p></div><span class="status-pill">{{ dataset.status==='final' ? 'ARCHIVO FINAL' : 'ESCENARIO EXPLORATORIO' }}</span></div>
    <div class="territory-result-cards"><button v-for="card in cards" :key="card.key" :disabled="result(card.key) === null" :class="{ active: metric === card.key }" :aria-pressed="metric === card.key" @click="emit('indicator',card.key)"><span>{{ card.label }}</span><b>{{ display(card.key) }}<small v-if="result(card.key) !== null">{{ dataset.status==='final' ? (card.key==='final:ind_vulnerabilidad' ? ' %' : '') : ' puntos' }}</small></b><p>{{ card.note }}</p><strong>Ver en el mapa</strong></button></div>
    <p v-if="dataset.status==='final'" class="notice">Valores entregados en el archivo final. Brecha: {{ row?.categoria_brecha || 'Sin dato' }} · prioridad: {{ row?.prioridad || 'Sin dato' }}. La brecha no equivale a hogares sin atención.</p><p v-else class="notice">La brecha compara índices relativos. No mide hogares sin atender ni cobertura efectiva. Fórmula propuesta: necesidad física 80 % + vulnerabilidad económica 20 %. <a href="#metodologia">Ver metodología</a></p>
  </section>
</template>
