<script setup lang="ts">
import type { Dataset, Row } from '../types/data'
import { format, numeric, value } from '../utils/analytics'
const props = defineProps<{ row: Row; dataset: Dataset }>()
const indicators = [
  { key: 'jefatura', column: 'pct_jefatura_femenina', label: 'Jefatura femenina' },
  { key: 'pobreza', column: 'pct_pobreza_monetaria_hogares', label: 'Pobreza monetaria de hogares' },
  { key: 'pobreza_multidimensional', column: 'pct_pobreza_multidimensional_hogares', label: 'Pobreza multidimensional de hogares' }
]
function percentage(key: string, column: string) {
  const result = numeric(props.dataset.schema[key] ? value(props.row, props.dataset.schema, key) : props.row[column])
  return result === null ? 'Sin dato' : `${format(result)} %`
}
</script>
<template>
  <section class="territory-context" aria-label="Enfoque diferencial y contexto">
    <h3>Enfoque diferencial y contexto</h3>
    <dl>
      <div v-for="item in indicators" :key="item.key"><dt>{{ item.label }}</dt><dd>{{ percentage(item.key, item.column) }}</dd></div>
    </dl>
    <p class="chart-footnote">Son porcentajes separados: no indican cuántos hogares con jefatura femenina están en pobreza. Se presentan como contexto y quedan fuera del índice preliminar.</p>
  </section>
</template>
