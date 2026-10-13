export const gapCategories = [
  { label: 'Muy baja', color: '#2166ac' },
  { label: 'Baja', color: '#92c5de' },
  { label: 'Media', color: '#f7f7f7' },
  { label: 'Alta', color: '#f4a582' },
  { label: 'Muy alta', color: '#b2182b' }
]
export function categoryColor(category: unknown) {
  return gapCategories.find(c => c.label === category)?.color ?? '#d7d5d5'
}
