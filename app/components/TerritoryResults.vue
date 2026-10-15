<script setup lang="ts">
import type { Dataset, Row } from '../types/data'
import { value } from '../utils/analytics'
import { consolidatedValue } from '../utils/consolidation'
import { explorerValue } from '../utils/explorer'
const props = defineProps<{ row?: Row; rows?: Row[]; scopeLabel?: string; dataset: Dataset; metric: string }>()
const emit = defineEmits<{ indicator: [key: string] }>()
const cards = computed(() => props.dataset.status==='final' ? [
  {key:'final:indice_necesidad',label:'Necesidad',note:'Un valor más alto indica más necesidad relativa · 0 a 1'},
  {key:'final:indice_presencia',label:'Presencia CVP',note:'Un valor más alto indica más presencia relativa · 0 a 1'},
  {key:'final:brecha',label:'Brecha',note:'Necesidad − presencia · −1 a 1'},
  {key:'final:ind_vulnerabilidad',label:'Jefatura femenina en pobreza',note:'% de todos los hogares · EM 2021'}
] : [
  { key: 'scenario:need', label: '1. Necesidad ajustada', note: 'Mayor valor: mayor necesidad relativa.' },
  { key: 'scenario:presence', label: '2. Presencia publicada', note: 'Más registros en relación con hogares o área, según la línea.' },
  { key: 'scenario:gap', label: '3. Brecha relativa', note: 'Necesidad − presencia; no equivale a hogares sin ayuda.' },
  { key: 'scenario:vulnerability', label: 'Vulnerabilidad económica', note: 'Pobreza monetaria llevada a una escala comparable.' }
])
const result = (key: string) => props.row ? explorerValue(props.row, props.dataset, key) : consolidatedValue(props.rows || [], props.dataset, key)
const display = (key: string) => { const v = result(key); return v === null ? 'Sin dato' : new Intl.NumberFormat('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v) }
</script>
<template>
  <section id="leer-resultados" tabindex="-1" class="panel territory-results" aria-label="Resultados del territorio">
    <div class="panel-heading"><div><div class="section-label">NECESIDAD · PRESENCIA · BRECHA</div><h2>Cada territorio cuenta una historia</h2><p>{{ row ? `${value(row,dataset.schema,'nombre')} · ${value(row,dataset.schema,'localidad')}` : scopeLabel || 'Resumen de tu selección' }}</p></div><span class="status-pill">{{ dataset.status==='final' ? 'ARCHIVO FINAL' : 'ESCENARIO EXPLORATORIO' }}</span></div>
    <div class="territory-result-cards"><slot name="context"/><button v-for="card in cards" :key="card.key" :disabled="result(card.key) === null" :class="{ active: metric === card.key, 'female-indicator': card.key==='final:ind_vulnerabilidad', 'gap-indicator': card.key==='final:brecha' || card.key==='scenario:gap' }" :aria-pressed="metric === card.key" @click="emit('indicator',card.key)"><span>{{ card.label }}</span><b>{{ display(card.key) }}<small v-if="result(card.key) !== null">{{ dataset.status==='final' ? (card.key==='final:ind_vulnerabilidad' ? ' %' : '') : ' puntos' }}</small></b><p>{{ card.note }}</p><strong>Ver en el mapa</strong></button></div>
  </section>
</template>
