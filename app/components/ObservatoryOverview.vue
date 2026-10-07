<script setup lang="ts">
import { ArrowUpRight, Download } from 'lucide-vue-next'
import type { Dataset, Row } from '../types/data'
import { lines } from '../types/data'
import { format, integral, value } from '../utils/analytics'
import { availableIndicators, explorerValue, presenceFilter } from '../utils/explorer'
import { download, exportRows } from '../utils/csv'
import { scenarioRows } from '../utils/scenario'
const props=defineProps<{dataset:Dataset;rows:Row[];filters:{locality:string;domain:string;line:string;search:string};configured:boolean}>()
const baseURL=useRuntimeConfig().app.baseURL
const emit=defineEmits<{updateFilters:[filters:Partial<typeof props.filters>];reset:[];select:[code:string];navigate:[id:string]}>()
const metric=ref('scenario:gap'), presence=ref(''), selected=ref('67'), sort=ref<'value'|'name'>('value'), descending=ref(true), page=ref(1)
const indicators=computed(()=>availableIndicators(props.dataset))
watch(indicators,items=>{if(!items.some(i=>i.key===metric.value))metric.value=items[0]?.key||'necesidad'},{immediate:true})
const indicator=computed(()=>indicators.value.find(i=>i.key===metric.value)!)
const schema=computed(()=>props.dataset.schema)
const displayLines=['vivienda','titulacion','barrios','reasentamientos','curaduria'].map(key=>lines.find(line=>line.key===key)!)
const get=(r:Row,key:string)=>value(r,schema.value,key)
const localities=computed(()=>[...new Set(props.dataset.rows.map(r=>String(get(r,'localidad')??'')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es')))
const visible=computed(()=>props.rows.filter(r=>presenceFilter(r,props.dataset,presence.value)))
const metricValue=(r:Row)=>explorerValue(r,props.dataset,metric.value)
const highest=computed(()=>[...visible.value].sort((a,b)=>(metricValue(b)??-Infinity)-(metricValue(a)??-Infinity)).filter(r=>metricValue(r)!==null).slice(0,10))
const max=computed(()=>Math.max(0,...highest.value.map(r=>metricValue(r)??0)))
const ordered=computed(()=>[...visible.value].sort((a,b)=>{
  if(sort.value==='name')return String(get(a,'nombre')).localeCompare(String(get(b,'nombre')),'es')*(descending.value?-1:1)
  const x=metricValue(a),y=metricValue(b);return x===null?(y===null?0:1):y===null?-1:(x-y)*(descending.value?-1:1)
}))
const pages=computed(()=>Math.max(1,Math.ceil(ordered.value.length/15)))
const shown=computed(()=>ordered.value.slice((page.value-1)*15,page.value*15))
const territory=computed(()=>visible.value.find(r=>String(get(r,'codigo'))===selected.value))
watch(visible,rs=>{page.value=1;if(!rs.some(r=>String(get(r,'codigo'))===selected.value))selected.value=rs[0]?String(get(rs[0],'codigo')):''},{immediate:true})
watch([metric,sort,descending],()=>{page.value=1})
const sample=computed(()=>sumColumn('n_hogares_muestra'))
const households=computed(()=>sumColumn('hogares_expandidos_em2021'))
function sumColumn(column:string){const vals=visible.value.map(r=>typeof r[column]==='number'?r[column] as number:null).filter((v):v is number=>v!==null);return vals.length?vals.reduce((a,b)=>a+b,0):null}
const members=computed(()=>new Set(visible.value.flatMap(r=>String(r.codigos_upz??'').split('|').filter(Boolean))).size)
const validSample=computed(()=>{const key=metric.value.startsWith('raw:')?`n_validos_${metric.value.slice(4).replace('pct_','')}`:'';return territory.value&&key?territory.value[key]:null})
const metricDisplay=(r:Row)=>{const v=metricValue(r);return v===null?'Sin dato':`${new Intl.NumberFormat('es-CO',{maximumFractionDigits:1}).format(v)}${metric.value.startsWith('raw:')?' %':metric.value==='integralidad'?'/5':' pts'}`}
function update(key:'locality'|'search',e:Event){emit('updateFilters',{[key]:(e.target as HTMLInputElement).value,domain:''})}
function reset(){presence.value='';emit('reset')}
function orderBy(key:'name'|'value'){if(sort.value===key)descending.value=!descending.value;else{sort.value=key;descending.value=key==='value'}}
function exportSelection(){const scenario=scenarioRows(props.dataset);download('ubik2_seleccion.csv',exportRows(visible.value.map(r=>({...r,...scenario.get(r)}))),'text/csv;charset=utf-8')}
</script>
<template>
  <div class="observatory-overview">
    <div class="overview-heading"><div><div class="section-label">OBSERVATORIO TERRITORIAL / BOGOTÁ</div><h1>Las necesidades tienen un lugar.</h1><p>Explora las condiciones de los hogares y la presencia publicada de la Caja de la Vivienda Popular.</p></div><div class="overview-date"><strong>{{ dataset.analysis ? 'EM 2021' : 'Archivo cargado' }}</strong><small>Validación: {{ dataset.source.date || 'sin verificar' }}</small></div></div>
    <div class="stats-grid overview-stats"><StatCard label="Territorios en la selección" :value="configured ? format(visible.length) : '—'" :note="`${visible.length} dominios · ${members || 'sin dato'} UPZ integrantes`"/><StatCard label="Hogares encuestados" :value="format(sample)" note="Suma de la muestra en la selección"/><StatCard label="Hogares representados" :value="format(households === null ? null : Math.round(households))" note="Estimación expandida · redondeada"/><StatCard label="Fecha del análisis" :value="dataset.source.date || 'Sin dato'" note="Programas con períodos distintos"/></div>
    <TerritoryResults v-if="dataset.analysis" :row="territory" :dataset="dataset" :metric="metric" @indicator="metric=$event"/>
    <ContextIndicators :row="territory" :dataset="dataset" prominent :metric="metric" @indicator="metric=$event"/>
    <div class="overview-explorer">
      <section class="panel overview-filters" aria-label="Filtros del mapa"><div class="section-label">EXPLORA EL TERRITORIO</div>
        <label>Localidad<select aria-label="Localidad del mapa" :value="filters.locality" :disabled="!configured" @change="update('locality',$event)"><option value="">Toda la selección disponible</option><option v-for="l in localities" :key="l">{{ l }}</option></select></label>
        <label>Busca una UPZ o agrupación<input aria-label="Busca una UPZ o agrupación" :value="filters.search" placeholder="Ej.: Lucero, Bosa…" :disabled="!configured" @input="update('search',$event)"></label>
        <label>Indicador del mapa<select aria-label="Indicador del mapa" v-model="metric"><option v-for="i in indicators" :key="i.key" :value="i.key">{{ i.label }}</option></select></label>
        <div v-if="indicator" class="indicator-description"><strong>{{ indicator.label }}</strong><p>{{ indicator.description }}</p><small>{{ indicator.unit }}</small></div>
        <label>Líneas CVP con registros<select aria-label="Líneas CVP con registros" v-model="presence"><option value="">Cualquier cantidad</option><option value="0">Sin registros publicados</option><option value="1">Al menos 1 línea</option><option value="3">Al menos 3 líneas</option><option value="5">Las 5 líneas</option></select></label>
        <button class="outline" @click="reset">Restablecer filtros</button>
        <p class="chart-footnote">La EM publica dominios estadísticos: algunas UPZ se agrupan y conservan su resultado conjunto. {{ visible.length }} dominios en la selección · {{ dataset.rows.length }} en el archivo.</p>
        <p v-if="filters.domain || filters.line" class="notice">Hay filtros adicionales de dominio o línea activos. Restablécelos para ampliar la consulta.</p>
      </section>
      <div class="overview-map-column">
        <ClientOnly><LazyTerritorialMap :dataset="dataset" :rows="visible" :line="filters.line" :metric-key="metric" :metric-label="indicator?.label" :selected-code="selected" compact @select="selected=$event"/><template #fallback><section class="panel loading">Preparando mapa territorial…</section></template></ClientOnly>
        <TerritoryCharts v-if="territory" :row="territory" :dataset="dataset" @indicator="metric=$event"/>
      </div>
      <section class="panel overview-territory" aria-label="Territorio seleccionado">
        <div class="section-label">TERRITORIO SELECCIONADO</div>
        <template v-if="territory"><h2>{{ get(territory,'nombre') }}</h2><p class="muted">{{ get(territory,'localidad') }} · {{ get(territory,'tipo') }}<br>Código {{ get(territory,'codigo') }} · UPZ: {{ territory.codigos_upz || 'sin dato' }}</p>
          <div class="territory-highlight"><p>{{ indicator?.label }}</p><strong>{{ metricDisplay(territory) }}</strong><small v-if="validSample!==null && validSample!==undefined">{{ format(validSample) }} hogares con respuesta válida en la muestra</small><small v-else>{{ indicator?.unit }}</small></div>
          <div class="territory-mini-stats"><div><strong>{{ format(territory.pct_deficit_cualitativo) }} %</strong><small>Necesidad de mejoras</small></div><div><strong>{{ format(territory.pct_riesgo_reportado_alguno) }} %</strong><small>Riesgo reportado</small></div><div><strong>{{ format(typeof territory.hogares_expandidos_em2021==='number' ? Math.round(territory.hogares_expandidos_em2021) : null) }}</strong><small>Hogares representados</small></div><div><strong>{{ format(integral(territory,schema)) }}/5</strong><small>Líneas con registros</small></div></div>
          <DimensionProfile v-if="dataset.analysis" :row="territory" :dataset="dataset" @indicator="metric=$event"/>
          <h3>Presencia cvp</h3><div class="territory-presence"><div v-for="l in displayLines" :key="l.key"><span>{{ l.label }}<small>{{ l.key==='vivienda'?'Solo Plan Terrazas · registros':l.key==='barrios'?'Elementos físicos publicados':'Registros publicados' }}</small></span><strong>{{ format(get(territory,`registros_${l.key}`)) }}</strong></div></div>
          <p class="notice">Las líneas usan unidades y períodos distintos. Los registros no equivalen a hogares atendidos ni a cobertura completa.</p><p class="chart-footnote">Brecha real y priorización oficial: pendientes de validación.</p>
          <button class="text-button" @click="emit('select',String(get(territory,'codigo')))">Ver ficha completa <ArrowUpRight :size="15"/></button>
        </template><EmptyState v-else title="Selecciona un territorio" description="Elige un dominio del mapa o de la tabla. Si no hay resultados, restablece los filtros."/>
      </section>
    </div>
    <NeedPresenceScatter v-if="dataset.analysis" :dataset="dataset" :rows="visible" :selected-code="selected" @select="selected=$event"/>
    <section class="panel overview-comparison"><div class="panel-heading"><div><div class="section-label">LEE LOS DATOS EN CONTEXTO</div><h2>Compara territorios</h2><p>{{ indicator?.label }} · {{ indicator?.unit }}</p></div><button class="outline" :disabled="!visible.length" @click="exportSelection"><Download :size="15"/>Exportar selección</button></div>
      <div class="comparison-grid"><div class="overview-ranking"><div class="section-label">10 MAYORES VALORES DE LA SELECCIÓN</div><button v-for="r in highest" :key="String(get(r,'codigo'))" :aria-label="`Seleccionar ${get(r,'nombre')}`" :class="{selected:String(get(r,'codigo'))===selected}" @click="selected=String(get(r,'codigo'))"><span :title="String(get(r,'nombre'))">{{ get(r,'nombre') }}</span><i><b :style="{width:`${max>0?100*(metricValue(r)??0)/max:0}%`}"/></i><strong>{{ metricDisplay(r) }}</strong></button><p v-if="!highest.length" class="muted">Sin valores disponibles para este indicador.</p></div>
      <div><div class="table-scroll"><table><caption class="sr-only">Comparación territorial · {{ indicator?.label }}</caption><thead><tr><th :aria-sort="sort==='name'?(descending?'descending':'ascending'):'none'"><button @click="orderBy('name')">Territorio ↕</button></th><th>Localidad</th><th :aria-sort="sort==='value'?(descending?'descending':'ascending'):'none'"><button @click="orderBy('value')">Valor ↕</button></th><th>Líneas CVP</th></tr></thead><tbody><tr v-for="r in shown" :key="String(get(r,'codigo'))" :class="{selected:String(get(r,'codigo'))===selected}"><th><button class="territory-name" :aria-label="`Seleccionar territorio ${get(r,'nombre')}`" @click="selected=String(get(r,'codigo'))">{{ get(r,'nombre') }}</button></th><td>{{ get(r,'localidad') }}</td><td>{{ metricDisplay(r) }}</td><td>{{ format(integral(r,schema)) }}/5</td></tr></tbody></table></div><EmptyState v-if="!shown.length" title="No hay dominios en esta selección" description="Prueba otra búsqueda o restablece los filtros."/><div class="pagination"><span>{{ visible.length }} territorios</span><div><button class="icon-button" aria-label="Página anterior de comparación" :disabled="page===1" @click="page--">‹</button><span>Página {{ page }} de {{ pages }}</span><button class="icon-button" aria-label="Página siguiente de comparación" :disabled="page===pages" @click="page++">›</button></div></div></div></div>
    </section>
    <details class="panel additional-comparison"><summary>Explorar otras relaciones entre indicadores</summary><ScatterComparison :dataset="dataset" :rows="visible" :selected-code="selected" @select="selected=$event"/></details>
    <section class="panel overview-transparency"><div><div class="section-label">TRANSPARENCIA DEL ANÁLISIS</div><h2>Qué podemos decir hoy</h2><p>Los datos permiten identificar necesidades y observar dónde hay registros de la CVP. El escenario de necesidad, presencia y brecha es exploratorio; la brecha real de atención y la priorización oficial siguen pendientes de validación.</p></div><div><details open><summary>Cómo se calculan los indicadores</summary><p>Los porcentajes publicados de la EM 2021 se muestran con sus denominadores cuando están disponibles. El índice exploratorio combina cuatro dimensiones relativas con pesos iguales. El escenario V1 propone 80 % de necesidad física y 20 % de pobreza monetaria normalizada. Jefatura femenina y pobreza multidimensional siguen como contexto.</p></details><details><summary>Cómo se calculan los nuevos índices</summary><p>Necesidad ajustada = 80 % del índice físico + 20 % de vulnerabilidad económica basada en pobreza monetaria. Presencia promedia cinco índices de densidad publicados, con transformación logarítmica y normalización sobre todos los dominios. Brecha = necesidad ajustada − presencia. Una brecha negativa no demuestra exceso de ayuda; cero no significa necesidad resuelta. Los pesos son una propuesta.</p><a class="text-button" :href="`${baseURL}documents/escenario-exploratorio-v1.md`" download>Descargar fórmulas y limitaciones</a></details><details><summary>Qué significa presencia publicada</summary><p>Cada línea registra unidades y períodos diferentes; no se suman como beneficiarios únicos. El escenario de presencia promedia cinco densidades transformadas con log(1 + tasa) y normalizadas. La brecha relativa resta ese escenario a la necesidad ajustada; no es una brecha real de atención validada.</p></details><details><summary>Fuentes, límites y reproducción</summary><p>CSV: {{ dataset.source.name }}. Cartografía agrupada por códigos; correspondencia histórica con EM 2021 pendiente de validación SIG. Los datos faltantes se conservan.</p><button class="text-button" @click="emit('navigate','metodologia')">Consultar metodología y fuentes <ArrowUpRight :size="14"/></button></details></div></section>
  </div>
</template>
