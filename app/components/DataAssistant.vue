<script setup lang="ts">
import { MessageCircle, Send, Download, RotateCcw } from 'lucide-vue-next'
import type { Dataset, Row } from '../types/data'
import { askData, type AssistantAnswer } from '../utils/assistant'
import { format } from '../utils/analytics'
import { download } from '../utils/csv'
const props = defineProps<{ dataset: Dataset; rows: Row[]; configured: boolean; loading: boolean }>()
defineEmits<{ select: [code: string] }>()
const question = ref(''), scope = ref<'all' | 'filtered'>('all'), previousCodes = ref<string[]>([])
const messages = ref<{ question: string; answer: AssistantAnswer }[]>([])
const history = ref<HTMLElement>()
const suggestions = ['¿Cuáles son los 5 dominios con mayor necesidad?', '¿Cuántos registros de Barrios hay en Usaquén?', 'Compara la necesidad de UPZ 9 y UPZ 11', '¿Cómo se calcula la brecha?', '¿Qué significa vulnerabilidad?']
watch(() => props.dataset, () => clear(), { deep: false })
watch(scope, () => { previousCodes.value = [] })
watch(() => props.rows, () => { if (scope.value === 'filtered') previousCodes.value = [] })
function clear() { messages.value = []; previousCodes.value = []; question.value = '' }
function send(text = question.value) {
  if (!text.trim() || !props.configured || props.loading) return
  const answer = askData(text.slice(0, 1000), props.dataset, props.rows, scope.value, previousCodes.value)
  messages.value.push({ question: text.slice(0, 1000), answer }); previousCodes.value = answer.matchedCodes
  question.value = ''
  nextTick(() => { if (history.value) history.value.scrollTop = history.value.scrollHeight })
}
function exportConversation() { download('ubik2_consultas.json', JSON.stringify({ exportedAt: new Date().toISOString(), engine: 'consultas-locales', messages: messages.value }, null, 2), 'application/json') }
</script>
<template>
  <section class="panel assistant" aria-label="Asistente de datos">
    <div class="panel-heading"><div><h2><MessageCircle :size="20"/>Pregunta al territorio</h2><p>Consultas en lenguaje natural, con cifras y campos de origen.</p></div><span class="tag">Consulta local</span></div>
    <p class="assistant-intro">Consulta necesidad, registros por línea o diferencias entre territorios. Funciona con preguntas habituales mediante reglas locales; puede pedirte reformular. Cada respuesta usa los datos cargados en esta sesión y conserva sus limitaciones.</p>
    <div class="assistant-controls"><label>Alcance de las preguntas<select v-model="scope" aria-label="Alcance de las preguntas"><option value="all">Archivo completo · {{ dataset.rows.length }} dominios</option><option value="filtered">Filtros actuales · {{ rows.length }} dominios</option></select></label><button class="text-button" :disabled="!messages.length" @click="clear"><RotateCcw :size="14"/>Limpiar conversación</button><button class="outline" :disabled="!messages.length" @click="exportConversation"><Download :size="15"/>Descargar conversación</button></div>
    <div class="assistant-suggestions" aria-label="Preguntas sugeridas"><button v-for="s in suggestions" :key="s" class="outline" :disabled="!configured || loading" @click="send(s)">{{ s }}</button></div>
    <div ref="history" class="assistant-history" role="log" aria-label="Conversación de datos" aria-live="polite" aria-relevant="additions" tabindex="0">
      <p v-if="!messages.length" class="muted">Empieza con una pregunta sugerida o escribe la tuya. Puedes continuar con «y vivienda» para consultar los mismos territorios.</p>
      <article v-for="(m, i) in messages" :key="i" class="assistant-message">
        <p class="assistant-question"><strong>Tú</strong> {{ m.question }}</p>
        <div class="assistant-answer"><strong>UBiK2</strong><p class="answer-text">{{ m.answer.text }}</p>
          <div v-if="m.answer.items.length" class="table-scroll"><table><caption>{{ m.answer.metric }}</caption><thead><tr><th>Dominio</th><th>Localidad</th><th>Valor</th><th>Consulta</th></tr></thead><tbody><tr v-for="item in m.answer.items" :key="item.code"><th>{{ item.name }}<small class="block muted">Código {{ item.code }} · {{ item.grouped ? 'Agrupación completa' : 'Dominio completo' }}</small></th><td>{{ item.locality }}</td><td>{{ format(item.value) }}</td><td><button class="text-button" @click="$emit('select',item.code)">Ver ficha</button></td></tr></tbody></table></div>
          <p v-if="m.answer.note" class="notice">{{ m.answer.note }}</p>
          <details class="assistant-evidence"><summary>Datos y alcance de esta respuesta</summary><p>{{ m.answer.scope }}<br>Archivo: {{ m.answer.source }}</p><p>Campos: {{ m.answer.fields.length ? m.answer.fields.join(', ') : 'Explicación del modelo o consulta sin resultado numérico' }}</p></details>
        </div>
      </article>
    </div>
    <form class="assistant-form" @submit.prevent="send()"><label for="assistant-question">Tu pregunta<textarea id="assistant-question" v-model="question" rows="3" maxlength="1000" placeholder="Ej.: ¿Qué dominios tienen mayor riesgo en la localidad de Usme?" :disabled="!configured || loading" @keydown.enter.exact.prevent="send()"/></label><div><small>Enter para consultar · Shift + Enter para una nueva línea</small><button class="primary" type="submit" :disabled="!question.trim() || !configured || loading"><Send :size="16"/>Consultar datos</button></div></form>
    <p class="chart-footnote">Las preguntas se procesan en tu navegador, sin enviar los archivos a una IA externa. No interpreta códigos sin diccionario ni completa datos faltantes. Las respuestas previas conservan el alcance con que fueron consultadas.</p>
  </section>
</template>
