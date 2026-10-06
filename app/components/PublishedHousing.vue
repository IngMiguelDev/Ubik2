<script setup lang="ts">
import type { Row } from '../types/data'
import { numeric,format } from '../utils/analytics'
const props=defineProps<{ rows:Row[] }>()
const states=[['vivienda_programados','Programados'],['vivienda_en_ejecucion','En ejecución'],['vivienda_asistencia_ejecutada','Asistencia técnica ejecutada'],['vivienda_no_ejecutables','No ejecutables']]
const sum=(key:string)=>{const values=props.rows.map(r=>numeric(r[key])).filter((v):v is number=>v!==null);return values.length?values.reduce((a,b)=>a+b,0):null}
</script>
<template><div class="original-indicators"><h3>Plan Terrazas · estados reportados en el CSV</h3><div class="mapping-grid mt-5"><StatCard v-for="[key,label] in states" :key="key" :label="label!" :value="format(sum(key!))" note="Registro reportado · no cobertura efectiva"/></div><p>La asistencia técnica ejecutada no equivale a obra terminada. El índice de presencia ejecutada desde 2021 permanece pendiente de validación. No se deducen ejecuciones de los códigos de Barrios o Reasentamientos.</p></div></template>
