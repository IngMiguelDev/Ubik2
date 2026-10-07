<script setup lang="ts">
import type { Dataset, Row } from '../types/data'
import { explorerValue } from '../utils/explorer'
defineProps<{ row: Row; dataset: Dataset }>()
const emit = defineEmits<{ indicator: [key: string] }>()
const items = [{ key:'tenencia',label:'Tenencia' },{ key:'vivienda',label:'Vivienda' },{ key:'entorno',label:'Entorno' },{ key:'riesgo',label:'Riesgo reportado' },{ key:'scenario:vulnerability',label:'Vulnerabilidad económica' }]
const display = (v: number | null) => v === null ? 'Sin dato' : `${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 }).format(v)} pts`
</script>
<template><section class="dimension-profile"><h3>Las cinco dimensiones</h3><button v-for="item in items" :key="item.key" :disabled="explorerValue(row,dataset,item.key) === null" @click="emit('indicator',item.key)"><span>{{ item.label }}</span><strong>{{ display(explorerValue(row,dataset,item.key)) }}</strong></button></section></template>
