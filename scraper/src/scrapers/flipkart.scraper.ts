import type { Page } from 'playwright'
import { BaseScraper, type RawProduct, type RawCompany } from './base.scraper.js'
import { SCRAPER_CONFIGS } from '../config/scrapers.config.js'
import { filterBusinessEmails, extractEmailsFromHtml } from '../lib/email-extractor.js'

const SEL = SCRAPER_CONFIGS['flipkart'].selectors

export class FlipkartScraper extends BaseScraper {
  readonly name       = 'flipkart'
  readonly marketplace = 'Flipkart'
  readonly country    = 'IN' as const

  async *discoverListings(
    page: Page,
    category: string,
    options: { limit?: number }
  ): AsyncGenerator<string> {
    const query = encodeURIComponent(category)
    let url = SEL.searchUrl.replace('{query}', query)
    let count = 0
    const limit = options.limit ?? 50

    const intercepted: string[] = []
    page.on('response', async (res) => {
      if (res.url().includes('/api/4/page/fetch') && res.status() === 200) {
        try {
          const json = await res.json()
          const slots: Array<{ widget?: { data?: { products?: Array<{ productInfo?: { value?: { id?: string } } }> } } }> =
            json?.RESPONSE?.slots ?? []
          for (const slot of slots) {
            const id = slot?.widget?.data?.products?.[0]?.productInfo?.value?.id
            if (id) intercepted.push(`https://www.flipkart.com/${id}`)
          }
        } catch { /* non-fatal */ }
      }
    })

    while (url && count < limit) {
      await page.goto(url, { waitUntil: 'networkidle' })
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
      await page.waitForTimeout(2000)

      if (intercepted.length > 0) {
        for (const u of intercepted.splice(0)) {
          if (count >= limit) return
          yield u
          count++
        }
      } else {
        const links: string[] = await page.locator(SEL.productLink)
          .evaluateAll((els) =>
            els.map((a) => {
              const href = (a as HTMLAnchorElement).href
              try { return 'https://www.flipkart.com' + new URL(href).pathname } catch { return href }
            })
          )
        for (const link of [...new Set(links)]) {
          if (count >= limit) return
          yield link
          count++
        }
      }

      const nextHref = await page.locator(SEL.nextPage).getAttribute('href').catch(() => null)
      url = nextHref ?? ''
    }
  }

  async scrapeProduct(page: Page, url: string, category: string): Promise<RawProduct> {
    await page.goto(url, { waitUntil: 'domcontentloaded' })
    await page.waitForSelector(SEL.productTitle, { timeout: 15_000 }).catch(() => null)

    const name = await page.locator(SEL.productTitle).textContent().then(t => t?.trim() ?? '').catch(() => '')

    const imageUrls: string[] = await page.locator(SEL.imageCarousel)
      .evaluateAll((imgs) =>
        [...new Set(
          (imgs as HTMLImageElement[])
            .map((img) => img.src)
            .filter((src) => src?.startsWith('http'))
            .map((src) => src.replace(/\/\d+\//, '/832/'))
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
    const brand = await page.locator(SEL.brandLink).textContent().then(t => t?.trim() ?? '').catch(() => '')
    const emails = filterBusinessEmails(extractEmailsFromHtml(product.rawHtml ?? ''))
    return { name: brand || 'Unknown', brand: brand || 'Unknown', emails, country: this.country }
  }
}
