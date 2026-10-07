import type { Dataset, Row } from '../types/data'
import { lines, dimensions } from '../types/data'
import { explorerIndicators, explorerValue } from './explorer'
import { numeric, value, format } from './analytics'
export interface ComparisonMetric { key:string; label:string; unit:string }
export function comparisonMetrics(dataset:Dataset):ComparisonMetric[] {
  return [
    ...explorerIndicators.filter(i=>!i.key.startsWith('raw:') || dataset.columns.includes(i.key.slice(4))),
    ...dimensions.filter(d=>dataset.schema[d]).map(d=>({key:d,label:`${d} · dimensión`,unit:dataset.analysis?'Índice relativo · 0–100':'Unidad del archivo'})),
    ...lines.filter(l=>dataset.schema[`registros_${l.key}`]).map(l=>({key:`registros_${l.key}`,label:`${l.label} · registros`,unit:'Registros publicados'})),
    ...lines.filter(l=>dataset.schema[`tasa_${l.key}`]).map(l=>({key:`tasa_${l.key}`,label:`${l.label} · tasa publicada`,unit:l.key==='barrios'?'Elementos / km²':'Registros / 1.000 hogares EM 2021'}))
  ]
}
export function pairedData(rows:Row[],dataset:Dataset,x:string,y:string) {
  return rows.map(r=>({code:String(value(r,dataset.schema,'codigo')),name:String(value(r,dataset.schema,'nombre')),locality:String(value(r,dataset.schema,'localidad')??''),x:explorerValue(r,dataset,x),y:explorerValue(r,dataset,y)})).filter((p):p is typeof p & {x:number;y:number}=>p.x!==null&&p.y!==null)
}
export function pearson(pairs:{x:number;y:number}[]):number|null {
  if(pairs.length<3)return null
  const mx=pairs.reduce((s,p)=>s+p.x,0)/pairs.length,my=pairs.reduce((s,p)=>s+p.y,0)/pairs.length
  let numerator=0,sx=0,sy=0
  for(const p of pairs){const dx=p.x-mx,dy=p.y-my;numerator+=dx*dy;sx+=dx*dx;sy+=dy*dy}
  return sx>0&&sy>0?Math.max(-1,Math.min(1,numerator/Math.sqrt(sx*sy))):null
}
export function comparisonScatter(pairs:ReturnType<typeof pairedData>,x:ComparisonMetric,y:ComparisonMetric,localities:string[],selectedCode:string) {
  const colors=['#ed2919','#ffad32','#207c91','#7351a5','#326b44','#956c29','#cc4277']
  return {
    aria:{enabled:true},tooltip:{trigger:'item',renderMode:'richText',formatter:(p:any)=>`${p.data.name}\n${p.data.locality}\n${x.label}: ${format(p.data.value[0])}\n${y.label}: ${format(p.data.value[1])}`},
    grid:{left:65,right:25,top:25,bottom:75},
    xAxis:{type:'value',name:x.label,nameLocation:'middle',nameGap:45,axisLabel:{formatter:format,hideOverlap:true},nameTextStyle:{fontSize:11,width:280,overflow:'truncate'}},
    yAxis:{type:'value',name:y.label,nameTextStyle:{fontSize:11,width:260,overflow:'truncate'},axisLabel:{formatter:format,hideOverlap:true}},
    series:[{type:'scatter',symbolSize:13,data:pairs.map(p=>({code:p.code,name:p.name,locality:p.locality,value:[p.x,p.y],itemStyle:{color:colors[localities.indexOf(p.locality)%colors.length]??'#ed2919',opacity:.8,borderWidth:p.code===selectedCode?3:0,borderColor:'#202a35'}}))}]
  }
}
