<script setup lang="ts">
import { ArrowDown, MapPin, ChartColumn, FileCheck } from 'lucide-vue-next'
defineProps<{ final: boolean }>()
function goTo(id: string) {
  const element = document.getElementById(id)
  element?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
  element?.focus({ preventScroll: true })
}
</script>
<template>
  <section class="exploration-intro" aria-labelledby="intro-title">
    <div class="intro-story">
      <div class="section-label">UNA HISTORIA EN TRES DATOS</div>
      <h2 id="intro-title">¿Qué nos cuentan estos datos?</h2>
    </div>
    <div class="intro-concepts">
      <article><span class="concept-number">01</span><div><h3>¿Dónde está la necesidad?</h3><p>Las condiciones de los hogares.</p><span class="concept-key">NECESIDAD</span></div></article>
      <article><span class="concept-number">02</span><div><h3>¿Dónde aparece la CVP?</h3><p>Los registros de sus programas.</p><span class="concept-key">PRESENCIA</span></div></article>
      <article><span class="concept-number">03</span><div><h3>¿Qué diferencia encontramos?</h3><p>Necesidad menos presencia.</p><span class="concept-key">BRECHA</span></div></article>
    </div>
  </section>
  <nav class="exploration-route" aria-label="Pasos para explorar los datos">
    <button @click="goTo('explorar-territorio')"><MapPin :size="20"/><strong>1. Elige un territorio</strong><ArrowDown :size="16"/></button>
    <button @click="goTo('leer-resultados')"><ChartColumn :size="20"/><strong>2. Descubre su historia</strong><ArrowDown :size="16"/></button>
    <button @click="goTo('comparar-territorios')"><FileCheck :size="20"/><strong>3. Compara y consulta</strong><ArrowDown :size="16"/></button>
  </nav>
</template>
