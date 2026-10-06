<script setup lang="ts">
import type { Row } from '../types/data'
import { dimensionIndicators } from '../utils/indicators'
import { format } from '../utils/analytics'
defineProps<{ row: Row }>()
</script>
<template>
  <details class="original-indicators"><summary>Indicadores originales y denominadores de la EM 2021</summary>
    <div class="table-scroll"><table><caption>Porcentajes expandidos por dominio; no se promedian porcentajes entre dominios</caption><thead><tr><th>Dimensión / indicador</th><th>Porcentaje</th><th>Muestra válida</th><th>Hogares válidos expandidos</th></tr></thead><tbody><template v-for="group in dimensionIndicators" :key="group.label"><tr v-for="[column,label] in group.items" :key="column"><th><small class="block muted">{{ group.label }}</small>{{ label }}</th><td>{{ format(row[column!]) }} %</td><td>{{ format(row[`n_validos_${column!.replace('pct_','')}`]) }}</td><td>{{ format(row[`hogares_validos_exp_${column!.replace('pct_','')}`]) }}</td></tr></template></tbody></table></div>
    <p class="muted">El proxy medio de entorno es un compuesto; no tiene un denominador único en el archivo. Riesgo reportado por hogares no equivale a clasificación técnica del POT.</p>
  </details>
</template>
