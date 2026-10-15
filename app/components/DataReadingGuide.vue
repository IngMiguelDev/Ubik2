<script setup lang="ts">
const baseURL=useRuntimeConfig().app.baseURL
const isOpen=defineModel<boolean>({default:false})
const dialog=ref<HTMLDialogElement | null>(null)
watch(isOpen,async value=>{
  await nextTick()
  const element=dialog.value
  if(!element)return
  if(value && !element.open)element.showModal()
  else if(!value && element.open)element.close()
},{flush:'post'})
function close(){isOpen.value=false}
function backdrop(event:MouseEvent){const element=dialog.value;if(!element || event.target!==element)return;const box=element.getBoundingClientRect();if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)close()}
</script>
<template>
  <dialog ref="dialog" class="reading-guide" aria-labelledby="reading-guide-title" @click="backdrop" @cancel="isOpen=false" @close="isOpen=false">
    <div class="guide-header"><div class="guide-brand"><img :src="`${baseURL}brand/ubik2.png`" alt="UBiK2"><div><div class="section-label">OBSERVATORIO TERRITORIAL</div><h2 id="reading-guide-title">Cómo leer los datos</h2></div></div><button class="outline" autofocus @click="close" aria-label="Cerrar explicación">Cerrar</button></div><div class="guide-content">
    <p>Este mapa ayuda a comparar las condiciones de los hogares y los registros de la Caja de la Vivienda Popular en distintos territorios de Bogotá.</p>
    <div class="guide-quickstart"><strong>Tu primera consulta, en cuatro pasos</strong><ol><li>En <b>Localidad</b>, elige el lugar que quieres consultar.</li><li>Marca las <b>UPZ o agrupaciones</b> que te interesan. Las tarjetas resumen lo que has marcado.</li><li>Elige un <b>Indicador del mapa</b> y pulsa un territorio para ver sus datos individuales.</li><li>Revisa <b>Compara territorios</b>. Usa “Descargar selección (CSV)” para obtener el CSV o “Descargar reporte PDF” para guardar un reporte.</li></ol><p>Para empezar de nuevo, pulsa “Restablecer filtros”. Para volver del territorio individual al resumen, pulsa “Volver al resumen”.</p></div>
    <h3>1. Elige qué quieres ver</h3>
    <p>Al elegir una localidad se marcan sus UPZ. Puedes marcar varias casillas para comparar esos territorios o verlos en conjunto. La búsqueda encuentra nombres y códigos en la lista; no desmarca lo que ya elegiste.</p>
    <p>Las tarjetas y la ficha empiezan mostrando un resumen de los territorios que elegiste. Al pulsar una UPZ en el mapa o en la tabla, muestran sus datos individuales. Pulsa “Volver al resumen” para ver de nuevo toda tu selección. Algunas UPZ forman una agrupación de la encuesta: sus resultados se leen juntos.</p>
    <h3>2. Entiende los tres índices</h3>
    <p><strong>Necesidad:</strong> resume condiciones de tenencia, vivienda, entorno, amenaza alta por movimientos en masa y jefatura femenina en pobreza monetaria. Va de 0 a 1: un valor mayor indica mayor necesidad relativa entre los territorios estudiados. No es un porcentaje de hogares.</p>
    <p><strong>Presencia CVP:</strong> resume los registros de cinco líneas de actuación, ajustados por los hogares representados y llevados a una escala de 0 a 1. Un valor mayor indica mayor presencia relativa en los datos utilizados. No es el porcentaje de hogares atendidos.</p>
    <p><strong>Brecha = necesidad menos presencia.</strong> Si la necesidad es 0,60 y la presencia 0,20, la brecha es 0,40. Es un ejemplo ilustrativo, no un dato de una UPZ. Una brecha positiva indica que el índice de necesidad supera al de presencia; una negativa indica lo contrario. Cero no significa que todos los problemas estén resueltos.</p>
    <h3>3. Interpreta el mapa y los porcentajes</h3>
    <p>En el mapa de brecha, amarillo claro indica categorías menores, amarillo dorado la categoría Media y rojo categorías mayores. “Muy baja” a “Muy alta” comparan la brecha de los 95 territorios, en cinco grupos de 19. Una brecha muy baja puede coexistir con necesidad alta. Los grupos no cambian al filtrar. Para otros indicadores, consulta la leyenda del mapa.</p>
    <p>Un 12 % de hogares significa aproximadamente 12 de cada 100 hogares representados. “Jefatura femenina” aquí mide hogares con jefatura femenina <strong>en pobreza monetaria</strong>, sobre todos los hogares. No mide toda la jefatura femenina. Los porcentajes de amenaza describen <strong>área del territorio</strong>, no hogares.</p>
    <h3>4. Lee el resumen de tu selección</h3>
    <p>Para reunir varios territorios, sumamos sus registros. Al calcular promedios, los territorios con más hogares representados pesan más. En amenaza, damos más peso a los de mayor área. Estos resúmenes ayudan a leer los valores publicados; no son nuevos índices oficiales. El resumen no recibe una posición ni un grupo de color: esas clasificaciones corresponden a cada territorio. Una tasa por 1.000 hogares compara registros con ese número de hogares; no es un porcentaje.</p>
    <h3>5. Ten presente la fecha y el alcance</h3>
    <p>La encuesta es de 2021. Las líneas CVP tienen períodos distintos, detallados en Metodología y fuentes. Vivienda incluye Plan Terrazas ejecutado o en ejecución; otras líneas cuentan predios, procesos o tramos. No se suman como personas beneficiadas. Cero registros significa que no aparecen en las capas utilizadas; “Sin dato” significa información faltante.</p>
    <p>La brecha ayuda a explorar dónde profundizar. No cuenta hogares pendientes de ayuda ni demuestra cobertura completa. La amenaza mostrada corresponde a movimientos en masa, no a todos los riesgos.</p>
    <details class="guide-glossary"><summary>Diccionario rápido: palabras que verás en la plataforma</summary><dl><dt>UPZ</dt><dd>Unidad de Planeamiento Zonal: un conjunto de barrios de Bogotá.</dd><dt>Territorio estadístico</dt><dd>Territorio para el que la encuesta publica un resultado. Puede ser una UPZ o una agrupación de varias.</dd><dt>Muestra</dt><dd>Hogares que respondieron la encuesta.</dd><dt>Hogares representados</dt><dd>Total de hogares que representa la encuesta. Cada hogar que respondió representa a otros con características similares.</dd><dt>Índice</dt><dd>Medida que combina y ajusta varios indicadores para comparar territorios. Un índice de 0,60 no significa 60 % de hogares.</dd><dt>Quintil</dt><dd>Uno de cinco grupos de igual tamaño al ordenar los territorios. En este archivo, cada grupo reúne 19 territorios.</dd><dt>Consolidado</dt><dd>Una mirada conjunta a los territorios que elegiste. Sumamos los registros y damos más peso a los territorios con más hogares representados al promediar los índices.</dd><dt>CVP y EM</dt><dd>Caja de la Vivienda Popular y Encuesta Multipropósito, respectivamente.</dd></dl></details>
    </div><div class="guide-footer"><span>Caja de la Vivienda Popular · Bogotá</span><button class="primary" @click="close">Entendido</button></div>
  </dialog>
