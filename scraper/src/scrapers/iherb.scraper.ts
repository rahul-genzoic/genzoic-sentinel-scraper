import type { Page } from 'playwright'
import { BaseScraper, type RawProduct, type RawCompany } from './base.scraper.js'
import { SCRAPER_CONFIGS } from '../config/scrapers.config.js'
import { filterBusinessEmails, extractEmailsFromHtml } from '../lib/email-extractor.js'

const SEL = SCRAPER_CONFIGS['iherb'].selectors

export class IHerbScraper extends BaseScraper {
  readonly name       = 'iherb'
  readonly marketplace = 'iHerb'
  readonly country    = 'US' as const

  async *discoverListings(
    page: Page,
    category: string,
    options: { limit?: number }
  ): AsyncGenerator<string> {
    const query = encodeURIComponent(category)
    let url = SEL.searchUrl.replace('{query}', query)
    let count = 0
    const limit = options.limit ?? 50

    while (url && count < limit) {
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector(SEL.productCard, { timeout: 10_000 }).catch(() => null)

      for (let i = 1; i <= 5; i++) {
        await page.evaluate((frac) => window.scrollTo(0, frac * document.body.scrollHeight), i / 5)
        await page.waitForTimeout(500)
      }

      const links: string[] = await page.locator(SEL.productLink)
        .evaluateAll((els) => els.map((a) => (a as HTMLAnchorElement).href))

      for (const link of [...new Set(links)]) {
        if (count >= limit) return
        yield link
        count++
      }

      const nextHref = await page.locator(SEL.nextPage).getAttribute('href').catch(() => null)
      url = nextHref ?? ''
    }
  }

  async scrapeProduct(page: Page, url: string): Promise<RawProduct> {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    // Wait for any h1 — iHerb renders title client-side
    await page.waitForSelector('h1', { timeout: 20_000 }).catch(() => null)

    // Multiple selector fallbacks: iHerb's class names vary by region/version
    const name = await page.locator('h1.product-title, h1[itemprop="name"], h1').first()
      .textContent().then(t => t?.trim() ?? '').catch(() => '')

    const imageUrls: string[] = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll(
        '.slick-slide img, #productImage img, .product-image-container img, img[src*="cloudfront"], img[data-src*="cloudfront"]'
      )) as HTMLImageElement[]
      return [...new Set(
        imgs
          .map((img) => img.getAttribute('data-src') || img.src)
          .filter((src): src is string => typeof src === 'string' && src.startsWith('http') && !src.includes('placeholder'))
      )]
    })

    return {
      name,
      sourceUrl:   url,
      marketplace: this.marketplace,
      country:     this.country,
      category:    '',
      imageUrls:   imageUrls.slice(0, 8),
      rawHtml:     await page.content(),
    }
  }

  async extractCompany(page: Page, product: RawProduct): Promise<RawCompany> {
    const brand = await page.locator('a.brand-name, .brand-name a, [itemprop="brand"] a, .brand a').first()
      .textContent().then(t => t?.trim() ?? '').catch(() => '')
    const brandHref = await page.locator('a.brand-name, .brand-name a, [itemprop="brand"] a').first()
      .getAttribute('href').catch(() => null)

    let emails = filterBusinessEmails(extractEmailsFromHtml(product.rawHtml ?? ''))

    if (emails.length === 0 && brandHref) {
      try {
        await page.goto(brandHref, { waitUntil: 'domcontentloaded' })
        emails = filterBusinessEmails(extractEmailsFromHtml(await page.content()))
      } catch { /* non-fatal */ }
    }

    return {
      name:    brand || 'Unknown',
      brand:   brand || 'Unknown',
      website: brandHref ?? undefined,
      emails,
      country: this.country,
    }
  }
}
