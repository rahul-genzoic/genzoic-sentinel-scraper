import type { Page } from 'playwright'
import { BaseScraper, type RawProduct, type RawCompany } from './base.scraper.js'
import { SCRAPER_CONFIGS } from '../config/scrapers.config.js'
import { filterBusinessEmails, extractEmailsFromHtml } from '../lib/email-extractor.js'
import { findCompanyEmails } from '../lib/website-finder.js'
import { findLinkedInProfiles } from '../lib/linkedin-finder.js'

const SEL = SCRAPER_CONFIGS['amazon-india'].selectors

export class AmazonIndiaScraper extends BaseScraper {
  readonly name       = 'amazon-india'
  readonly marketplace = 'Amazon India'
  readonly country    = 'IN' as const

  async *discoverListings(
    page: Page,
    category: string,
    _options: { limit?: number }
  ): AsyncGenerator<string> {
    const query = encodeURIComponent(category)
    let url = SEL.searchUrl.replace('{query}', query)

    const intercepted: string[] = []
    page.on('response', async (res) => {
      if (res.url().includes('/s/query') && res.headers()['content-type']?.includes('json')) {
        try {
          const json = await res.json()
          const items: Array<{ asin?: string }> = json?.data?.searchResult?.items ?? []
          for (const item of items) {
            if (item.asin) intercepted.push(`https://www.amazon.in/dp/${item.asin}`)
          }
        } catch { /* non-fatal */ }
      }
    })

    while (url) {
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector(SEL.productCard, { timeout: 10_000 }).catch(() => null)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(1500)

      // Prefer XHR-intercepted ASINs; fall back to data-asin attributes on cards
      const asins: string[] = intercepted.length > 0
        ? intercepted.splice(0)
        : await page.evaluate(() =>
            Array.from(document.querySelectorAll('[data-component-type="s-search-result"][data-asin]'))
              .map((el) => el.getAttribute('data-asin') ?? '')
              .filter(Boolean)
          )

      for (const asin of asins) {
        yield `https://www.amazon.in/dp/${asin}`
      }

      const nextHref = await page.locator(SEL.nextPage)
        .getAttribute('href')
        .catch(() => null)
      url = nextHref ? `https://www.amazon.in${nextHref}` : ''
    }
  }

  async scrapeProduct(page: Page, url: string, category: string): Promise<RawProduct> {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    // Wait until #productTitle has non-empty text — Amazon hydrates it after DOMContentLoaded
    await page.waitForFunction(
      () => document.querySelector('#productTitle')?.textContent?.trim(),
      { timeout: 15_000 }
    ).catch(() => null)

    const name = await page.evaluate(
      () => document.querySelector('#productTitle')?.textContent?.trim() ?? ''
    )

    const imageUrls: string[] = await page.locator(SEL.imageCarousel)
      .evaluateAll((imgs) =>
        [...new Set(
          (imgs as HTMLImageElement[])
            .map((img) => img.src || img.getAttribute('data-old-hires') || '')
            .filter((src) => src.startsWith('http') && !src.includes('sprite'))
            .map((src) => src.replace(/\._[A-Z0-9_]+_\./, '.'))
        )]
      )

    return {
      name,
      sourceUrl:   url,
      marketplace: this.marketplace,
      country:     this.country,
      category,
      imageUrls:   imageUrls.slice(0, 8),
      rawHtml:     await page.content(),
    }
  }

  async extractCompany(page: Page, product: RawProduct): Promise<RawCompany> {
    const brandText = await page.locator(SEL.brandLink).textContent().catch(() => '')
    let brand = (brandText ?? '').replace(/^(Visit the|Brand:|by)\s+/i, '').trim()

    // Fallback: parse Item Details table for Brand Name / Manufacturer
    if (!brand) {
      brand = await page.evaluate(() => {
        const rows = Array.from(document.querySelectorAll(
          '#productDetails_techSpec_section_1 tr, #productDetails_detailBullets_sections1 tr, #prodDetails table tr'
        ))
        for (const row of rows) {
          const header = row.querySelector('th, td:first-child')?.textContent?.trim().toLowerCase() ?? ''
          if (header.includes('brand') || header.includes('manufacturer')) {
            return row.querySelector('td:last-child')?.textContent?.trim() ?? ''
          }
        }
        // Also check bullet-list format
        const bullets = Array.from(document.querySelectorAll('#detailBullets_feature_div li'))
        for (const li of bullets) {
          const text = li.textContent ?? ''
          if (/brand|manufacturer/i.test(text)) {
            const parts = text.split(':')
            if (parts[1]) return parts[1].trim().replace(/\u200E/g, '')
          }
        }
        return ''
      }).catch(() => '')
    }

    let emails = filterBusinessEmails(extractEmailsFromHtml(product.rawHtml ?? ''))
    let website = ''
    if (emails.length === 0 && brand) {
      const result = await findCompanyEmails(page, brand)
      emails = result.emails
      website = result.website
    }

    const contacts = brand ? await findLinkedInProfiles(page, brand) : []

    return { name: brand || 'Unknown', brand: brand || 'Unknown', emails, website: website || undefined, contacts, country: this.country }
  }
}
