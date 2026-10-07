<script setup lang="ts">
import L from 'leaflet'
import type { FeatureCollection } from 'geojson'
import { dimensions, type Dataset, type Row } from '../types/data'
import { value, numeric, format, need, integral } from '../utils/analytics'
import { availableIndicators, explorerValue } from '../utils/explorer'
const props=defineProps<{ dataset:Dataset; rows:Row[]; line:string; compact?:boolean; metricKey?:string; metricLabel?:string; selectedCode?:string }>()
const emit=defineEmits<{ select:[code:string] }>()
const config=useRuntimeConfig()
const contextIndicators=computed(()=>availableIndicators(props.dataset).filter(i=>['raw:pct_jefatura_femenina','raw:pct_pobreza_monetaria_hogares','raw:pct_pobreza_multidimensional_hogares'].includes(i.key)))
const host=ref<HTMLElement>(), geo=shallowRef<FeatureCollection>(), interventions=shallowRef<FeatureCollection>()
const key=ref(''), error=ref(''), loading=ref(false), indicator=ref('necesidad'), provenance=ref(''), acknowledged=ref(false), showInterventions=ref(false), official=ref(false)
const matched=ref(0), interventionCount=ref(0)
const fields=computed(()=>[...new Set(geo.value?.features.flatMap(f=>Object.keys(f.properties||{}))||[])])
const ready=computed(()=>Boolean(geo.value&&key.value&&acknowledged.value&&provenance.value))
let map:L.Map|undefined, layer:L.GeoJSON|undefined, works:L.GeoJSON|undefined, observer:ResizeObserver|undefined
let destroyed=false, drawVersion=0
const metric=(r:Row)=>explorerValue(r,props.dataset,props.metricKey || (indicator.value==='presencia'?`registros_${props.line||'barrios'}`:indicator.value))
const vals=computed(()=>props.dataset.rows.map(metric).filter((v):v is number=>v!==null))
const isGap=computed(()=>props.metricKey==='scenario:gap')
const lo=computed(()=>vals.value.length?Math.min(...vals.value):null),hi=computed(()=>vals.value.length?Math.max(...vals.value):null)
const overlayAllowed=computed(()=>!props.line||props.line==='barrios')
const visibleGeo=computed(()=>({type:'FeatureCollection' as const,features:geo.value?.features.filter(f=>props.rows.some(r=>String(value(r,props.dataset.schema,'codigo'))===String(f.properties?.[key.value])))||[]}))
function color(v:number|null) {if(v===null||lo.value===null||hi.value===null)return '#d7d5d5';if(isGap.value){const t=Math.min(Math.abs(v)/Math.max(Math.abs(lo.value),Math.abs(hi.value),1),1),end=v>=0?[180,25,20]:[25,104,166];return `rgb(${end.map(c=>Math.round(245+(c-245)*t)).join(',')})`}const t=hi.value===lo.value?0:(v-lo.value)/(hi.value-lo.value);return ['#ffedbb','#ffd180','#ffab50','#fa722e','#ef321c','#9f160e'][Math.min(5,Math.floor(t*6))]!}
async function loadOfficial() {
  if(!props.dataset.analysis)return
  loading.value=true;error.value=''
  try {
    const [domains,polygons]=await Promise.all([$fetch<FeatureCollection>(`${config.app.baseURL}data/dominios.geojson`,{responseType:'json'}),$fetch<FeatureCollection>(`${config.app.baseURL}data/intervenciones-barrios.geojson`,{responseType:'json'})])
    if(destroyed)return
    if(domains.type!=='FeatureCollection'||!Array.isArray(domains.features)||polygons.type!=='FeatureCollection'||!Array.isArray(polygons.features))throw new Error('Formato GeoJSON inválido')
    geo.value=domains;interventions.value=polygons;key.value='codigo_dominio_em';provenance.value='SDP / Catastro Distrital · CC BY 4.0 · consulta 2026-10-06';acknowledged.value=true;official.value=true
  }catch(e){error.value=`No se pudo cargar la cartografía: ${(e as Error).message}`}
  finally{if(!destroyed){loading.value=false;await draw()}}
}
async function upload(e:Event) {
  error.value=''
  try {
    const file=(e.target as HTMLInputElement).files?.[0];if(!file)return
    const data=JSON.parse(await file.text())
    if(data.type!=='FeatureCollection'||!Array.isArray(data.features)||!data.features.length)throw new Error('Carga un FeatureCollection de polígonos de dominios completos.')
    function coords(v:any):boolean{if(!Array.isArray(v)||!v.length)return false;if(typeof v[0]==='number')return v.length>=2&&Number.isFinite(v[0])&&Number.isFinite(v[1])&&Math.abs(v[0])<=180&&Math.abs(v[1])<=90;return v.every(coords)}
    if(data.features.some((f:any)=>!['Polygon','MultiPolygon'].includes(f.geometry?.type)||!coords(f.geometry.coordinates)))throw new Error('Se requieren polígonos WGS84 (longitud/latitud).')
    geo.value=data;key.value='';acknowledged.value=false;provenance.value='';official.value=false
  }catch(e){error.value=(e as Error).message}
}
function tooltip(text:string){const div=document.createElement('div');div.textContent=text;return div}
async function draw() {
  const version=++drawVersion
  if(destroyed)return
  if(!ready.value){layer?.remove();works?.remove();matched.value=0;return}
  await nextTick();if(destroyed||version!==drawVersion||!host.value)return
  if(!map){map=L.map(host.value,{zoomControl:!props.compact,zoomSnap:props.compact ? 0.1 : 1,zoomAnimation:false,fadeAnimation:false,markerZoomAnimation:false}).setView([4.65,-74.1],10);observer=new ResizeObserver(()=>{if(!destroyed)map?.invalidateSize()});observer.observe(host.value)}
  layer?.remove();works?.remove();matched.value=visibleGeo.value.features.length;interventionCount.value=0
  layer=L.geoJSON(visibleGeo.value,{
    style:f=>{const code=String(f?.properties?.[key.value]);const r=props.rows.find(r=>String(value(r,props.dataset.schema,'codigo'))===code);return{color:code===props.selectedCode?'#263443':'#ffffff',weight:code===props.selectedCode?2.5:1,fillOpacity:.95,fillColor:color(r?metric(r):null)}},
    onEachFeature:(f,shape)=>{const code=String(f.properties?.[key.value]??'');const r=props.rows.find(r=>String(value(r,props.dataset.schema,'codigo'))===code);if(!r)return;shape.bindTooltip(tooltip(`${value(r,props.dataset.schema,'nombre')} · ${format(metric(r))} · ${value(r,props.dataset.schema,'tipo')} · dominio completo`));shape.on('click',()=>emit('select',code))}
  }).addTo(map)
  if(showInterventions.value&&overlayAllowed.value&&interventions.value){
    const localities=new Set(props.rows.map(r=>r.codigo_localidad).filter(v=>v!==null&&v!==undefined).map(v=>String(Number(v))))
    const features=interventions.value.features.filter(f=>localities.has(String(Number(f.properties?.loccodigo))))
    interventionCount.value=features.length
    works=L.geoJSON({type:'FeatureCollection',features} as FeatureCollection,{style:{color:'#203a6b',weight:2,fillColor:'#203a6b',fillOpacity:.85},onEachFeature:(f,shape)=>{
      const p=f.properties||{};const info=tooltip(`Elemento ${p.id_element} · intervención ${p.id_interve} · ${p.nomenclatu} · localidad ${p.loccodigo} · año ${p['año_contr']} · estado_con: código ${p.estado_con} (sin etiqueta validada)`)
      shape.bindTooltip(info);shape.bindPopup(info.cloneNode(true) as HTMLElement)
    }}).addTo(map)
  }
  const bounds=layer.getBounds();if(bounds.isValid())map.fitBounds(bounds,{padding:[20,20],animate:false});map.invalidateSize()
}
onMounted(loadOfficial)
watch([geo,key,indicator,provenance,acknowledged,showInterventions,()=>props.rows,()=>props.line,()=>props.metricKey],draw)
watch(()=>props.selectedCode,()=>{layer?.eachLayer(shape=>{const path=shape as L.Path & {feature?:{properties?:Record<string,unknown>}};const selected=String(path.feature?.properties?.[key.value])===props.selectedCode;path.setStyle({color:selected?'#263443':'#ffffff',weight:selected?2.5:1});if(selected)path.bringToFront()})})
onBeforeUnmount(()=>{destroyed=true;drawVersion++;observer?.disconnect();map?.remove();map=undefined})
</script>
<template>
  <section class="panel" :class="{ 'overview-map': compact }">
    <div class="panel-heading"><div><h2>{{ compact ? 'Mapa de indicadores' : 'Explorador geográfico' }}</h2><p>{{ compact ? `${rows.length} territorios visibles · ${metricLabel}` : 'Dominios completos de la EM 2021 · agrupación por códigos del CSV' }}</p></div><div v-if="compact" class="map-zoom"><button class="outline" aria-label="Acercar mapa" @click="map?.zoomIn()">+</button><button class="outline" aria-label="Alejar mapa" @click="map?.zoomOut()">−</button><button class="outline" aria-label="Restablecer vista del mapa" @click="draw">⌂</button></div><label v-else class="upload-button">Cargar otro GeoJSON<input type="file" accept=".geojson,.json" @change="upload"></label></div>
    <div v-if="!compact" class="mapping-grid"><label>Indicador<select aria-label="Indicador" v-model="indicator"><option value="necesidad">Necesidad exploratoria · 0–100</option><option v-for="d in dimensions" :key="d" :value="d">{{ d }} · índice relativo</option><option v-for="i in contextIndicators" :key="i.key" :value="i.key">{{ i.label }} · % de hogares</option><option value="presencia">Registros · línea seleccionada o Barrios</option><option value="integralidad">Integralidad · 0–5 líneas</option></select></label><label v-if="geo&&!official">Propiedad con código de dominio<select aria-label="Propiedad con código de dominio" v-model="key"><option value="">Selecciona una propiedad</option><option v-for="f in fields" :key="f">{{ f }}</option></select></label><label v-if="geo&&!official">Procedencia oficial / licencia<input v-model="provenance" placeholder="URL y licencia verificadas"></label></div>
    <label v-if="geo&&!official" class="check-label"><input v-model="acknowledged" type="checkbox">Confirmo que son geometrías oficiales de dominios completos; las agrupaciones están unidas y no se desagregan.</label>
    <label v-if="interventions&&!compact" class="check-label"><input v-model="showInterventions" :disabled="!overlayAllowed" type="checkbox">Superponer elementos de Barrios del GeoJSON adjunto (filtrado solo por localidad)</label>
    <div v-if="official&&!compact" class="notice mt-5">95 dominios construidos con 112 UPZ de la capa oficial SDP/Catastro. Las agrupaciones se muestran completas. La correspondencia por código está verificada; la equivalencia de límites con la EM 2021 requiere validación SIG.</div>
    <p v-if="loading" role="status">Cargando cartografía oficial…</p><p v-if="error" role="alert" class="notice error">{{ error }} <button class="text-button" @click="loadOfficial">Reintentar</button></p>
    <EmptyState v-if="!loading&&!ready" title="Geometrías pendientes de verificación" description="Carga polígonos de dominios completos con procedencia documentada. Los elementos de intervención CVP no son límites de dominios."/>
    <div class="map-viewport"><div ref="host" v-show="ready" class="map" aria-label="Mapa de dominios territoriales"/><p v-if="compact&&ready" class="map-instructions">Selecciona un territorio · arrastra para mover · usa + / − para acercar</p></div>
    <div v-if="ready" class="map-legend" :class="{ 'gap-legend': isGap }"><span>Menor: {{ format(lo) }}</span><i/><span>Mayor: {{ format(hi) }}</span><span class="muted">Gris: sin dato · {{ matched }} geometrías coincidentes</span></div>
    <div v-if="showInterventions&&overlayAllowed" class="notice mt-5">Azul: {{ interventionCount }} elementos cartográficos de Barrios en las localidades seleccionadas. El adjunto contiene 557 elementos y 233 IDs de intervención distintos; el CSV contiene 494 registros y 206 IDs distintos agregados por dominio. No se sustituyen ni suman ambos conjuntos. No hay cruce espacial de actuaciones validado por dominio y los códigos de estado permanecen sin interpretar.</div>
    <p v-if="!compact" class="muted mt-5">{{ provenance }}. Selecciona un dominio en el mapa o abre su ficha desde la tabla mediante teclado. Un valor de necesidad es exploratorio, no una priorización institucional.</p>
  </section>
</template>
