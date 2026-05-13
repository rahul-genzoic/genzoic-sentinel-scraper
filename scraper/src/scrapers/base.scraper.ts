import type { Page } from 'playwright'
import type { ContactMeta } from '../types.js'

export interface RawProduct {
  name: string
  sourceUrl: string
  marketplace: string
  country: 'IN' | 'US'
  category: string
  imageUrls: string[]
  rawHtml?: string
}

export interface RawCompany {
  name: string
  brand: string
  website?: string
  emails: string[]
  contactUrl?: string
  linkedin?: string
  social?: Record<string, string>
  country: 'IN' | 'US'
  contacts?: ContactMeta[]
}

export abstract class BaseScraper {
  abstract readonly name: string
  abstract readonly marketplace: string
  abstract readonly country: 'IN' | 'US'

  abstract discoverListings(
    page: Page,
    category: string,
    options: { limit?: number }
  ): AsyncGenerator<string>

  abstract scrapeProduct(page: Page, url: string, category: string): Promise<RawProduct>

  abstract extractCompany(page: Page, product: RawProduct): Promise<RawCompany>
}
