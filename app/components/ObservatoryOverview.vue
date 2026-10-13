<script setup lang="ts">
import { ArrowUpRight, Download } from 'lucide-vue-next'
import type { Dataset, Row } from '../types/data'
import { lines } from '../types/data'
import { format, formatDecimal, integral, value } from '../utils/analytics'
import { availableIndicators, explorerValue, presenceFilter } from '../utils/explorer'
import { download, exportRows } from '../utils/csv'
import { consolidatedField } from '../utils/consolidation'
import { scenarioRows } from '../utils/scenario'
const props=defineProps<{dataset:Dataset;rows:Row[];filters:{locality:string;domain:string;line:string;search:string};configured:boolean}>()
const baseURL=useRuntimeConfig().app.baseURL
const emit=defineEmits<{updateFilters:[filters:Partial<typeof props.filters>];reset:[];select:[code:string];navigate:[id:string]}>()
const reportBusy=ref(false), reportError=ref(''), showHazards=ref(false)
async function exportReport(){
  reportBusy.value=true;reportError.value=''
  const scope={dataset:props.dataset,rows:[...visible.value],territory:territory.value,locality:props.filters.locality,metric:metric.value,metricLabel:indicator.value?.label||metric.value,presenceFilter:presence.value==='0'?'Sin registros publicados':presence.value ? 'Al menos '+presence.value+' líneas' : 'Cualquier cantidad'}
  try{const {downloadTerritorialReport}=await import('../utils/territorial-report');await downloadTerritorialReport(scope,baseURL)}
  catch(error){reportError.value=error instanceof Error?error.message:'No se pudo generar el reporte.'}
  finally{reportBusy.value=false}
}
const metric=ref('scenario:gap'), presence=ref(''), selected=ref(''), sort=ref<'value'|'name'>('value'), descending=ref(true), page=ref(1)
const indicators=computed(()=>availableIndicators(props.dataset))
watch(indicators,items=>{if(!items.some(i=>i.key===metric.value))metric.value=items[0]?.key||'necesidad'},{immediate:true})
const isGapMetric=computed(()=>metric.value==='final:brecha' || metric.value==='scenario:gap')
const indicator=computed(()=>indicators.value.find(i=>i.key===metric.value)!)
const schema=computed(()=>props.dataset.schema)
const displayLines=['vivienda','titulacion','barrios','reasentamientos','curaduria'].map(key=>lines.find(line=>line.key===key)!)
const get=(r:Row,key:string)=>value(r,schema.value,key)
const presenceNote=(key:string)=>({vivienda:'Plan Terrazas · ejecutados o en ejecución · estados 2021–2024',curaduria:'Predios con acto de reconocimiento · fechas 2021–2024',titulacion:'Predios titulados únicos · histórico 2015–2025',barrios:'Tramos registrados · contratos 2020–2023; estados heterogéneos',reasentamientos:'Procesos terminados · histórico; fecha de terminación no disponible'}[key] || 'Presencia')
const localities=computed(()=>[...new Set(props.dataset.rows.map(r=>String(get(r,'localidad')??'')).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es')))
const checklistSearch=ref(''), checkedCodes=ref<string[]>([])
const checklistDomains=computed(()=>props.dataset.rows.filter(r=>!props.filters.locality || String(get(r,'localidad'))===props.filters.locality).sort((a,b)=>String(get(a,'nombre')).localeCompare(String(get(b,'nombre')),'es')))
watch(checklistDomains,rows=>{checkedCodes.value=rows.map(r=>String(get(r,'codigo')));checklistSearch.value=''}, {immediate:true})
const normalizeSearch=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()
const checklistResults=computed(()=>{const query=normalizeSearch(checklistSearch.value);return checklistDomains.value.filter(r=>normalizeSearch([get(r,'nombre'),get(r,'codigo'),r.codigos_upz].join(' ')).includes(query))})
const allChecked=computed(()=>checklistDomains.value.length>0 && checklistDomains.value.every(r=>checkedCodes.value.includes(String(get(r,'codigo')))))
const partlyChecked=computed(()=>checkedCodes.value.length>0 && !allChecked.value)
function toggleAll(e:Event){checkedCodes.value=(e.target as HTMLInputElement).checked ? checklistDomains.value.map(r=>String(get(r,'codigo'))) : []}
const visible=computed(()=>props.rows.filter(r=>checkedCodes.value.includes(String(get(r,'codigo'))) && presenceFilter(r,props.dataset,presence.value)))
const localitySummary=computed(()=>props.dataset.status==='final' && visible.value.length>0)
const consolidatedChartRow=computed<Row>(()=>{
  const row:Row={}
  for(const field of ['indice_necesidad','indice_presencia','brecha','ind_tenencia','ind_vivienda','ind_entorno','ind_vulnerabilidad','pct_amenaza_alta']){
    const n=consolidatedField(visible.value,props.dataset,field)
    row[field]=n===null?null:field.startsWith('ind_')?n/100:n
  }
  if(props.dataset.schema.nombre)row[props.dataset.schema.nombre]=props.filters.locality ? 'Consolidado de '+props.filters.locality : 'Consolidado de los territorios seleccionados'
  return row
})
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
watch(visible,rs=>{page.value=1;selected.value=''},{immediate:true})
watch([metric,sort,descending],()=>{page.value=1})
const sample=computed(()=>sumColumn(props.dataset.status==='final'?'hogares_muestra':'n_hogares_muestra'))
const households=computed(()=>sumColumn(props.dataset.status==='final'?'hogares_expandidos':'hogares_expandidos_em2021'))
const contextCards=computed(()=>[
  {label:'Territorios en la selección',value:props.configured ? format(visible.value.length) : '—',note:visible.value.length+' territorios estadísticos'},
  {label:'Hogares encuestados',value:format(sample.value),note:'Respondieron la encuesta'},
  {label:'Hogares representados',value:format(households.value===null ? null : Math.round(households.value)),note:'Total estimado a partir de la muestra'},
  {label:'Fecha del análisis',value:props.dataset.status==='final' ? '11/10/2026' : props.dataset.source.date || 'Sin dato',note:'Encuesta EM 2021 · programas con períodos distintos'}
])
function sumColumn(column:string){const vals=visible.value.map(r=>typeof r[column]==='number'?r[column] as number:null).filter((v):v is number=>v!==null);return vals.length?vals.reduce((a,b)=>a+b,0):null}
const validSample=computed(()=>{const key=metric.value.startsWith('raw:')?`n_validos_${metric.value.slice(4).replace('pct_','')}`:'';return territory.value&&key?territory.value[key]:null})
const metricDisplay=(r:Row)=>{const v=metricValue(r);return v===null?'Sin dato':`${(metric.value==='integralidad' || metric.value==='final:integralidad' ? format(v) : formatDecimal(v))}${metric.value.startsWith('final:')?(indicator.value?.unit.startsWith('%')?' %':''):metric.value.startsWith('raw:')?' %':metric.value==='integralidad'?'/5':' pts'}`}
function update(key:'locality'|'search',e:Event){selected.value='';emit('updateFilters',{[key]:(e.target as HTMLInputElement).value,domain:'',search:''})}
function reset(){showHazards.value=false;presence.value='';selected.value='';checklistSearch.value='';checkedCodes.value=checklistDomains.value.map(r=>String(get(r,'codigo')));emit('reset')}
function orderBy(key:'name'|'value'){if(sort.value===key)descending.value=!descending.value;else{sort.value=key;descending.value=key==='value'}}
function exportSelection(){const scenario=scenarioRows(props.dataset);download('ubik2_seleccion.csv',exportRows(visible.value.map(r=>({...r,...scenario.get(r)}))),'text/csv;charset=utf-8')}
</script>
<template>
  <div class="observatory-overview">
    <div class="overview-heading"><div><div class="section-label">OBSERVATORIO TERRITORIAL / BOGOTÁ</div><h1>Bogotá, territorio a territorio.</h1><p>Cada lugar tiene una historia. Descubre la suya en los datos.</p></div></div>
    <ExplorationIntro :final="dataset.status==='final'"/>
    <div v-if="!dataset.analysis && dataset.status!=='final'" class="stats-grid overview-stats"><StatCard v-for="card in contextCards" :key="card.label" :label="card.label" :value="card.value" :note="card.note"/></div>
    <TerritoryResults v-if="dataset.analysis||dataset.status==='final'" :row="territory" :rows="visible" :scope-label="filters.locality ? `Consolidado de ${filters.locality} · ${visible.length} territorios visibles` : `Consolidado general de la selección · ${visible.length} territorios visibles`" :dataset="dataset" :metric="metric" @indicator="metric=$event"><template #context><StatCard v-for="card in contextCards" :key="card.label" :label="card.label" :value="card.value" :note="card.note"/></template></TerritoryResults>
    <ContextIndicators v-if="dataset.status!=='final'" :row="territory" :dataset="dataset" prominent :metric="metric" @indicator="metric=$event"/>
    <div class="overview-explorer">
      <section id="explorar-territorio" tabindex="-1" class="panel overview-filters" aria-label="Filtros del mapa"><div class="section-label">1. ELIGE UN TERRITORIO</div><p class="filter-intro">¿Qué lugar quieres conocer?</p>
        <label>Localidad<select aria-label="Localidad del mapa" :value="filters.locality" :disabled="!configured" @change="update('locality',$event)"><option value="">Toda la selección disponible</option><option v-for="l in localities" :key="l">{{ l }}</option></select></label>
        <fieldset class="upz-checklist"><legend>Territorio</legend><label>Buscar territorio<input aria-label="Buscar territorio" v-model="checklistSearch" placeholder="Nombre del territorio" :disabled="!configured"></label>
          <label class="upz-check-option"><input type="checkbox" aria-label="Seleccionar todos los territorios" :checked="allChecked" :indeterminate="partlyChecked" :disabled="!configured || !checklistDomains.length" @change="toggleAll">Seleccionar todos</label>
          <div class="upz-check-options"><label v-for="r in checklistResults" :key="String(get(r,'codigo'))" class="upz-check-option"><input type="checkbox" v-model="checkedCodes" :value="String(get(r,'codigo'))" :aria-label="`Incluir territorio ${get(r,'nombre')}`" :disabled="!configured">{{ get(r,'nombre') }}</label><p v-if="!checklistResults.length" class="muted">No hay coincidencias.</p></div>
          <p class="chart-footnote">{{ checkedCodes.length }} de {{ checklistDomains.length }} territorios seleccionados.</p>
        </fieldset>
        <label>Indicador del mapa<select aria-label="Indicador del mapa" v-model="metric"><option v-for="i in indicators" :key="i.key" :value="i.key">{{ i.label }}</option></select></label>
        <div v-if="indicator" class="indicator-description"><strong>{{ indicator.label }}</strong><details><summary>Qué significa</summary><p>{{ indicator.description }}</p></details><small>{{ indicator.unit }}</small></div>
        <label>Líneas CVP con registros<select aria-label="Líneas CVP con registros" v-model="presence"><option value="">Cualquier cantidad</option><option value="0">Sin registros publicados</option><option value="1">Al menos 1 línea</option><option value="3">Al menos 3 líneas</option><option value="5">Las 5 líneas</option></select></label>
        <div v-if="dataset.status==='final'" class="hazard-filter"><label class="check-label"><input v-model="showHazards" type="checkbox">Amenaza por movimientos en masa · IDIGER (alta y media)</label></div>
        <button class="outline" @click="reset">Restablecer filtros</button>
        <p class="chart-footnote">{{ visible.length }} dominios en la selección · {{ dataset.rows.length }} en el archivo.</p>
        <p v-if="filters.domain || filters.line" class="notice">Hay filtros adicionales de dominio o línea activos. Restablécelos para ampliar la consulta.</p>
      </section>
      <div class="overview-map-column">
        <ClientOnly><LazyTerritorialMap v-model:show-hazards="showHazards" :dataset="dataset" :rows="visible" :line="filters.line" :metric-key="metric" :metric-label="indicator?.label" :selected-code="selected" compact @select="selected=$event"/><template #fallback><section class="panel loading">Preparando mapa territorial…</section></template></ClientOnly>
        <TerritoryCharts v-if="territory" :row="territory" :dataset="dataset" @indicator="metric=$event"/><TerritoryCharts v-else-if="localitySummary" :row="consolidatedChartRow" :dataset="dataset" consolidated @indicator="metric=$event"/>
      </div>
      <section class="panel overview-territory" aria-label="Territorio seleccionado">
        <div class="section-label">{{ territory ? 'TERRITORIO SELECCIONADO' : localitySummary ? 'CONSOLIDADO DE LA LOCALIDAD' : 'TERRITORIO SELECCIONADO' }}</div>
        <template v-if="territory"><h2>{{ get(territory,'nombre') }}</h2><button class="text-button" @click="selected=''">Limpiar selección territorial</button><dl class="territory-identity"><div><dt>Territorio</dt><dd>{{ get(territory,'nombre') }}</dd></div><div><dt>Localidad</dt><dd>{{ get(territory,'localidad') }}</dd></div></dl>
          <div class="territory-highlight"><p>{{ indicator?.label }}</p><strong>{{ metricDisplay(territory) }}</strong><small v-if="validSample!==null && validSample!==undefined">{{ format(validSample) }} hogares con respuesta válida en la muestra</small><small v-else-if="!isGapMetric">{{ indicator?.unit }}</small></div>
          <h3>Presencia CVP</h3><div class="territory-presence"><div v-for="l in displayLines" :key="l.key"><span>{{ l.label }}<small>{{ dataset.status==='final' ? presenceNote(l.key) : l.key==='vivienda'?'Solo Plan Terrazas · registros':l.key==='barrios'?'Elementos físicos publicados':'Registros publicados' }}</small></span><strong>{{ format(get(territory,`registros_${l.key}`)) }}</strong></div></div>
          <p class="notice">Las líneas usan unidades y períodos distintos. Los registros no equivalen a hogares atendidos ni a cobertura completa.</p>
          <button class="text-button" @click="emit('select',String(get(territory,'codigo')))">Ver ficha completa <ArrowUpRight :size="15"/></button>
        </template><template v-else-if="localitySummary"><h2>{{ filters.locality || 'Territorios seleccionados' }}</h2><p class="muted">Consolidado de {{ visible.length }} territorios visibles</p><LocalityConsolidation :dataset="dataset" :rows="visible" :metric="metric"/></template><EmptyState v-else title="Selecciona un territorio" description="Elige un dominio del mapa o de la tabla. Si no hay resultados, restablece los filtros."/>
      </section>
    </div>
    <NeedPresenceScatter v-if="dataset.analysis||dataset.status==='final'" :dataset="dataset" :rows="visible" :selected-code="selected" @select="selected=$event"/>
    <section id="comparar-territorios" tabindex="-1" class="panel overview-comparison"><div class="panel-heading"><div><div class="section-label">LEE LOS DATOS EN CONTEXTO</div><h2>Compara territorios</h2><p>{{ indicator?.label }} · {{ indicator?.unit }}</p><p>Pulsa un nombre y descubre su historia.</p></div><button class="outline" :disabled="!visible.length" @click="exportSelection"><Download :size="15"/>Exportar selección</button></div>
      <div class="comparison-grid"><div class="overview-ranking"><div class="section-label">10 MAYORES VALORES DE LA SELECCIÓN</div><button v-for="r in highest" :key="String(get(r,'codigo'))" :aria-label="`Seleccionar ${get(r,'nombre')}`" :class="{selected:String(get(r,'codigo'))===selected}" @click="selected=String(get(r,'codigo'))"><span :title="String(get(r,'nombre'))">{{ get(r,'nombre') }}</span><i><b :style="{width:`${max>0?100*(metricValue(r)??0)/max:0}%`}"/></i><strong>{{ metricDisplay(r) }}</strong></button><p v-if="!highest.length" class="muted">Sin valores disponibles para este indicador.</p></div>
      <div><div class="table-scroll"><table><caption class="sr-only">Comparación territorial · {{ indicator?.label }}</caption><thead><tr><th :aria-sort="sort==='name'?(descending?'descending':'ascending'):'none'"><button @click="orderBy('name')">Territorio ↕</button></th><th>Localidad</th><th :class="{ 'gap-column': isGapMetric }" :aria-sort="sort==='value'?(descending?'descending':'ascending'):'none'"><button @click="orderBy('value')">{{ isGapMetric ? 'Brecha' : indicator?.label || 'Valor' }} ↕</button></th><th>Líneas CVP</th></tr></thead><tbody><tr v-for="r in shown" :key="String(get(r,'codigo'))" :class="{selected:String(get(r,'codigo'))===selected}"><th><button class="territory-name" :aria-label="`Seleccionar territorio ${get(r,'nombre')}`" @click="selected=String(get(r,'codigo'))">{{ get(r,'nombre') }}</button></th><td>{{ get(r,'localidad') }}</td><td :class="{ 'gap-column': isGapMetric }">{{ metricDisplay(r) }}</td><td>{{ format(integral(r,schema)) }}/5</td></tr></tbody></table></div><EmptyState v-if="!shown.length" title="No hay dominios en esta selección" description="Prueba otra búsqueda o restablece los filtros."/><div class="pagination"><span>{{ visible.length }} territorios</span><div><button class="icon-button" aria-label="Página anterior de comparación" :disabled="page===1" @click="page--">‹</button><span>Página {{ page }} de {{ pages }}</span><button class="icon-button" aria-label="Página siguiente de comparación" :disabled="page===pages" @click="page++">›</button></div></div></div></div>
    </section>
    <details class="panel additional-comparison"><summary>Explorar otras relaciones entre indicadores</summary><ScatterComparison :dataset="dataset" :rows="visible" :selected-code="selected" @select="selected=$event"/></details>
    <section v-if="dataset.status==='final'" class="panel overview-transparency overview-file-summary"><div><h2>Archivo final de brecha</h2><p>La necesidad promedia cinco dimensiones normalizadas: tenencia, vivienda, entorno, amenaza alta y vulnerabilidad. La presencia promedia cinco líneas normalizadas. Brecha = necesidad menos presencia, en escala de -1 a 1. Las categorías son quintiles del archivo completo: 19 territorios por categoría; los filtros no las recalculan.</p><p>La vulnerabilidad representa hogares con jefatura femenina en pobreza monetaria. Los indicadores de encuesta se muestran como porcentajes, multiplicados por 100. Los porcentajes de amenaza ya están en escala 0 a 100.</p><p>La brecha compara Índices relativos; no mide hogares pendientes de atención.</p></div><div class="source-download-buttons"><a class="outline" :href="`${baseURL}data/upz_brecha_95.geojson`" download><Download :size="16"/>Descargar GeoJSON final</a><a class="outline" :href="`${baseURL}data/diccionario_campos_upz_brecha_95.csv`" download><Download :size="16"/>Descargar diccionario</a><a class="outline" :href="`${baseURL}data/idiger_amenaza_mm_urbano.geojson`" download><Download :size="16"/>Descargar amenaza IDIGER</a></div></section><section v-else class="panel overview-transparency"><div><div class="section-label">TRANSPARENCIA DEL ANÁLISIS</div><h2>Qué podemos decir hoy</h2><p>Los datos permiten identificar necesidades y observar dónde hay registros de la CVP. El escenario de necesidad, presencia y brecha es exploratorio; la brecha real de atención y la priorización oficial siguen pendientes de validación.</p></div><div><details open><summary>Cómo se calculan los indicadores</summary><p>Los porcentajes publicados de la EM 2021 se muestran con sus denominadores cuando están disponibles. El índice exploratorio combina cuatro dimensiones relativas con pesos iguales. El escenario V1 propone 80 % de necesidad física y 20 % de pobreza monetaria normalizada. Jefatura femenina y pobreza multidimensional siguen como contexto.</p></details><details><summary>Cómo se calculan los nuevos índices</summary><p>Necesidad ajustada = 80 % del índice físico + 20 % de vulnerabilidad económica basada en pobreza monetaria. Presencia promedia cinco índices de densidad publicados, con transformación logarítmica y normalización sobre todos los dominios. Brecha = necesidad ajustada − presencia. Una brecha negativa no demuestra exceso de ayuda; cero no significa necesidad resuelta. Los pesos son una propuesta.</p><a class="text-button" :href="`${baseURL}documents/escenario-exploratorio-v1.md`" download>Descargar fórmulas y limitaciones</a></details><details><summary>Qué significa presencia publicada</summary><p>Cada línea registra unidades y períodos diferentes; no se suman como beneficiarios únicos. El escenario de presencia promedia cinco densidades transformadas con log(1 + tasa) y normalizadas. La brecha relativa resta ese escenario a la necesidad ajustada; no es una brecha real de atención validada.</p></details><details><summary>Fuentes, límites y reproducción</summary><p>CSV: {{ dataset.source.name }}. Cartografía agrupada por códigos; correspondencia histórica con EM 2021 pendiente de validación SIG. Los datos faltantes se conservan.</p><button class="text-button" @click="emit('navigate','metodologia')">Consultar metodología y fuentes <ArrowUpRight :size="14"/></button></details></div></section>
    <section v-if="dataset.status==='final'" class="panel exploration-report" aria-labelledby="exploration-report-title">
      <div><h2 id="exploration-report-title">Llévate tu exploración</h2><p>Un reporte de {{ territory ? get(territory,'nombre') : visible.length+' territorios seleccionados' }} con los datos de tu consulta.</p></div>
      <button class="outline" :disabled="reportBusy || !visible.length" @click="exportReport"><Download :size="16"/>{{ reportBusy ? 'Generando reporte…' : 'Descargar reporte PDF' }}</button>
      <p v-if="reportError" class="notice error" role="alert">{{ reportError }}</p>
    </section>
  </div>
</template>

<style scoped>
.overview-transparency.overview-file-summary { display: block; }
.overview-file-summary .source-download-buttons { margin-top: 20px; }
.source-download-buttons { display: flex; flex-wrap: wrap; gap: 12px; }
.source-download-buttons a { min-height: 44px; text-decoration: none; }
@media(max-width:760px) { .source-download-buttons a { width: 100%; justify-content: center; } }
.hazard-filter .check-label { flex-direction: row; align-items: flex-start; line-height: 1.6; }
.hazard-filter input[type="checkbox"] { width: 16px; height: 16px; min-height: 0; margin-top: 3px; flex-shrink: 0; }
@media(max-width:760px) { .hazard-filter { grid-column: 1/-1; } }
.exploration-report { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 18px; }
.exploration-report h2 { font-size: 20px; }
.exploration-report p { margin-top: 8px; font-size: 13px; color: #526375; }
.exploration-report>.error { width: 100%; margin: 0; }
@media(max-width:760px) { .exploration-report>.outline { width: 100%; } }
.upz-checklist { border: 0; padding: 0; margin: 0; min-width: 0; }
.upz-checklist legend { font-size: 12px; margin-bottom: 8px; }
.upz-check-options { max-height: 180px; overflow-y: auto; }
.overview-filters .upz-check-option { display: flex; flex-direction: row; align-items: flex-start; gap: 8px; margin: 8px 0; cursor: pointer; }
.overview-filters .upz-check-option input[type="checkbox"] { width: 16px; height: 16px; min-height: 0; margin: 0; flex-shrink: 0; }
</style>
