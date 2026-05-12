export type LabelType =
  | 'front_label'
  | 'back_label'
  | 'nutrition_panel'
  | 'ingredients_panel'
  | 'claims_panel'
  | 'unknown'

export interface ImageMeta {
  filename: string
  labelType: LabelType
  sha256: string
}

export interface ContactMeta {
  name: string
  title: string
  linkedinUrl: string
}

export interface MetadataJson {
  company: string
  brand: string
  website: string
  emails: string[]
  contactUrl: string
  linkedin: string
  social: Record<string, string>
  country: 'IN' | 'US'
  marketplace: string
  productName: string
  productUrl: string
  category: string
  scrapedAt: string
  images: ImageMeta[]
  contacts: ContactMeta[]
}

export interface RunSummary {
  source: string
  category: string
  total: number
  scraped: number
  failed: number
  skipped: number
  durationMs: number
  startedAt: string
}
