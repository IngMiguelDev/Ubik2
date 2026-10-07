<script setup lang="ts">
import type { Dataset, Row } from '../types/data'
import { format, numeric, value } from '../utils/analytics'
import { availableIndicators } from '../utils/explorer'
const props = defineProps<{ row?: Row; dataset: Dataset; prominent?: boolean; metric?: string }>()
const emit = defineEmits<{ indicator: [key: string] }>()
const available = computed(() => new Set(availableIndicators(props.dataset).map(item => item.key)))
const indicators = [
  { key: 'jefatura', column: 'pct_jefatura_femenina', label: 'Jefatura femenina' },
  { key: 'pobreza', column: 'pct_pobreza_monetaria_hogares', label: 'Pobreza monetaria de hogares' },
  { key: 'pobreza_multidimensional', column: 'pct_pobreza_multidimensional_hogares', label: 'Pobreza multidimensional de hogares' }
]
function percentage(key: string, column: string) {
  if (!props.row) return 'Sin dato'
  const result = numeric(props.dataset.schema[key] ? value(props.row, props.dataset.schema, key) : props.row[column])
  return result === null ? 'Sin dato' : `${format(result)} %`
}
</script>
<template>
  <section class="territory-context" :class="{ 'panel context-prominent': prominent }" aria-label="Enfoque diferencial y contexto">
    <div v-if="prominent" class="section-label">CONDICIONES DE LOS HOGARES</div>
    <component :is="prominent ? 'h2' : 'h3'">Enfoque diferencial y contexto</component>
    <p v-if="prominent" class="context-territory">{{ row ? `${value(row,dataset.schema,'nombre')} · ${value(row,dataset.schema,'localidad')}` : 'Sin territorios con estos filtros' }}</p>
    <dl>
      <div v-for="item in indicators" :key="item.key" :class="{ active: metric === `raw:${item.column}` }">
        <dt>{{ item.label }}</dt>
        <dd><span>{{ percentage(item.key, item.column) }}</span><small v-if="prominent">Porcentaje de hogares · {{ dataset.analysis ? 'EM 2021' : 'Archivo cargado' }}</small>
          <button v-if="prominent && metric !== undefined" class="text-button" :disabled="!row || numeric(row[item.column]) === null || !available.has(`raw:${item.column}`)" :aria-pressed="metric === `raw:${item.column}`" :aria-label="`Ver ${item.label} en el mapa`" @click="emit('indicator',`raw:${item.column}`)">Ver en el mapa →</button>
        </dd>
      </div>
    </dl>
    <p class="chart-footnote">Los porcentajes se leen por separado y no indican cuántos hogares con jefatura femenina están en pobreza. <template v-if="dataset.analysis">Jefatura femenina y pobreza multidimensional son contexto; el escenario de necesidad ajustada incorpora pobreza monetaria normalizada con un peso del 20 %.</template><template v-else>Se presentan como contexto y quedan fuera del índice preliminar.</template></p>
  </section>
</template>
