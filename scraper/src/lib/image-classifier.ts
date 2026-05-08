import type { LabelType } from '../types.js'

const SIGNALS: Array<{ keywords: string[]; label: LabelType }> = [
  { keywords: ['nutrition facts', 'supplement facts'], label: 'nutrition_panel' },
  { keywords: ['ingredient', 'ingredients'],           label: 'ingredients_panel' },
  { keywords: ['back', 'rear'],                        label: 'back_label' },
  { keywords: ['claim', 'warning', 'allergen'],        label: 'claims_panel' },
]

export function classifyImage(url: string, altText: string, index: number): LabelType {
  if (index === 0) return 'front_label'

  const haystack = (altText + ' ' + url).toLowerCase()

  for (const { keywords, label } of SIGNALS) {
    if (keywords.some((kw) => haystack.includes(kw))) return label
  }

  return 'unknown'
}
