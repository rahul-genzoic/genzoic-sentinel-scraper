# LinkedIn People Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** During Amazon scraping, find LinkedIn profile URLs for company CEO/Founder and Marketing Lead via DuckDuckGo, store in `metadata.json`, and import into a `Contact` DB table.

**Architecture:** New `linkedin-finder.ts` is called inside `extractCompany` on both Amazon scrapers. Contacts flow through `RawCompany` → `metadata.json` → `db-importer.ts` → Postgres `contacts` table via Prisma upsert.

**Tech Stack:** TypeScript, Playwright, Prisma 5.22, PostgreSQL

---

## File Map

| File | Change |
|------|--------|
| `scraper/prisma/schema.prisma` | Add `Contact` model + relation on `Company` |
| `scraper/src/types.ts` | Add `contacts` field to `MetadataJson` |
| `scraper/src/scrapers/base.scraper.ts` | Add `contacts?` to `RawCompany` |
| `scraper/src/lib/linkedin-finder.ts` | **New** — DuckDuckGo LinkedIn search |
| `scraper/src/scrapers/amazon-india.scraper.ts` | Call `findLinkedInProfiles` in `extractCompany` |
| `scraper/src/scrapers/amazon-us.scraper.ts` | Call `findLinkedInProfiles` in `extractCompany` |
| `scraper/src/runner/orchestrator.ts` | Write `contacts` to `metadata.json` |
| `scraper/src/import/db-importer.ts` | Upsert `Contact` rows after company upsert |

---

### Task 1: Add Contact model to Prisma schema

**Files:**
- Modify: `scraper/prisma/schema.prisma`

- [ ] **Step 1: Add Contact model and Company relation**

Replace the `Company` model's closing brace section and add the new model. The full diff — add `contacts Contact[]` to Company, and add the Contact model at the bottom of the file:

```prisma
model Company {
  id          String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  name        String
  brand       String?
  website     String?
  country     String
  linkedin    String?
  social      Json?
  emails      String[]
  contactUrl  String?   @map("contact_url")
  status      String    @default("new")
  priority    Boolean   @default(false)
  notes       String?
  scrapedAt   DateTime? @map("scraped_at")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  products    Product[]
  activityLog ActivityLog[]
  outreach    Outreach[]
  contacts    Contact[]

  @@unique([name, country])
  @@map("companies")
}
```

And at the very end of the file, add:

```prisma
model Contact {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  companyId   String   @map("company_id") @db.Uuid
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  name        String
  title       String
  linkedinUrl String   @unique @map("linkedin_url")
  foundAt     DateTime @default(now()) @map("found_at")

  @@map("contacts")
}
```

- [ ] **Step 2: Generate and run migration**

```bash
cd scraper
npx prisma migrate dev --name add_contact
```

Expected output:
```
Applying migration `..._add_contact`
Your database is now in sync with your schema.
Generated Prisma Client
```

- [ ] **Step 3: Verify generated client has Contact**

```bash
npx tsx -e "import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); console.log(typeof p.contact)"
```

Expected: `object`

- [ ] **Step 4: Commit**

```bash
git add scraper/prisma/schema.prisma scraper/prisma/migrations/
git commit -m "feat(db): add Contact model for LinkedIn people data"
```

---

### Task 2: Update TypeScript types

**Files:**
- Modify: `scraper/src/types.ts`
- Modify: `scraper/src/scrapers/base.scraper.ts`

- [ ] **Step 1: Add ContactMeta type and contacts field to MetadataJson in types.ts**

The full updated `scraper/src/types.ts`:

```typescript
export type LabelType =
  | 'front_label'
  | 'back_label'
  | 'nutrition_panel'
  | 'ingredients_panel'
  | 'claims_panel'
  | 'unknown'

export interface ImageMeta {
  filename: string
  labelType: LabelType
  sha256: string
}

export interface ContactMeta {
  name: string
  title: string
  linkedinUrl: string
}

export interface MetadataJson {
  company: string
  brand: string
  website: string
  emails: string[]
  contactUrl: string
  linkedin: string
  social: Record<string, string>
  country: 'IN' | 'US'
  marketplace: string
  productName: string
  productUrl: string
  category: string
  scrapedAt: string
  images: ImageMeta[]
  contacts: ContactMeta[]
}

export interface RunSummary {
  source: string
  category: string
  total: number
  scraped: number
  failed: number
  skipped: number
  durationMs: number
  startedAt: string
}
```

- [ ] **Step 2: Add contacts? to RawCompany in base.scraper.ts**

The full updated `scraper/src/scrapers/base.scraper.ts`:

```typescript
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

  abstract scrapeProduct(page: Page, url: string): Promise<RawProduct>

  abstract extractCompany(page: Page, product: RawProduct): Promise<RawCompany>
}
```

