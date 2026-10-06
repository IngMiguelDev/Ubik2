<script setup lang="ts">
import { dimensions, lines, type Dataset, type Row } from '../types/data'
import { format, value, need, integral } from '../utils/analytics'
const props = defineProps<{ row: Row; dataset: Dataset }>()
const v = (key: string) => value(props.row, props.dataset.schema, key)
const pending = (key: string) => v(key) === null ? 'Pendiente de validación' : String(v(key))
</script>
<template>
  <article class="panel territory-card">
    <div class="section-label">FICHA TERRITORIAL · EM 2021</div><h2>{{ v('nombre') }}</h2><p>{{ v('localidad') }} · Código {{ v('codigo') }} · {{ v('tipo') }}</p>
    <div class="notice">Las estimaciones corresponden al dominio completo. Una agrupación de UPZ no se desagrega entre sus integrantes.</div>
    <div class="mapping-grid mt-5"><StatCard v-for="d in dimensions" :key="d" :label="d" :value="format(v(d))" note="Valor original · unidad según diccionario"/></div>
    <p>El dominio {{ v('nombre') }} presenta un índice exploratorio de {{ format(need(row, dataset.rows, dataset.schema)) }} con pesos iguales. El número de líneas con registros es {{ format(integral(row, dataset.schema)) }}. Esta descripción no establece relaciones causales.</p>
    <div class="table-scroll"><table><caption>Presencia publicada por línea</caption><thead><tr><th>Línea</th><th>Registros</th><th>Tasa publicada</th><th>IDs distintos</th><th>Ejecutadas</th></tr></thead><tbody><tr v-for="line in lines" :key="line.key"><th>{{ line.label }}</th><td>{{ format(v(`registros_${line.key}`)) }}</td><td>{{ format(v(`tasa_${line.key}`)) }}</td><td>{{ format(v(`distintos_${line.key}`)) }}</td><td>{{ pending(`ejecutada_${line.key}`) }}</td></tr></tbody></table></div>
    <dl class="facts"><div><dt>Pobreza · contexto</dt><dd>{{ format(v('pobreza')) }}</dd></div><div><dt>Jefatura femenina · contexto</dt><dd>{{ format(v('jefatura')) }}</dd></div><div><dt>Brecha validada</dt><dd>{{ pending('brecha') }}</dd></div><div><dt>Ranking validado</dt><dd>{{ pending('ranking') }}</dd></div><div><dt>Fuente</dt><dd>{{ v('fuente') ?? dataset.source.name }}</dd></div><div><dt>Corte</dt><dd>{{ v('corte') ?? dataset.source.date ?? 'Sin verificar' }}</dd></div><div><dt>Limitaciones del archivo</dt><dd>{{ v('limitaciones') ?? 'Pendiente de revisar con el PDF y el diccionario' }}</dd></div></dl>
    <p class="muted">Pobreza y jefatura femenina no se incorporan al índice. Los registros misionales tienen períodos heterogéneos y no representan cobertura efectiva ni beneficiarios únicos. La encuesta corresponde a 2021.</p>
  </article>
</template>
