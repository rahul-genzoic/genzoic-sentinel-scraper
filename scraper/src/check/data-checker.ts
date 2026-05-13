import fs from 'fs/promises'
import path from 'path'
import slugify from 'slugify'
import { logger } from '../lib/logger.js'
import { launchBrowser, createContext, newPage } from '../lib/browser.js'
import { getScraper } from '../scrapers/registry.js'
import { filterBusinessEmails, extractEmailsFromHtml } from '../lib/email-extractor.js'
import { findCompanyEmails } from '../lib/website-finder.js'
import { findLinkedInProfiles } from '../lib/linkedin-finder.js'
import { downloadImages } from '../lib/image-downloader.js'
import type { MetadataJson } from '../types.js'

interface FieldCheck {
  field: string
  label: string
  check: (m: MetadataJson) => boolean
}

const CHECKS: FieldCheck[] = [
  { field: 'company',    label: 'Company = Unknown',  check: (m) => !m.company || m.company === 'Unknown' },
  { field: 'brand',      label: 'Brand missing',      check: (m) => !m.brand || m.brand === 'Unknown' },
  { field: 'website',    label: 'Website missing',    check: (m) => !m.website },
  { field: 'emails',     label: 'No emails',          check: (m) => m.emails.length === 0 },
  { field: 'category',   label: 'Category missing',   check: (m) => !m.category },
  { field: 'linkedin',   label: 'LinkedIn missing',   check: (m) => !m.linkedin },
  { field: 'contacts',   label: 'No contacts',        check: (m) => (m.contacts ?? []).length === 0 },
  { field: 'images',     label: 'No images',          check: (m) => m.images.length === 0 },
  { field: 'productUrl', label: 'Product URL missing', check: (m) => !m.productUrl },
]

// Issues that can be fixed by visiting the product page
const FIXABLE = new Set([
  'Company = Unknown', 'Brand missing', 'Website missing',
  'No emails', 'LinkedIn missing', 'No contacts', 'No images',
])

const FOLDER_MISMATCH_LABEL = 'Folder name mismatch'

interface CheckResult {
  filePath: string
  meta: MetadataJson
  issues: string[]
}

async function walkMetadata(dir: string): Promise<string[]> {
  const results: string[] = []
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...await walkMetadata(full))
    } else if (entry.name === 'metadata.json') {
      results.push(full)
    }
  }
  return results
}

export async function checkData(dataDir: string): Promise<CheckResult[]> {
  const files = await walkMetadata(dataDir)
  const results: CheckResult[] = []
  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf-8').catch(() => null)
    if (!raw) continue
    const meta: MetadataJson = JSON.parse(raw)
    const issues = CHECKS.filter((c) => c.check(meta)).map((c) => c.label)

    // Check folder name matches slugified company
    if (meta.company && meta.company !== 'Unknown') {
      const expectedSlug = slugify(meta.company, { lower: true, strict: true }).slice(0, 80)
      const actualFolder = path.basename(path.dirname(path.dirname(filePath)))
      if (actualFolder !== expectedSlug) issues.push(FOLDER_MISMATCH_LABEL)
    }

    if (issues.length > 0) results.push({ filePath, meta, issues })
  }
  return results
}

export function printReport(results: CheckResult[], total: number): void {
  const allLabels = [...CHECKS.map((c) => c.label), FOLDER_MISMATCH_LABEL]
  const counts: Record<string, number> = {}
  for (const label of allLabels) counts[label] = 0
  for (const r of results) {
    for (const issue of r.issues) counts[issue] = (counts[issue] ?? 0) + 1
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`  Data quality report — ${total} files scanned`)
  console.log(`${'─'.repeat(60)}`)

  for (const label of allLabels) {
    const n = counts[label]
    if (n === 0) continue
    const pct = ((n / total) * 100).toFixed(1)
    const bar = '█'.repeat(Math.round((n / total) * 20)).padEnd(20, '░')
    const flag = n > total * 0.5 ? '✗' : '!'
    console.log(`  ${flag} ${label.padEnd(22)} ${String(n).padStart(4)} / ${total}  ${bar}  ${pct}%`)
  }

  const unknowns = results.filter((r) => r.issues.includes('Company = Unknown'))
  if (unknowns.length > 0) {
    console.log(`\n  Unknown company files (${unknowns.length}):`)
    for (const r of unknowns.slice(0, 20)) {
      const rel = r.filePath.split(/[\\/]data[\\/]/)[1] ?? r.filePath
      console.log(`    • ${rel.split(/[\\/]/)[0]} → ${r.meta.productUrl ?? '(no url)'}`)
    }
    if (unknowns.length > 20) console.log(`    … and ${unknowns.length - 20} more`)
  }

  const anyIssues = allLabels.some((l) => counts[l] > 0)
  if (!anyIssues) console.log(`  All fields present — no issues found`)

  const fixable = results.filter((r) => r.issues.some((i) => FIXABLE.has(i)))
  console.log(`\n  ${total - results.length} / ${total} files fully complete`)
  if (fixable.length > 0)
    console.log(`  ${fixable.length} files have fixable issues (run --fix to attempt repair)`)
  console.log(`${'─'.repeat(60)}\n`)
}

function scraperFor(meta: MetadataJson): string | null {
  if (meta.marketplace === 'Amazon US')     return 'amazon-us'
  if (meta.marketplace === 'Amazon India')  return 'amazon-india'
  if (meta.marketplace === 'Amazon IN')     return 'amazon-india'
  if (meta.marketplace === 'Flipkart')      return 'flipkart'
  if (meta.marketplace === 'iHerb')         return 'iherb'
  return null
}

