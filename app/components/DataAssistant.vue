<script setup lang="ts">
import { MessageCircle, Send, Download, RotateCcw } from 'lucide-vue-next'
import type { Dataset, Row } from '../types/data'
import { askData, type AssistantAnswer } from '../utils/assistant'
import { format } from '../utils/analytics'
import { download } from '../utils/csv'
interface AIEvidence { id:number; source:string; fields:string[]; description:string; result:Record<string,unknown> }
interface AIResponse { text:string; evidence:AIEvidence[]; model:string; engine:string; source:string; scope:string }
const props = defineProps<{ dataset: Dataset; rows: Row[]; configured: boolean; loading: boolean }>()
defineEmits<{ select: [code: string] }>()
const question = ref(''), scope = ref<'all' | 'filtered'>('all'), previousCodes = ref<string[]>([]), mode=ref<'ai'|'local'>('ai')
const pending=ref(false), connection=ref<'checking'|'ready'|'unavailable'>('checking'), aiError=ref('')
const config=useRuntimeConfig()
const endpoint=String(config.public.aiBaseUrl||`${config.app.baseURL}api/assistant`).replace(/\/$/,'')
const messages = ref<{ question: string; answer: AssistantAnswer; engine:'local'|'openai'; evidence?:AIEvidence[]; model?:string }[]>([])
const history = ref<HTMLElement>()
const suggestions = ['¿Cuáles son los 5 dominios con mayor necesidad?', '¿Cuántos registros de Barrios hay en Usaquén?', 'Compara la necesidad de UPZ 9 y UPZ 11', '¿Cómo se calcula la brecha?', '¿Qué significa vulnerabilidad?']
watch(() => props.dataset, () => clear(), { deep: false })
watch(scope, () => { previousCodes.value = [] })
watch(mode,()=>{previousCodes.value=[];aiError.value=''})
watch(() => props.rows, () => { if (scope.value === 'filtered') previousCodes.value = [] })
const canSend=computed(()=>props.configured&&!props.loading&&!pending.value&&(mode.value==='local'||(connection.value==='ready'&&Boolean(props.dataset.analysis))))
onMounted(checkConnection)
async function checkConnection(){
  connection.value='checking'
  if(String(config.public.aiEnabled)!=='true'&&!config.public.aiBaseUrl){connection.value='unavailable';return}
  try{const status=await $fetch<{ready:boolean}>(`${endpoint}/status`,{timeout:10000});connection.value=status.ready?'ready':'unavailable'}catch{connection.value='unavailable'}
}
function clear() { messages.value = []; previousCodes.value = []; question.value = ''; aiError.value='' }
async function send(text = question.value) {
  if (!text.trim() || !canSend.value) return
  const asked=text.slice(0,2000),datasetAtStart=props.dataset
  aiError.value='';pending.value=true
  try{
    if(mode.value==='local'){
      const answer=askData(asked,props.dataset,props.rows,scope.value,previousCodes.value)
      messages.value.push({question:asked,answer,engine:'local'});previousCodes.value=answer.matchedCodes
    }else{
      const history=messages.value.filter(m=>m.engine==='openai').slice(-6).flatMap(m=>[{role:'user' as const,content:m.question},{role:'assistant' as const,content:m.answer.text.slice(0,6000)}])
      const response=await $fetch<AIResponse>(`${endpoint}/chat`,{method:'POST',body:{question:asked,history,scopeCodes:scope.value==='all'?null:props.rows.map(r=>String(r[props.dataset.schema.codigo!]??''))},timeout:120000,retry:0})
      if(props.dataset!==datasetAtStart)return
      messages.value.push({question:asked,engine:'openai',model:response.model,evidence:response.evidence,answer:{text:response.text,note:'Respuesta de IA basada en las consultas y fuentes mostradas debajo.',fields:[...new Set(response.evidence.flatMap(e=>e.fields))],items:[],metric:'',scope:response.scope,source:response.source,matchedCodes:[]}})
    }
    question.value=''
    nextTick(()=>{if(history.value)history.value.scrollTop=history.value.scrollHeight})
  }catch(e){const error=e as {data?:{statusMessage?:string};message?:string};aiError.value=error.data?.statusMessage||'No se pudo obtener la respuesta de IA. Reintenta; tu pregunta se conserva.'}
  finally{pending.value=false}
}
function exportConversation() { download('ubik2_consultas.json', JSON.stringify({ exportedAt: new Date().toISOString(), messages: messages.value }, null, 2), 'application/json') }
function evidenceLabel(name:string){return name==='query_data'?'Consulta de indicadores':name==='read_methodology'?'Propuesta y metodología':'Intervenciones de Barrios'}
</script>
<template>
  <section class="panel assistant" aria-label="Asistente de datos">
    <div class="panel-heading"><div><h2><MessageCircle :size="20"/>Pregunta al territorio</h2><p>Pregunta con tus propias palabras. La IA consulta los archivos compartidos y explica sus resultados.</p></div><span class="tag">{{ mode==='ai' ? (connection==='ready'?'IA · OpenAI':connection==='checking'?'Comprobando conexión…':'IA pendiente de conexión') : 'Consulta básica · local' }}</span></div>
    <p class="assistant-intro">Puedes comparar zonas, explorar relaciones entre indicadores, consultar cifras o pedir explicaciones del método. El asistente de IA conserva el contexto de la conversación y muestra las consultas, los datos y las páginas que sustentan cada respuesta.</p>
    <div v-if="mode==='ai' && connection==='unavailable'" class="notice assistant-connection"><p><strong>La IA todavía no está conectada en esta instalación.</strong> El administrador debe activar la conexión en el servidor. Puedes usar mientras tanto las consultas básicas locales.</p><button class="text-button" @click="mode='local'">Usar consulta básica</button><button class="text-button" @click="checkConnection">Comprobar conexión</button></div>
    <p v-if="mode==='ai' && !dataset.analysis" class="notice">La IA consulta los archivos compartidos del observatorio. Para el CSV alternativo cargado en esta sesión usa la consulta básica local.</p>
    <div class="assistant-controls"><label>Tipo de asistente<select v-model="mode" aria-label="Tipo de asistente" :disabled="pending"><option value="ai">IA · preguntas libres sobre los archivos compartidos</option><option value="local">Consulta básica · reglas locales</option></select></label></div>
    <div class="assistant-controls"><label>Alcance de las preguntas<select v-model="scope" aria-label="Alcance de las preguntas" :disabled="pending"><option value="all">Archivo completo · {{ dataset.rows.length }} dominios</option><option value="filtered">Filtros actuales · {{ rows.length }} dominios</option></select></label><button class="text-button" :disabled="!messages.length || pending" @click="clear"><RotateCcw :size="14"/>Limpiar conversación</button><button class="outline" :disabled="!messages.length" @click="exportConversation"><Download :size="15"/>Descargar conversación</button></div>
    <div class="assistant-suggestions" aria-label="Preguntas sugeridas"><button v-for="s in suggestions" :key="s" class="outline" :disabled="!canSend" @click="send(s)">{{ s }}</button></div>
    <div ref="history" class="assistant-history" role="log" aria-label="Conversación de datos" aria-live="polite" aria-relevant="additions" tabindex="0">
      <p v-if="!messages.length" class="muted">Empieza con una pregunta sugerida o escribe la tuya. Puedes continuar con «y vivienda» para consultar los mismos territorios.</p>
      <article v-for="(m, i) in messages" :key="i" class="assistant-message">
        <p class="assistant-question"><strong>Tú</strong> {{ m.question }}</p>
        <div class="assistant-answer"><strong>UBiK2 · {{ m.engine==='openai'?'IA':'consulta básica' }}</strong><p class="answer-text">{{ m.answer.text }}</p>
          <div v-if="m.answer.items.length" class="table-scroll"><table><caption>{{ m.answer.metric }}</caption><thead><tr><th>Dominio</th><th>Localidad</th><th>Valor</th><th>Consulta</th></tr></thead><tbody><tr v-for="item in m.answer.items" :key="item.code"><th>{{ item.name }}<small class="block muted">Código {{ item.code }} · {{ item.grouped ? 'Agrupación completa' : 'Dominio completo' }}</small></th><td>{{ item.locality }}</td><td>{{ format(item.value) }}</td><td><button class="text-button" @click="$emit('select',item.code)">Ver ficha</button></td></tr></tbody></table></div>
          <p v-if="m.answer.note" class="notice">{{ m.answer.note }}</p>
          <details v-for="evidence in m.evidence" :key="evidence.id" class="assistant-evidence"><summary>[{{evidence.id}}] {{evidenceLabel(evidence.description)}} · {{evidence.source}}</summary><p v-if="evidence.fields.length">Campos consultados: {{evidence.fields.join(', ')}}</p><pre>{{JSON.stringify(evidence.result,null,2)}}</pre></details>
          <details class="assistant-evidence"><summary>Datos y alcance de esta respuesta</summary><p>{{ m.answer.scope }}<br>Archivo: {{ m.answer.source }}</p><p>Campos: {{ m.answer.fields.length ? m.answer.fields.join(', ') : 'Explicación del modelo o consulta sin resultado numérico' }}</p></details>
        </div>
      </article>
    </div>
    <p v-if="pending" role="status" class="notice">Consultando los archivos y preparando la respuesta…</p><p v-if="aiError" role="alert" class="notice error">{{aiError}}</p>
    <form class="assistant-form" @submit.prevent="send()"><label for="assistant-question">Tu pregunta<textarea id="assistant-question" v-model="question" rows="3" maxlength="2000" placeholder="Ej.: ¿Dónde coinciden pobreza alta y viviendas que necesitan mejoras? Explícamelo con los datos." :disabled="!configured || loading || pending" @keydown.enter.exact.prevent="send()"/></label><div><small>Enter para consultar · Shift + Enter para una nueva línea</small><button class="primary" type="submit" :disabled="!question.trim() || !canSend"><Send :size="16"/>Consultar datos</button></div></form>
    <p class="chart-footnote">{{mode==='ai'?'La IA recibe tu pregunta, el contexto de la conversación y los resultados pertinentes de los archivos publicados. Las claves permanecen en el servidor.':'La consulta básica procesa preguntas habituales en tu navegador mediante reglas.'}} No interpreta códigos sin diccionario ni completa datos faltantes. Las respuestas previas conservan su alcance.</p>
  </section>
</template>
