<script setup lang="ts">
import { dimensions, lines, type Dataset, type Schema } from '../types/data'
const props = defineProps<{ dataset: Dataset }>()
const emit = defineEmits<{ apply: [schema: Schema, source: Dataset['source']] }>()
const mapping = reactive<Schema>({ ...props.dataset.schema })
const source = reactive({ ...props.dataset.source })
const fields = computed(() => [
  ...[['codigo','Código de dominio'],['nombre','Nombre del dominio'],['localidad','Localidad'],['tipo','Tipo de dominio'],['fuente','Fuente de la fila'],['corte','Corte de la fila'],['limitaciones','Limitaciones de la fila']],
  ...dimensions.map(k => [k, `Dimensión: ${k}`]),
  ...[['pobreza','Pobreza (contexto)'],['jefatura','Jefatura femenina (contexto)']],
  ...lines.flatMap(l => [[`registros_${l.key}`, `Registros: ${l.label}`], [`tasa_${l.key}`, `Tasa publicada: ${l.label}`], [`distintos_${l.key}`, `Identificadores distintos: ${l.label}`], [`ejecutada_${l.key}`, `Actuaciones ejecutadas: ${l.label}`]]),
  ...[['brecha','Brecha validada'],['ranking','Ranking validado']]
])
function save() { emit('apply', Object.fromEntries(Object.entries(mapping).filter(([, v]) => v)), source) }
</script>
<template>
  <details class="panel mapper" :open="!dataset.schema.codigo">
    <summary>Asignar columnas del CSV <span class="muted">· {{ dataset.columns.length }} columnas · {{ dataset.rows.length }} filas</span></summary>
    <p>Usa el diccionario del archivo. Los nombres no se adivinan. Las dimensiones deben ser indicadores numéricos comparables, no códigos de estado o riesgo.</p>
    <form @submit.prevent="save">
      <div class="mapping-grid">
        <label v-for="[key, label] in fields" :key="key">{{ label }}<select :aria-label="label" v-model="mapping[key!]" :required="['codigo','nombre','localidad','tipo'].includes(key!)"><option value="">Sin asignar</option><option v-for="column in dataset.columns" :key="column" :value="column">{{ column }}</option></select></label>
      </div>
      <div class="mapping-grid mt-5"><label v-for="key in dimensions" :key="key">Mayor necesidad en {{ key }}<select :aria-label="`Mayor necesidad en ${key}`" v-model="mapping[`direccion_${key}`]"><option value="">Pendiente de verificar</option><option value="alta">Valores altos</option><option value="baja">Valores bajos</option></select></label></div>
      <div class="mapping-grid mt-5"><label>Nombre de fuente<input v-model="source.name" required></label><label>Fecha de corte<input v-model="source.date" type="date"></label><label>Licencia verificada<input v-model="source.license" placeholder="Sin verificar"></label></div>
      <p class="muted">Se conservan los códigos como texto. Solo los indicadores asignados se convierten a número. Pobreza y jefatura femenina no forman parte del índice exploratorio.</p>
      <button class="primary" type="submit">Aplicar asignación</button>
    </form>
  </details>
</template>
