export const gapCategories = [
  { label: 'Muy baja', color: '#FFF1A6' },
  { label: 'Baja', color: '#FFDE09' },
  { label: 'Media', color: '#F7B325' },
  { label: 'Alta', color: '#E3351F' },
  { label: 'Muy alta', color: '#AA1023' }
]
export function categoryColor(category: unknown) {
  return gapCategories.find(c => c.label === category)?.color ?? '#C4C4C4'
}
export function gapValueColor(value: number | null, min: number | null, max: number | null) {
  if (value === null || min === null || max === null) return '#C4C4C4'
  const position = max === min ? 0 : (value - min) / (max - min)
  const index = Math.max(0, Math.min(gapCategories.length - 1, Math.floor(position * gapCategories.length)))
  return gapCategories[index]!.color
}
