<script setup lang="ts">
import { MapPinned, ChartNoAxesCombined, Scale, CalendarDays, Map, Files, ListFilter, ShieldCheck } from 'lucide-vue-next'
defineProps<{ step: number; label: string }>()
const icons = [MapPinned, ChartNoAxesCombined, Scale, CalendarDays, Map, Files, ListFilter, ShieldCheck]
</script>
<template>
  <figure class="method-illustration" role="img" :aria-label="label">
    <svg class="illustration-scene" viewBox="0 0 200 150" aria-hidden="true">
      <rect x="16" y="18" width="168" height="114" rx="22" fill="#fff8de"/>
      <path d="M25 109h150M44 32v84M158 32v84" stroke="#efddb0" stroke-dasharray="4 5"/>
      <circle cx="100" cy="73" r="43" fill="#FFDE09" opacity=".35"/>
      <rect x="30" y="89" width="13" height="20" rx="3" fill="#F7B325"/>
      <rect x="48" y="78" width="13" height="31" rx="3" fill="#E3351F" opacity=".8"/>
      <circle cx="159" cy="44" r="9" fill="#AA1023"/>
      <circle cx="173" cy="70" r="4" fill="#F7B325"/>
      <path d="m142 112 11 6 11-6" fill="none" stroke="#AA1023" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <component :is="icons[step-1] || MapPinned" :size="54" :stroke-width="1.6" class="illustration-symbol" aria-hidden="true"/>
  </figure>
</template>
<style scoped>
.method-illustration { position: relative; margin: 0; width: 200px; max-width: 100%; aspect-ratio: 4 / 3; }
.illustration-scene { width: 100%; height: 100%; }
.illustration-symbol { position: absolute; top: 30%; left: 36%; width: 28%; height: 36%; color: #AA1023; }
</style>
