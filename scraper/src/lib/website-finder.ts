import type { Page } from 'playwright'
import { extractEmailsFromHtml, filterBusinessEmails } from './email-extractor.js'
import { logger } from './logger.js'

const CONTACT_PATHS = ['/contact', '/contact-us', '/about', '/about-us', '/reach-us', '/support']
const AMAZON_DOMAINS = ['amazon.', 'amzn.']

async function searchWebsite(page: Page, brand: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`${brand} official website`)
    await page.goto(`https://html.duckduckgo.com/html/?q=${query}`, { waitUntil: 'domcontentloaded' })

    const urls: string[] = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a.result__a'))
        .map((a) => (a as HTMLAnchorElement).href)
        .filter(Boolean)
    )

    for (const url of urls) {
      try {
        const host = new URL(url).hostname
        if (AMAZON_DOMAINS.some((d) => host.includes(d))) continue
        if (host.includes('duckduckgo')) continue
        return url
      } catch { continue }
    }
  } catch { /* non-fatal */ }
  return null
}

async function extractEmailsFromSite(page: Page, websiteUrl: string): Promise<string[]> {
  const emails = new Set<string>()

  const tryPage = async (url: string) => {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 })
      const found = filterBusinessEmails(extractEmailsFromHtml(await page.content()))
      found.forEach((e) => emails.add(e))
    } catch { /* non-fatal */ }
  }

  await tryPage(websiteUrl)

  // If no emails on homepage, try common contact paths
  if (emails.size === 0) {
    const base = new URL(websiteUrl).origin
    for (const path of CONTACT_PATHS) {
      await tryPage(base + path)
      if (emails.size > 0) break
    }
  }

  return Array.from(emails)
}

export async function findCompanyEmails(
  page: Page,
  brand: string,
  knownWebsite?: string
): Promise<{ emails: string[]; website: string }> {
  let website = knownWebsite ?? ''

  try {
    if (!website) {
      website = (await searchWebsite(page, brand)) ?? ''
    }

    if (website) {
      const emails = await extractEmailsFromSite(page, website)
      if (emails.length > 0) {
        logger.debug('found emails via website', { brand, website, count: emails.length })
        return { emails, website }
      }
    }
  } catch (err) {
    logger.debug('website email search failed', { brand, error: String(err) })
  }

  return { emails: [], website }
}
