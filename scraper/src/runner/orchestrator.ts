import fs from 'fs/promises'
import path from 'path'
import slugify from 'slugify'
import { launchBrowser, createContext, newPage, withRetry } from '../lib/browser.js'
import { downloadImages } from '../lib/image-downloader.js'
import { extractEmailsFromHtml, filterBusinessEmails } from '../lib/email-extractor.js'
import { logger } from '../lib/logger.js'
import { RateLimiter } from '../lib/rate-limiter.js'
import { PATHS } from '../config/paths.config.js'
import { SCRAPER_CONFIGS } from '../config/scrapers.config.js'
import type { BaseScraper } from '../scrapers/base.scraper.js'
import type { MetadataJson, RunSummary } from '../types.js'

function toSlug(name: string): string {
  return slugify(name, { lower: true, strict: true })
}

export interface OrchestratorOptions {
  scraper: BaseScraper
  category: string
  limit?: number
  proxy?: { server: string; username?: string; password?: string }
}

export async function runScraper(options: OrchestratorOptions): Promise<RunSummary> {
  const { scraper, category, limit, proxy } = options
  const config = SCRAPER_CONFIGS[scraper.name]
  const rateLimiter = new RateLimiter({ defaultDelayMs: config?.delayMs ?? 2000 })

  const summary: RunSummary = {
    source: scraper.name,
    category,
    total: 0,
    scraped: 0,
    failed: 0,
    skipped: 0,
    durationMs: 0,
    startedAt: new Date().toISOString(),
  }

  const startTime = Date.now()
  const browser = await launchBrowser()
  const ctx = await createContext(browser, proxy)

  try {
    const listPage = await newPage(ctx)

    for await (const productUrl of scraper.discoverListings(listPage, category, { limit })) {
      summary.total++
      const productPage = await newPage(ctx)

      try {
        const domainMatch = productUrl.match(/^https?:\/\/([^/]+)/)
        const domain = domainMatch?.[1] ?? 'unknown'
        await rateLimiter.wait(domain)

        const rawProduct = await withRetry(() => scraper.scrapeProduct(productPage, productUrl))
        const rawCompany = await withRetry(() => scraper.extractCompany(productPage, rawProduct))

        const extraEmails = filterBusinessEmails(extractEmailsFromHtml(rawProduct.rawHtml ?? ''))
        const allEmails = Array.from(new Set([...rawCompany.emails, ...extraEmails]))

        const companySlug = toSlug(rawCompany.name)
        const productSlug  = toSlug(rawProduct.name)
        const outputDir = path.join(PATHS.dataRoot, companySlug, productSlug)

        const { images } = await downloadImages({ outputDir, imageUrls: rawProduct.imageUrls })

        const metadata: MetadataJson = {
          company:     rawCompany.name,
          brand:       rawCompany.brand,
          website:     rawCompany.website ?? '',
          emails:      allEmails,
          contactUrl:  rawCompany.contactUrl ?? '',
          linkedin:    rawCompany.linkedin ?? '',
          social:      rawCompany.social ?? {},
          country:     rawCompany.country,
          marketplace: rawProduct.marketplace,
          productName: rawProduct.name,
          productUrl:  rawProduct.sourceUrl,
          category:    rawProduct.category,
          scrapedAt:   new Date().toISOString(),
          images,
        }

        await fs.writeFile(
          path.join(outputDir, 'metadata.json'),
          JSON.stringify(metadata, null, 2),
          'utf-8'
        )

        summary.scraped++
        logger.info('scraped product', { product: rawProduct.name, company: rawCompany.name })
      } catch (err) {
        summary.failed++
        logger.error('failed to scrape product', { url: productUrl, error: String(err) })
      } finally {
        await productPage.close()
      }
    }
  } finally {
    await ctx.close()
    await browser.close()
  }

  summary.durationMs = Date.now() - startTime

  await fs.mkdir(PATHS.logDir, { recursive: true })
  await fs.writeFile(
    path.join(PATHS.logDir, `run-${scraper.name}-${Date.now()}.json`),
    JSON.stringify(summary, null, 2),
    'utf-8'
  )

  logger.info('run complete', summary)
  return summary
}
