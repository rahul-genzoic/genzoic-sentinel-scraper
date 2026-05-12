import type { Page } from 'playwright'
import { BaseScraper, type RawProduct, type RawCompany } from './base.scraper.js'
import { SCRAPER_CONFIGS } from '../config/scrapers.config.js'
import { filterBusinessEmails, extractEmailsFromHtml } from '../lib/email-extractor.js'
import { findCompanyEmails } from '../lib/website-finder.js'
import { findLinkedInProfiles } from '../lib/linkedin-finder.js'

const SEL = SCRAPER_CONFIGS['amazon-us'].selectors

export class AmazonUsScraper extends BaseScraper {
  readonly name       = 'amazon-us'
  readonly marketplace = 'Amazon US'
  readonly country    = 'US' as const

  async *discoverListings(
    page: Page,
    category: string,
    _options: { limit?: number }
  ): AsyncGenerator<string> {
    const query = encodeURIComponent(category)
    let url = SEL.searchUrl.replace('{query}', query)

    while (url) {
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await page.waitForSelector(SEL.productCard, { timeout: 10_000 }).catch(() => null)
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(1500)

      const asins: string[] = await page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-component-type="s-search-result"][data-asin]'))
          .map((el) => el.getAttribute('data-asin') ?? '')
          .filter(Boolean)
      )

      for (const asin of asins) {
        yield `https://www.amazon.com/dp/${asin}`
      }

      const nextHref = await page.locator(SEL.nextPage).getAttribute('href').catch(() => null)
      url = nextHref ? `https://www.amazon.com${nextHref}` : ''
    }
  }

  async scrapeProduct(page: Page, url: string): Promise<RawProduct> {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
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
      category:    '',
      imageUrls:   imageUrls.slice(0, 8),
      rawHtml:     await page.content(),
    }
  }

  async extractCompany(page: Page, product: RawProduct): Promise<RawCompany> {
    const brandText = await page.locator(SEL.brandLink).textContent().catch(() => '')
    const brand = (brandText ?? '').replace(/^(Visit the|Brand:|by)\s+/i, '').trim()

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
