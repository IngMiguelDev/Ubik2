import type { Dataset, Row } from '../types/data'
import { consolidatedField } from './consolidation'
import { explorerValue } from './explorer'
import { categoryColor } from './final-map'

export interface ReportScope { dataset: Dataset; rows: Row[]; territory?: Row; locality: string; metric: string; metricLabel: string; presenceFilter: string }
export function reportData(scope: ReportScope) {
  const rows = scope.territory ? [scope.territory] : scope.rows
  const result = (field: string) => scope.territory ? explorerValue(scope.territory,scope.dataset,'final:'+field) : consolidatedField(rows,scope.dataset,field)
  const gap=result('brecha')
  const conclusion=gap===null ? 'No hay información suficiente para interpretar la brecha de esta selección.' : gap>0
    ? 'En esta selección, el índice de necesidad supera al de presencia CVP. Esto señala una diferencia relativa que conviene revisar junto con las condiciones de los hogares y las actuaciones registradas. No permite contar hogares pendientes de atención.'
    : gap<0 ? 'En esta selección, el índice de presencia CVP supera al de necesidad. Esto no demuestra exceso de ayuda ni que las necesidades estén resueltas: los índices comparan medidas relativas y períodos diferentes.'
    : 'Los índices de necesidad y presencia tienen el mismo valor en esta selección. Esa igualdad no demuestra cobertura completa ni ausencia de necesidades.'
  return {rows,result,conclusion,title:scope.territory ? String(scope.territory[scope.dataset.schema.nombre!]) : scope.locality ? 'Consolidado de '+scope.locality : 'Consolidado de la selección'}
}
const fmt=(v:number|null,digits=2)=>v===null?'Sin dato':new Intl.NumberFormat('es-CO',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(v)
type Raster={data:string;width:number;height:number}
function raster(canvas:HTMLCanvasElement):Raster {return {data:atob(canvas.toDataURL('image/jpeg',.94).split(',')[1]!),width:canvas.width,height:canvas.height}}
async function logoImage(base:string) {
  const img=new Image();img.src=base+'brand/ubik2.png';await img.decode()
  const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height
  const ctx=canvas.getContext('2d')!;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0);return raster(canvas)
}
async function mapImage(scope:ReportScope,base:string) {
  const geo=await fetch(base+'data/upz_brecha_95.geojson').then(r=>{if(!r.ok)throw Error('No se pudo cargar el mapa.');return r.json()})
  const model=reportData(scope), lookup=new Map(model.rows.map(r=>[String(r[scope.dataset.schema.codigo!]),r]))
  const features=geo.features.filter((f:any)=>lookup.has(String(f.properties.cod_upz_grupo)))
  const canvas=document.createElement('canvas');canvas.width=1100;canvas.height=700;const ctx=canvas.getContext('2d')!
  ctx.fillStyle='#edf3f8';ctx.fillRect(0,0,1100,700)
  const polygons=features.flatMap((f:any)=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates)
  const coords=polygons.flatMap((p:any)=>p.flat())
  if(!coords.length)return raster(canvas)
  const xs=coords.map((p:number[])=>p[0]!*Math.cos(4.6*Math.PI/180)),ys=coords.map((p:number[])=>p[1]!)
  const loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys)
  const scale=Math.min(1020/(hiX-loX||1),620/(hiY-loY||1)),ox=(1100-(hiX-loX)*scale)/2,oy=(700-(hiY-loY)*scale)/2
  const values=scope.dataset.rows.map(r=>explorerValue(r,scope.dataset,scope.metric)).filter((v):v is number=>v!==null)
  const lo=Math.min(...values),hi=Math.max(...values)
  for(const feature of features) {
    const row=lookup.get(String(feature.properties.cod_upz_grupo))!,v=explorerValue(row,scope.dataset,scope.metric)
    const palette=['#ffedbb','#ffd180','#ffab50','#fa722e','#ef321c','#9f160e']
    ctx.fillStyle=scope.metric==='final:brecha'?categoryColor(row.categoria_brecha):v===null?'#d7d5d5':palette[Math.min(5,Math.floor((hi===lo?0:(v-lo)/(hi-lo))*6))]!
    const parts=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates
    for(const polygon of parts){ctx.beginPath();for(const ring of polygon){ring.forEach((p:number[],i:number)=>{const x=ox+(p[0]!*Math.cos(4.6*Math.PI/180)-loX)*scale,y=oy+(hiY-p[1]!)*scale;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath()}ctx.fill('evenodd');ctx.strokeStyle='#fff';ctx.lineWidth=1.3;ctx.stroke()}
  }
  return raster(canvas)
}
class Pdf {
  pages:string[]=[];content='';y=0;images:Raster[]=[]
  constructor(private logo:Raster){this.images.push(logo)}
  text(text:string,x:number,y:number,size=10,bold=false,color='0.13 0.17 0.21') {
    const clean=text.replace(/[–—−]/g,'-').replace(/→/g,'>').replace(/Σ/g,'suma').replace(/×/g,'x')
    const escaped=clean.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')
    this.content+='BT /'+(bold?'F2':'F1')+' '+size+' Tf '+color+' rg '+x+' '+(842-y)+' Td ('+escaped+') Tj ET\n'
  }
  line(x:number,y:number,w:number,h:number,color:string){this.content+=color+' rg '+x+' '+(842-y-h)+' '+w+' '+h+' re f\n'}
  image(index:number,x:number,y:number,w:number,h:number){this.content+='q '+w+' 0 0 '+h+' '+x+' '+(842-y-h)+' cm /I'+index+' Do Q\n'}
  page(title:string){if(this.content)this.pages.push(this.content);this.content='';this.line(0,0,595,6,'0.98 0.14 0.10');this.image(0,40,24,30,40);this.text('UBiK2 | OBSERVATORIO TERRITORIAL',82,38,10,true);this.text('Caja de la Vivienda Popular - Bogotá',82,55,9);this.text(title,40,95,18,true);this.y=120}
  paragraph(text:string,bold=false){const words=text.split(/\s+/);let line='';for(const word of words){if((line+' '+word).length>91){this.ensure(16);this.text(line,40,this.y,10,bold);this.y+=15;line=word}else line+=(line?' ':'')+word}if(line){this.ensure(16);this.text(line,40,this.y,10,bold);this.y+=15}this.y+=8}
  ensure(height:number){if(this.y+height>770)this.page('Reporte territorial - continuación')}
  heading(text:string){this.ensure(42);this.y+=8;this.line(40,this.y-12,3,19,'1 0.77 0');this.text(text,51,this.y,13,true);this.y+=26}
  row(label:string,value:string){this.ensure(24);this.text(label,40,this.y,10);this.text(value,410,this.y,10,true);this.line(40,this.y+7,515,0.5,'0.86 0.89 0.93');this.y+=25}
  bar(label:string,value:number|null,percent=false){this.ensure(31);this.text(label,40,this.y,10);this.line(200,this.y-9,250,10,'0.92 0.94 0.97');if(value!==null)this.line(200,this.y-9,250*Math.max(0,Math.min(1,percent?value/100:value)),10,'0.98 0.14 0.10');this.text(fmt(value)+(percent?' %':''),470,this.y,10,true);this.y+=28}
  bytes(){if(this.content)this.pages.push(this.content);const objects:string[]=[];const add=(s:string)=>{objects.push(s);return objects.length}
    add('');add('');add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>')
    const imageIds=this.images.map(im=>add('<< /Type /XObject /Subtype /Image /Width '+im.width+' /Height '+im.height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+im.data.length+' >>\nstream\n'+im.data+'\nendstream'))
    const ids=this.pages.map((body,i)=>{body+='BT /F1 8 Tf 0.4 0.4 0.4 rg 40 28 Td (UBiK2 - Lectura exploratoria | '+(i+1)+' / '+this.pages.length+') Tj ET\n';const stream=add('<< /Length '+body.length+' >>\nstream\n'+body+'endstream');return add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << '+imageIds.map((id,j)=>'/I'+j+' '+id+' 0 R').join(' ')+' >> >> /Contents '+stream+' 0 R >>')})
    objects[0]='<< /Type /Catalog /Pages 2 0 R >>';objects[1]='<< /Type /Pages /Count '+ids.length+' /Kids ['+ids.map(id=>id+' 0 R').join(' ')+'] >>'
    let output='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';const offsets=[0];objects.forEach((o,i)=>{offsets.push(output.length);output+=(i+1)+' 0 obj\n'+o+'\nendobj\n'});const start=output.length;output+='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n'+offsets.slice(1).map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('')+'trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+start+'\n%%EOF'
    return Uint8Array.from(output,c=>c.charCodeAt(0)>255?63:c.charCodeAt(0))
  }
}

export async function downloadTerritorialReport(scope:ReportScope,base:string) {
  if(scope.dataset.status!=='final'||!scope.rows.length)throw Error('Selecciona al menos un territorio de la base final.')
  const snapshot={...scope,rows:[...scope.rows]}, model=reportData(snapshot)
  const [logo,map]=await Promise.all([logoImage(base),mapImage(snapshot,base)])
  const pdf=new Pdf(logo)
  pdf.page('Reporte territorial de la selección')
  pdf.paragraph(model.title,true)
  pdf.paragraph('Generado: '+new Intl.DateTimeFormat('es-CO',{dateStyle:'long',timeStyle:'short',timeZone:'America/Bogota'}).format(new Date())+' (hora de Bogotá).')
  pdf.paragraph('Alcance: '+model.rows.length+' dominio(s) estadístico(s). Localidad: '+(scope.locality||'Todas las disponibles')+'. Indicador del mapa: '+scope.metricLabel+'. Filtro de líneas: '+(scope.presenceFilter||'Cualquier cantidad')+'.')
  if(scope.territory)pdf.paragraph('Ficha individual seleccionada. El mapa del reporte y los resultados corresponden solo a este territorio; la selección visible del visor puede contener otros dominios.')
  pdf.row('Hogares encuestados',fmt(model.result('hogares_muestra'),0));pdf.row('Hogares representados',fmt(model.result('hogares_expandidos'),0))
  pdf.heading('Necesidad frente a presencia')
  pdf.bar('Necesidad',model.result('indice_necesidad'));pdf.bar('Presencia CVP',model.result('indice_presencia'));pdf.row('Brecha',fmt(model.result('brecha')))
  pdf.paragraph('Los índices van de 0 a 1; la brecha va de -1 a 1. Son medidas relativas, no porcentajes de hogares atendidos. Brecha = necesidad menos presencia. Las cifras se redondean solo al mostrarlas; restar los valores redondeados puede dar una pequeña diferencia.')
  pdf.row('Indicador actual: '+scope.metricLabel.slice(0,47),fmt(model.result(scope.metric.replace('final:',''))))
  if(scope.territory){pdf.row('Posición según la brecha',String(scope.territory.prioridad??'Sin dato'));pdf.row('Quintil original de la brecha',String(scope.territory.categoria_brecha??'Sin dato'))}
  pdf.heading('Conclusión de esta selección');pdf.paragraph('Necesidad: '+fmt(model.result('indice_necesidad'))+'; presencia CVP: '+fmt(model.result('indice_presencia'))+'; brecha: '+fmt(model.result('brecha'))+'.');pdf.paragraph(model.conclusion)
  pdf.paragraph('Para profundizar, revisa qué condiciones de los hogares y qué registros misionales explican la diferencia. Este reporte no establece una prioridad institucional ni demuestra causalidad.')
  pdf.page('Mapa y condiciones de los hogares');pdf.paragraph(scope.metricLabel,true)
  pdf.images.push(map);pdf.image(1,82,pdf.y,432,275);pdf.y+=289
  pdf.paragraph(scope.metric==='final:brecha'?'Leyenda: azul oscuro Muy baja; azul claro Baja; amarillo Media; naranja Alta; rojo Muy alta. Quintiles del archivo completo, sin recalcular al filtrar.':'Escala: amarillo claro = menor valor; rojo oscuro = mayor valor; gris = sin dato. Los límites se calculan sobre la base completa.')
  pdf.heading('Condiciones de los hogares')
  for(const [field,label]of [['ind_tenencia','Tenencia'],['ind_vivienda','Déficit habitacional'],['ind_entorno','Entorno'],['ind_vulnerabilidad','Jefatura femenina en pobreza']])pdf.bar(label!,model.result(field!),true)
  pdf.paragraph('Los porcentajes describen hogares representados. Jefatura femenina mide hogares con jefatura femenina en pobreza monetaria sobre todos los hogares; no toda la jefatura femenina.')
  pdf.row('Área en amenaza alta',fmt(model.result('pct_amenaza_alta'))+' %');pdf.row('Área en amenaza media',fmt(model.result('pct_amenaza_media'))+' %')
  pdf.paragraph('Amenaza mide área, no hogares expuestos. Incluye movimientos en masa; no todos los riesgos. El mapa reproduce el indicador, no las capas superpuestas ni el nivel de zoom del visor.')
  pdf.page('Presencia CVP, fuentes y lectura')
  pdf.heading('Registros de las cinco líneas')
  for(const [field,label]of [['viv_presencia','Vivienda - predios'],['tit_presencia','Titulación - predios por dominio'],['barrios_presencia','Barrios - tramos por dominio'],['reas_presencia','Reasentamientos - procesos'],['cps_presencia','Curaduría - predios']])pdf.row(label!,fmt(model.result(field!),0))
  pdf.paragraph('No se suman estas líneas como personas u hogares beneficiados. La suma de identificadores únicos por dominio no acredita unicidad global.')
  pdf.heading('Cómo se obtuvo este reporte')
  pdf.paragraph(scope.territory?'Se conservan los valores originales del territorio. Los indicadores ind_ se multiplican por 100 para mostrar porcentajes.':'Conteos: suma. Tasas: total de registros por 1.000 hogares. Índices e indicadores de hogares: promedio ponderado por hogares representados. Amenaza: promedio ponderado por área. Son resúmenes descriptivos de valores publicados redondeados; no nuevos índices oficiales.')
  pdf.paragraph('La base final usa cinco componentes con pesos iguales en cada índice: 1/5 = 20 %. Normalización con tope en percentil 95 y min-max. Los filtros no recalculan los índices originales.')
  pdf.heading('Fuentes y períodos')
  pdf.paragraph('Fuente del visor: '+scope.dataset.source.name+'. Construcción: cuadernos 01, 02 y 03. Encuesta: EM 2021. Descarga de las cinco capas CVP registrada: 10/10/2026; no es un corte común ni fecha de validación.')
  pdf.paragraph('Vivienda: Plan Terrazas, estados diciembre 2021 a noviembre 2024; ejecutados y en ejecución. Curaduría: actos mayo 2021 a octubre 2024, con registros sin fecha. Titulación: histórico 2015 a 2025, con registros sin fecha. Barrios: contratos 2020 a 2023, sin filtrar por terminación. Reasentamientos: histórico de procesos terminados, sin fecha de terminación acreditada. Amenaza: IDIGER 2016 según diccionario final.')
  pdf.paragraph('Cero presencia significa sin registros en las capas utilizadas. Sin dato indica información faltante. Los resultados no acreditan cobertura efectiva, diferencias estadísticamente significativas ni una priorización oficial.')
  pdf.page('Territorios incluidos en el reporte')
  model.rows.forEach(row=>pdf.paragraph(String(row[scope.dataset.schema.nombre!])+' | Código '+String(row[scope.dataset.schema.codigo!])+' | '+String(row[scope.dataset.schema.localidad!]||'')))
  const bytes=pdf.bytes(),blob=new Blob([bytes as BlobPart],{type:'application/pdf'}),url=URL.createObjectURL(blob)
  const link=document.createElement('a');link.href=url;link.download='ubik2-reporte-territorial.pdf';link.click();setTimeout(()=>URL.revokeObjectURL(url),10000)
}
