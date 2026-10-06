import { lines, type Row, type Schema } from '../types/data'
import { need, numeric, total, value } from './analytics'
export function distribution(rows: Row[], schema: Schema, line: string) {
  const available = lines.filter(l => !line || l.key === line).map(l => ({ ...l, count: total(rows, schema, `registros_${l.key}`) })).filter(l => l.count !== null)
  return { aria: { enabled: true }, tooltip: { trigger: 'axis' }, grid: { left: 210, right: 30, top: 20, bottom: 35 }, xAxis: { type: 'value', min: 0 }, yAxis: { type: 'category', data: available.map(l => l.label), axisLabel: { color: '#615c60' } }, series: [{ type: 'bar', barWidth: 22, data: available.map(l => ({ value: l.count, itemStyle: { color: l.color, borderRadius: [0, 5, 5, 0] } })) }] }
}
export function scatter(rows: Row[], all: Row[], schema: Schema, line: string) {
  const active = line || 'barrios'
  const data = rows.map(r => ({ name: String(value(r, schema, 'nombre')), code: String(value(r, schema, 'codigo')), value: [need(r, all, schema), numeric(value(r, schema, `registros_${active}`))] })).filter(p => p.value.every(v => v !== null))
  return { aria: { enabled: true }, tooltip: { trigger: 'item', renderMode: 'richText' }, grid: { left: 60, right: 30, top: 25, bottom: 60 }, xAxis: { type: 'value', name: 'Necesidad exploratoria (0–100)', nameLocation: 'middle', nameGap: 35, min: 0, max: 100 }, yAxis: { type: 'value', name: 'Registros publicados', min: 0 }, series: [{ type: 'scatter', symbolSize: 13, itemStyle: { color: '#AA1023', opacity: 0.75 }, data }] }
}
