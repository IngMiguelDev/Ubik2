<script setup lang="ts">
import * as echarts from 'echarts/core'
import { ScatterChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, AriaComponent, MarkLineComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
echarts.use([ScatterChart, BarChart, GridComponent, TooltipComponent, LegendComponent, AriaComponent, MarkLineComponent, CanvasRenderer])
const props = defineProps<{ option: echarts.EChartsCoreOption; label: string }>()
const emit = defineEmits<{ select: [code: string] }>()
const element = ref<HTMLElement>(); let chart: echarts.ECharts | undefined; let observer: ResizeObserver | undefined
function apply() {
  const option = { ...props.option }
  if (element.value!.clientWidth < 420 && (props.option.series as any[])?.[0]?.type === 'bar') {
    option.grid = { left: 140, right: 20, top: 20, bottom: 35 }
    option.yAxis = { ...(props.option.yAxis as Record<string,unknown>), axisLabel: { color: '#615c60', width: 125, overflow: 'truncate', fontSize: 11 } }
    option.xAxis = { ...(props.option.xAxis as Record<string,unknown>), splitNumber: 3, axisLabel: { hideOverlap: true, fontSize: 10 } }
  }
  chart?.setOption(option, true)
}
onMounted(() => { chart = echarts.init(element.value!); apply(); chart.on('click', (p: any) => { if (p.data?.code) emit('select', p.data.code) }); observer = new ResizeObserver(() => { chart?.resize(); apply() }); observer.observe(element.value!) })
watch(() => props.option, apply, { deep: true })
onBeforeUnmount(() => { observer?.disconnect(); chart?.dispose() })
</script>
<template><div ref="element" class="chart" role="img" :aria-label="label"/></template>