export async function fixProducts(
  results: CheckResult[],
  headed = false
): Promise<{ fixed: number; failed: number; skipped: number }> {
  // Only attempt products that have fixable issues and a product URL
  const targets = results
    .filter((r) => r.meta.productUrl && r.issues.some((i) => FIXABLE.has(i)))
    .sort((a, b) => a.issues.length - b.issues.length)

  if (targets.length === 0) {
    console.log('  No fixable issues found.\n')
    return { fixed: 0, failed: 0, skipped: 0 }
  }

  console.log(`\n  Fixing ${targets.length} products…\n`)

  const browser = await launchBrowser(headed)
  const ctx = await createContext(browser)
  let fixed = 0
  let failed = 0
  let skipped = 0

  for (const { filePath, meta, issues } of targets) {
    const scraperName = scraperFor(meta)
    if (!scraperName) {
      logger.warn('no scraper for marketplace', { marketplace: meta.marketplace })
      skipped++
      continue
    }

    const scraper = getScraper(scraperName)
    const page = await newPage(ctx).catch(() => null)
    if (!page) { failed++; continue }

    try {
      // ── 1. Re-scrape the product page ────────────────────────────
      const rawProduct = await scraper.scrapeProduct(page, meta.productUrl, meta.category)

      // ── 2. Re-extract company (uses bylineInfo + Item Details fallback) ──
      const rawCompany = await scraper.extractCompany(page, rawProduct)
      const companyName = (!rawCompany.name || rawCompany.name === 'Unknown')
        ? meta.company  // keep existing if still unknown
        : rawCompany.name

      // ── 3. Emails ────────────────────────────────────────────────
      let emails = meta.emails.length > 0
        ? meta.emails
        : filterBusinessEmails(extractEmailsFromHtml(rawProduct.rawHtml ?? ''))
      let website = meta.website || rawCompany.website || ''
      if (emails.length === 0 && companyName && companyName !== 'Unknown') {
        const result = await findCompanyEmails(page, companyName)
        emails = result.emails
        website = website || result.website
      }

      // ── 4. LinkedIn + contacts ───────────────────────────────────
      const linkedin = meta.linkedin || rawCompany.linkedin || ''
      const contacts = (meta.contacts ?? []).length > 0
        ? meta.contacts
        : (companyName && companyName !== 'Unknown'
            ? await findLinkedInProfiles(page, companyName)
            : [])

      // ── 5. Images ────────────────────────────────────────────────
      let images = meta.images
      if (meta.images.length === 0 && rawProduct.imageUrls.length > 0) {
        const productDir = path.dirname(filePath)
        const downloaded = await downloadImages({ outputDir: productDir, imageUrls: rawProduct.imageUrls })
        images = downloaded.images
      }

      // ── 6. Build updated metadata ────────────────────────────────
      const updated: MetadataJson = {
        ...meta,
        company:  companyName,
        brand:    rawCompany.brand || companyName,
        website,
        linkedin,
        emails:   emails.length > 0 ? emails : meta.emails,
        contacts: contacts.length > 0 ? contacts : (meta.contacts ?? []),
        images:   images.length > 0 ? images : meta.images,
      }

      // ── 7. Move directory if company was Unknown ─────────────────
      let finalFilePath = filePath
      const wasUnknown = issues.includes('Company = Unknown')
        && companyName !== 'Unknown'
        && companyName !== meta.company

      if (wasUnknown) {
        const productDir    = path.dirname(filePath)
        const productSlug   = path.basename(productDir)
        const dataDir       = path.dirname(path.dirname(productDir))
        const companySlug   = slugify(companyName, { lower: true, strict: true }).slice(0, 80)
        const newCompanyDir = path.join(dataDir, companySlug)
        const newProductDir = path.join(newCompanyDir, productSlug)

        await fs.mkdir(newCompanyDir, { recursive: true })
        await fs.rename(productDir, newProductDir)

        const oldCompanyDir = path.dirname(productDir)
        const remaining = await fs.readdir(oldCompanyDir).catch(() => [])
        if (remaining.length === 0) await fs.rmdir(oldCompanyDir).catch(() => null)

        finalFilePath = path.join(newProductDir, 'metadata.json')
        console.log(`  ✓ [moved]   ${path.basename(oldCompanyDir)} → ${companySlug}`)
      }

      await fs.writeFile(finalFilePath, JSON.stringify(updated, null, 2), 'utf-8')

      // ── 8. Log what was actually fixed ──────────────────────────
      const fixed_fields: string[] = []
      if (wasUnknown)                        fixed_fields.push('company')
      if (!meta.website && website)          fixed_fields.push('website')
      if (meta.emails.length === 0 && emails.length > 0)   fixed_fields.push('emails')
      if (!meta.linkedin && linkedin)        fixed_fields.push('linkedin')
      if ((meta.contacts ?? []).length === 0 && contacts.length > 0) fixed_fields.push('contacts')
      if (meta.images.length === 0 && images.length > 0)   fixed_fields.push('images')

      logger.info('fixed', { company: companyName, fixed: fixed_fields, url: meta.productUrl })
      console.log(`  ✓ ${companyName.padEnd(40)} fixed: [${fixed_fields.join(', ') || 'no change'}]`)
      fixed++
    } catch (err) {
      logger.error('fix failed', { url: meta.productUrl, error: String(err) })
      console.log(`  ✗ ${meta.productUrl}  ${String(err).slice(0, 80)}`)
      failed++
    } finally {
      await page.close()
    }
  }

  await ctx.close().catch(() => null)
  await browser.close().catch(() => null)

  console.log(`\n  Done: ${fixed} fixed, ${failed} failed, ${skipped} skipped\n`)
  return { fixed, failed, skipped }
}
