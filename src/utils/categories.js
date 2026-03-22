export const CATEGORIES = [
  { id: 'social', label: 'Sosyal Medya', icon: 'Users' },
  { id: 'bank', label: 'Banka', icon: 'Landmark' },
  { id: 'email', label: 'E-posta', icon: 'Mail' },
  { id: 'shopping', label: 'Alışveriş', icon: 'ShoppingBag' },
  { id: 'gaming', label: 'Oyun', icon: 'Gamepad2' },
  { id: 'work', label: 'İş', icon: 'Briefcase' },
  { id: 'other', label: 'Diğer', icon: 'Tag' },
]

export function getCategoryLabel(id) {
  return CATEGORIES.find(c => c.id === id)?.label || 'Diğer'
}

export function getCategoryIcon(id) {
  return CATEGORIES.find(c => c.id === id)?.icon || 'Tag'
}

export function normalizeCategory(entry) {
  if (entry.category && CATEGORIES.some(c => c.id === entry.category)) return entry
  return { ...entry, category: 'other' }
}
