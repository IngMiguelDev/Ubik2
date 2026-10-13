<script setup lang="ts">
import type { Dataset, Row, FieldDefinition } from '../types/data'
import { format, formatDecimal } from '../utils/analytics'
const props = defineProps<{ dataset: Dataset; row: Row; compact?: boolean }>()
const fields = computed(() => (props.dataset.fieldDefinitions || []).filter(f => f.usage !== 'No mostrar' && f.usage !== 'Identificador interno' && f.group !== 'Identificación' && (!props.compact || ['indice_necesidad','indice_presencia','brecha','categoria_brecha','prioridad','ind_tenencia','ind_vivienda','ind_entorno','ind_vulnerabilidad','pct_amenaza_alta','pct_amenaza_media'].includes(f.field))))
function display(f: FieldDefinition) {
  const v = props.row[f.field]
  if (typeof v !== 'number') return v === null || v === undefined ? 'Sin dato' : String(v)
  const percentage = f.field.startsWith('ind_') && !f.field.endsWith('_n')
  return `${(percentage || f.field.includes('indice') || f.field.startsWith('brecha') || f.field.startsWith('pct_') || f.field.includes('_x1000hog') || f.field.startsWith('area_') ? formatDecimal(percentage ? v * 100 : v) : format(v))} ${percentage ? '%' : f.unit}`
}
</script>
<template>
  <dl class="facts"><div v-for="f in fields" :key="f.field"><dt>{{ f.description }}</dt><dd>{{ display(f) }}</dd></div></dl>
</template>
