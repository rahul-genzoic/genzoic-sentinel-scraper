import type { Page } from 'playwright'
import type { ContactMeta } from '../types.js'
import { logger } from './logger.js'

const DDG = 'https://html.duckduckgo.com/html/?q='

function slugToName(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function extractLinkedInUrls(hrefs: string[]): string[] {
  return hrefs
    .filter((h) => h.includes('linkedin.com/in/'))
    .map((h) => {
      try {
        const url = new URL(h)
        const parts = url.pathname.split('/in/')
        if (parts.length < 2) return null
        const slug = parts[1].split('/')[0].split('?')[0]
        if (!slug) return null
        return `https://www.linkedin.com/in/${slug}`
      } catch { return null }
    })
    .filter((u): u is string => u !== null)
}

async function searchDDG(page: Page, query: string): Promise<string[]> {
  await page.goto(`${DDG}${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded' })
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('a.result__a'))
      .map((a) => (a as HTMLAnchorElement).href)
      .filter(Boolean)
  )
}

export async function findLinkedInProfiles(
  page: Page,
  brand: string
): Promise<ContactMeta[]> {
  const results: ContactMeta[] = []
  const seenSlugs = new Set<string>()

  const queries: Array<{ q: string; title: string }> = [
    { q: `"${brand}" (founder OR CEO) site:linkedin.com/in`,                                   title: 'CEO / Founder'  },
    { q: `"${brand}" (CMO OR "marketing director" OR "sales director") site:linkedin.com/in`,  title: 'Marketing Lead' },
  ]

  for (const { q, title } of queries) {
    try {
      const hrefs = await searchDDG(page, q)
      const urls  = extractLinkedInUrls(hrefs)
      let added   = 0

      for (const linkedinUrl of urls) {
        if (added >= 2) break
        const slug = linkedinUrl.split('/in/')[1]
        if (seenSlugs.has(slug)) continue
        seenSlugs.add(slug)
        results.push({ name: slugToName(slug), title, linkedinUrl })
        added++
      }

      logger.debug('linkedin search', { brand, title, found: added })
    } catch (err) {
      logger.debug('linkedin search failed', { brand, title, error: String(err) })
    }

    await page.waitForTimeout(1500)
  }

  return results
}
