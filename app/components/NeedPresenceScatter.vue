<script setup lang="ts">
import type { Dataset, Row } from '../types/data'
import { explorerValue } from '../utils/explorer'
import { value } from '../utils/analytics'
const props = defineProps<{ dataset: Dataset; rows: Row[]; selectedCode: string }>()
const emit = defineEmits<{ select: [code: string] }>()
const points = computed(() => props.rows.flatMap(row => {
  const x = explorerValue(row,props.dataset,'scenario:need'), y = explorerValue(row,props.dataset,'scenario:presence')
  if (x === null || y === null) return []
  const code = String(value(row,props.dataset.schema,'codigo'))
  return [{ code, name: String(value(row,props.dataset.schema,'nombre')), value: [x,y], symbolSize: code === props.selectedCode ? 18 : 10, itemStyle: { color: code === props.selectedCode ? '#ffc400' : x > y ? '#ed241b' : '#1968a6', borderColor: code === props.selectedCode ? '#202a35' : '#fff', borderWidth: 1, opacity: .85 } }]
}))
const option = computed(() => ({
  aria: { enabled: true }, tooltip: { trigger: 'item', renderMode: 'richText' },
  grid: { left: 55, right: 24, top: 50, bottom: 70 },
  xAxis: { type: 'value', min: 0, max: 100, interval: 25, name: 'Necesidad ajustada · puntos de índice', nameLocation: 'middle', nameGap: 40, nameTextStyle: { fontSize: 11 } },
  yAxis: { type: 'value', min: 0, max: 100, interval: 25, name: 'Presencia publicada · puntos de índice', nameTextStyle: { fontSize: 11 } },
  series: [{ type: 'scatter', data: points.value, markLine: { silent: true, symbol: 'none', label: { show: false }, lineStyle: { color: '#8b949e', type: 'dashed' }, data: [[{ coord: [0,0] },{ coord: [100,100] }]] } }]
}))
</script>
<template>
  <section class="panel need-presence-scatter"><div class="section-label">NECESIDAD Y PRESENCIA EN LA MISMA VISTA</div><h2>¿Dónde conviene profundizar?</h2><p>Cada punto es un territorio de la selección. Más a la derecha: mayor necesidad; más arriba: mayor presencia publicada. Pulsa un punto para explorar su ficha.</p><ClientOnly><LazyDataChart v-if="points.length" :option="option" label="Dispersión de necesidad ajustada y presencia publicada" @select="emit('select',$event)"/><EmptyState v-else title="Sin territorios con estos filtros" description="Restablece los filtros para ver la comparación."/></ClientOnly><div class="scenario-legend"><span>Rojo: brecha positiva</span><span>Azul: brecha negativa o cero</span><span>Amarillo: territorio seleccionado</span></div><p class="chart-footnote">La diagonal indica igualdad de índices. Debajo de ella, la necesidad supera la presencia. Es una relación exploratoria; no mide cobertura ni hogares pendientes de ayuda.</p></section>
</template>