- [ ] **Step 3: Confirm TypeScript compiles**

```bash
cd scraper
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add scraper/src/types.ts scraper/src/scrapers/base.scraper.ts
git commit -m "feat(types): add ContactMeta and contacts field to RawCompany/MetadataJson"
```

---

### Task 3: Create linkedin-finder.ts

**Files:**
- Create: `scraper/src/lib/linkedin-finder.ts`

- [ ] **Step 1: Create the file**

```typescript
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
        // Normalise to https://www.linkedin.com/in/<slug>
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
    { q: `"${brand}" (founder OR CEO) site:linkedin.com/in`,                              title: 'CEO / Founder'  },
    { q: `"${brand}" (CMO OR "marketing director" OR "sales director") site:linkedin.com/in`, title: 'Marketing Lead' },
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd scraper
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add scraper/src/lib/linkedin-finder.ts
git commit -m "feat(scraper): add LinkedIn profile finder via DuckDuckGo"
```

---

### Task 4: Wire linkedin-finder into Amazon India scraper

**Files:**
- Modify: `scraper/src/scrapers/amazon-india.scraper.ts`

- [ ] **Step 1: Update extractCompany**

The current `extractCompany` in `amazon-india.scraper.ts` ends at line ~112. Replace the entire method with:

```typescript
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
```

Also add the import at the top of the file (after the existing imports):

```typescript
import { findLinkedInProfiles } from '../lib/linkedin-finder.js'
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd scraper
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add scraper/src/scrapers/amazon-india.scraper.ts
git commit -m "feat(scraper): find LinkedIn profiles in Amazon India extractCompany"
```

---

### Task 5: Wire linkedin-finder into Amazon US scraper

**Files:**
- Modify: `scraper/src/scrapers/amazon-us.scraper.ts`

- [ ] **Step 1: Update extractCompany**

Replace the entire `extractCompany` method with:

```typescript
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
```

Also add the import at the top of the file:

```typescript
import { findLinkedInProfiles } from '../lib/linkedin-finder.js'
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd scraper
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add scraper/src/scrapers/amazon-us.scraper.ts
git commit -m "feat(scraper): find LinkedIn profiles in Amazon US extractCompany"
```

---

### Task 6: Write contacts to metadata.json in orchestrator

**Files:**
- Modify: `scraper/src/runner/orchestrator.ts`

- [ ] **Step 1: Add contacts to MetadataJson object**

In `orchestrator.ts`, find the `metadata` object (around line 105). Add `contacts` field:

```typescript
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
          contacts:    rawCompany.contacts ?? [],
        }
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd scraper
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add scraper/src/runner/orchestrator.ts
git commit -m "feat(scraper): write contacts array to metadata.json"
```

---

### Task 7: Import contacts into database

**Files:**
- Modify: `scraper/src/import/db-importer.ts`

- [ ] **Step 1: Add contact upsert loop after company upsert**

In `db-importer.ts`, find the block after `const company = await prisma.company.upsert(...)` (around line 64). Add the contact upsert loop immediately after:

```typescript
      for (const c of meta.contacts ?? []) {
        if (!c.linkedinUrl) continue
        await prisma.contact.upsert({
          where:  { linkedinUrl: c.linkedinUrl },
          create: { companyId: company.id, name: c.name, title: c.title, linkedinUrl: c.linkedinUrl },
          update: { name: c.name, title: c.title },
        })
      }
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd scraper
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add scraper/src/import/db-importer.ts
git commit -m "feat(import): upsert Contact rows from metadata.json contacts field"
```

---

### Task 8: End-to-end smoke test

- [ ] **Step 1: Scrape one product with headed browser to observe LinkedIn search**

```bash
cd scraper
npx tsx cli.ts scrape --source amazon-india --category protein --limit 1 --headed
```

Watch the browser — after the Amazon product page, it should navigate to DuckDuckGo twice (CEO search, then Marketing search).

Expected log output includes something like:
```
[debug] linkedin search {"brand":"MuscleBlaze Store","title":"CEO / Founder","found":1}
[debug] linkedin search {"brand":"MuscleBlaze Store","title":"Marketing Lead","found":0}
[info]  scraped product {"product":"...","company":"MuscleBlaze Store"}
```

- [ ] **Step 2: Import and verify contacts in DB**

```bash
npx tsx cli.ts import
```

Then check the database:

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const contacts = await p.contact.findMany({ include: { company: { select: { name: true } } } })
console.log(JSON.stringify(contacts, null, 2))
await p.\$disconnect()
"
```

Expected: at least one contact row with a valid `linkedin_url`.

- [ ] **Step 3: Commit final**

```bash
git add -A
git commit -m "chore: verify LinkedIn enrichment end-to-end"
```
