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
    <div class="mapping-grid mt-5"><StatCard v-for="d in dimensions" :key="d" :label="d" :value="format(v(d))" :note="dataset.analysis ? 'Índice relativo del CSV · 0–100' : 'Valor original · unidad según diccionario'"/></div>
    <OriginalIndicators v-if="dataset.analysis" :row="row"/>
    <ContextIndicators :row="row" :dataset="dataset"/>
    <p>El dominio {{ v('nombre') }} presenta un índice exploratorio de {{ format(need(row, dataset.rows, dataset.schema)) }} con pesos iguales. El número de líneas con registros es {{ format(integral(row, dataset.schema)) }}. Esta descripción no establece relaciones causales.</p>
    <div class="table-scroll"><table><caption>Presencia publicada por línea; tasas de Barrios por km², las demás por 1.000 hogares EM 2021</caption><thead><tr><th>Línea</th><th>Registros</th><th>Tasa publicada</th><th>IDs distintos</th><th>Ejecutadas validadas</th></tr></thead><tbody><tr v-for="line in lines" :key="line.key"><th>{{ line.label }}</th><td>{{ format(v(`registros_${line.key}`)) }}</td><td>{{ format(v(`tasa_${line.key}`)) }}</td><td>{{ format(v(`distintos_${line.key}`)) }}</td><td>{{ pending(`ejecutada_${line.key}`) }}</td></tr></tbody></table></div>
    <div v-if="dataset.analysis" class="notice mt-5">Vivienda limitada a Plan Terrazas. El archivo reporta {{ format(row.vivienda_asistencia_ejecutada) }} asistencias técnicas ejecutadas, {{ format(row.vivienda_programados) }} programadas y {{ format(row.vivienda_en_ejecucion) }} en ejecución. Asistencia técnica ejecutada no se equipara a obra de mejoramiento terminada ni a presencia ejecutada validada.</div>
    <dl class="facts"><div><dt>Brecha validada</dt><dd>{{ pending('brecha') }}</dd></div><div><dt>Ranking validado</dt><dd>{{ pending('ranking') }}</dd></div><div><dt>Fuente</dt><dd>{{ v('fuente') ?? dataset.source.name }}</dd></div><div><dt>{{ dataset.analysis ? 'Validación preliminar (no corte común)' : 'Corte declarado' }}</dt><dd>{{ v('corte') ?? dataset.source.date ?? 'Sin verificar' }}</dd></div><div><dt>Limitaciones del archivo</dt><dd>{{ v('limitaciones') ?? 'Pendiente de revisar con el PDF y el diccionario' }}</dd></div></dl>
    <dl v-if="dataset.analysis" class="facts"><div><dt>UPZ integrantes del dominio</dt><dd>{{ row.codigos_upz }}</dd></div><div><dt>Hogares de la muestra</dt><dd>{{ format(row.n_hogares_muestra) }}</dd></div><div><dt>Hogares expandidos EM 2021</dt><dd>{{ format(row.hogares_expandidos_em2021) }}</dd></div><div><dt>Área del dominio</dt><dd>{{ format(row.area_km2) }} km²</dd></div><div><dt>Presencia ejecutada desde 2021</dt><dd>{{ pending('presencia_validada') }}</dd></div><div><dt>Riesgo integrado validado</dt><dd>{{ pending('riesgo_integrado') }}</dd></div></dl>
    <details v-if="dataset.analysis" class="original-indicators"><summary>Campos de riesgo POT sin etiquetas verificadas</summary><p v-for="key in ['pct_area_condicion_riesgo_masa_codigo_3','pct_area_amenaza_inundacion_codigo_1','pct_area_amenaza_inundacion_codigo_2','pct_area_amenaza_inundacion_codigo_3']" :key="key">{{ key }}: {{ format(row[key]) }} %</p><p>No se interpretan como riesgo alto, medio o bajo. El índice integrado validado permanece pendiente.</p></details>
    <p class="muted">Pobreza y jefatura femenina no se incorporan al índice. Los registros misionales tienen períodos heterogéneos y no representan cobertura efectiva ni beneficiarios únicos. La encuesta corresponde a 2021.</p>
  </article>
</template>
