<script setup lang="ts">
import type { Row } from '../types/data'
import { numeric,format } from '../utils/analytics'
const props=defineProps<{ rows:Row[] }>()
const states=[['vivienda_programados','Programados'],['vivienda_en_ejecucion','En ejecución'],['vivienda_asistencia_ejecutada','Asistencia técnica ejecutada'],['vivienda_no_ejecutables','No ejecutables']]
const sum=(key:string)=>{const values=props.rows.map(r=>numeric(r[key])).filter((v):v is number=>v!==null);return values.length?values.reduce((a,b)=>a+b,0):null}
</script>
<template><div class="original-indicators"><h3>¿Cómo van los registros de Plan Terrazas?</h3><div class="mapping-grid mt-5"><StatCard v-for="[key,label] in states" :key="key" :label="label!" :value="format(sum(key!))" note="Registros publicados; no porcentaje de hogares atendidos"/></div><p>Una asistencia técnica realizada no significa que la obra esté terminada. Aún falta validar el índice de actuaciones ejecutadas desde 2021. Tampoco podemos confirmar ejecuciones a partir de códigos de Barrios o Reasentamientos sin un diccionario que los explique.</p></div></template>
