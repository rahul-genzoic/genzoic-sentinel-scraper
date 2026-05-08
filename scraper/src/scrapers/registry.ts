import { AmazonIndiaScraper } from './amazon-india.scraper.js'
import { AmazonUsScraper }    from './amazon-us.scraper.js'
import { FlipkartScraper }    from './flipkart.scraper.js'
import { IHerbScraper }       from './iherb.scraper.js'
import type { BaseScraper }   from './base.scraper.js'

const REGISTRY: Record<string, BaseScraper> = {
  'amazon-india': new AmazonIndiaScraper(),
  'amazon-us':    new AmazonUsScraper(),
  'flipkart':     new FlipkartScraper(),
  'iherb':        new IHerbScraper(),
}

export function getScraper(name: string): BaseScraper {
  const scraper = REGISTRY[name]
  if (!scraper) {
    throw new Error(`Unknown scraper: "${name}". Available: ${Object.keys(REGISTRY).join(', ')}`)
  }
  return scraper
}

export function getAllScrapers(): BaseScraper[] {
  return Object.values(REGISTRY)
}

export function listScraperNames(): string[] {
  return Object.keys(REGISTRY)
}
