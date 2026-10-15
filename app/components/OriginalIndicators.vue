<script setup lang="ts">
import type { Row } from '../types/data'
import { dimensionIndicators } from '../utils/indicators'
import { format, formatDecimal } from '../utils/analytics'
defineProps<{ row: Row }>()
</script>
<template>
  <details class="original-indicators"><summary>Ver las cifras de la encuesta y cuántos hogares representan</summary>
    <div class="table-scroll"><table><caption>Porcentajes de hogares representados en cada territorio; no se promedian directamente entre territorios</caption><thead><tr><th>Dimensión / indicador</th><th>Porcentaje</th><th>Muestra válida</th><th>Hogares representados con respuesta válida</th></tr></thead><tbody><template v-for="group in dimensionIndicators" :key="group.label"><tr v-for="[column,label] in group.items" :key="column"><th><small class="block muted">{{ group.label }}</small>{{ label }}</th><td>{{ formatDecimal(row[column!]) }} %</td><td>{{ format(row[`n_validos_${column!.replace('pct_','')}`]) }}</td><td>{{ format(row[`hogares_validos_exp_${column!.replace('pct_','')}`]) }}</td></tr></template></tbody></table></div>
    <p class="muted">El dato de entorno combina varias preguntas, por eso no tiene una única base de hogares en el archivo. El riesgo que reportan los hogares es distinto de la clasificación técnica del POT.</p>
  </details>
</template>
