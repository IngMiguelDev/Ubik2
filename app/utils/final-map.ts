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
