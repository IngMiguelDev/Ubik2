<script setup lang="ts">
import { Download, ArrowLeftRight } from 'lucide-vue-next'
import type {Dataset,Row} from '../types/data'
import {comparisonMetrics,pairedData,pearson,comparisonScatter} from '../utils/comparison'
import {format} from '../utils/analytics'
import {download,exportRows} from '../utils/csv'
const props=defineProps<{dataset:Dataset;rows:Row[];selectedCode?:string}>()
const emit=defineEmits<{select:[code:string]}>()
const x=ref('necesidad'),y=ref('registros_barrios')
const options=computed(()=>comparisonMetrics(props.dataset))
watch(options,opts=>{if(!opts.some(o=>o.key===x.value))x.value=opts[0]?.key||'necesidad';if(!opts.some(o=>o.key===y.value))y.value=opts.find(o=>o.key!==x.value)?.key||x.value},{immediate:true})
const pairs=computed(()=>pairedData(props.rows,props.dataset,x.value,y.value))
const coefficient=computed(()=>pearson(pairs.value))
const localities=computed(()=>[...new Set(pairs.value.map(p=>p.locality))].sort())
const xMetric=computed(()=>options.value.find(o=>o.key===x.value)!),yMetric=computed(()=>options.value.find(o=>o.key===y.value)!)
const option=computed(()=>comparisonScatter(pairs.value,xMetric.value,yMetric.value,localities.value,props.selectedCode||''))
function exportPairs(){download('ubik2_dispersion.csv',exportRows(pairs.value.map(p=>({codigo:p.code,dominio:p.name,localidad:p.locality,indicador_x:x.value,unidad_x:xMetric.value.unit,valor_x:p.x,indicador_y:y.value,unidad_y:yMetric.value.unit,valor_y:p.y}))),'text/csv;charset=utf-8')}
function swap(){const old=x.value;x.value=y.value;y.value=old}
</script>
<template>
  <section class="panel scatter-comparison" aria-label="Comparación por dispersión">
    <div class="panel-heading"><div><div class="section-label">COMPARA DOS VARIABLES</div><h2>Gráficos de dispersión</h2><p>Cada punto representa un dominio completo. Cambia los ejes para explorar relaciones entre indicadores.</p></div><button class="outline" :disabled="!pairs.length" @click="exportPairs"><Download :size="15"/>Exportar puntos</button></div>
    <div class="scatter-controls"><label>Eje horizontal (X)<select v-model="x" aria-label="Eje horizontal (X)"><option v-for="o in options" :key="o.key" :value="o.key">{{o.label}}</option></select><small>{{xMetric?.unit}}</small></label><button class="outline" aria-label="Intercambiar ejes" @click="swap"><ArrowLeftRight :size="17"/></button><label>Eje vertical (Y)<select v-model="y" aria-label="Eje vertical (Y)"><option v-for="o in options" :key="o.key" :value="o.key">{{o.label}}</option></select><small>{{yMetric?.unit}}</small></label></div>
    <div class="scatter-summary"><span><strong>{{pairs.length}}</strong> de {{rows.length}} dominios con ambos datos</span><span>Pearson: <strong>{{format(coefficient)}}</strong></span><span>Color: localidad</span></div>
    <ClientOnly><LazyDataChart v-if="pairs.length" :option="option" label="Gráfico de dispersión de los indicadores seleccionados; valores exactos disponibles en la tabla de pares" @select="emit('select',$event)"/><EmptyState v-else title="Sin pares disponibles" description="Selecciona otras variables o amplía los filtros. Los valores faltantes no se convierten en cero."/></ClientOnly>
    <p class="chart-footnote">La correlación es descriptiva, sin inferencia causal ni ponderación muestral. Los registros publicados tienen unidades y períodos distintos; compararlos con necesidad no produce una brecha. Pearson requiere al menos tres pares y variación en ambos ejes.</p>
    <details class="scatter-data"><summary>Ver los datos de los puntos · seleccionar un territorio</summary><div class="table-scroll"><table><caption>{{xMetric?.label}} frente a {{yMetric?.label}}</caption><thead><tr><th>Dominio</th><th>Localidad</th><th>X</th><th>Y</th></tr></thead><tbody><tr v-for="p in pairs" :key="p.code"><th><button class="text-button" @click="emit('select',p.code)">{{p.name}}</button></th><td>{{p.locality}}</td><td>{{format(p.x)}}</td><td>{{format(p.y)}}</td></tr></tbody></table></div></details>
  </section>
</template>