</template>
<style scoped>
.reading-guide { position: fixed; inset: 0; margin: auto; width: min(760px, calc(100vw - 32px)); max-height: calc(100dvh - 48px); box-sizing: border-box; overflow: hidden; border: 1px solid #dce3ed; border-top: 4px solid #fa241a; border-radius: 12px; padding: 0; background: white; color: #202a35; font: inherit; box-shadow: 0 20px 70px rgb(20 30 45 / 25%); }
.reading-guide[open] { display: flex; flex-direction: column; }
.reading-guide::backdrop { background: rgb(20 30 45 / 45%); }
.guide-header { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 20px 24px; border-bottom: 1px solid #dce3ed; flex-shrink: 0; }
.guide-brand { display: flex; align-items: center; gap: 14px; }
.guide-brand img { width: 46px; height: 58px; object-fit: contain; }
.reading-guide h2 { margin: 6px 0 0; font-size: 22px; }
.guide-content { overflow-y: auto; min-height: 0; padding: 8px 24px 20px; }
.reading-guide h3 { margin: 22px 0 8px; font-size: 16px; padding-left: 10px; border-left: 3px solid #ffc400; }
.reading-guide p { line-height: 1.65; font-size: 14px; margin: 12px 0; }
.guide-quickstart { background: #f0f5f8; border: 1px solid #dce6ed; border-radius: 10px; padding: 18px; margin-top: 18px; }
.guide-quickstart ol { padding-left: 22px; margin: 12px 0; list-style: decimal; }
.guide-quickstart li { font-size: 14px; line-height: 1.7; margin-bottom: 10px; }
.guide-glossary { border-top: 1px solid #dce3ed; padding: 18px 0; margin-top: 24px; }
.guide-glossary summary { cursor: pointer; font-weight: 650; font-size: 15px; }
.guide-glossary dt { margin-top: 16px; font-weight: 700; font-size: 14px; }
.guide-glossary dd { margin: 4px 0 0; font-size: 14px; line-height: 1.65; }
.guide-footer { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 24px; background: #fff9ed; border-top: 1px solid #f0dfb8; flex-shrink: 0; }
.guide-footer span { font-size: 12px; }
@media (max-width: 480px) { .guide-header, .guide-footer { padding: 14px 16px; } .guide-content { padding: 8px 16px 16px; } .reading-guide h2 { font-size: 18px; } .guide-brand { gap: 8px; } .guide-brand img { width: 32px; height: 42px; } }
</style>
