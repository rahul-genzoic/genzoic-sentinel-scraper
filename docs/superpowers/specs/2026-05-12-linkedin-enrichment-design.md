# LinkedIn People Enrichment — Implementation Spec

**Goal:** During Amazon scraping (both US and India), find LinkedIn profile URLs for the company's CEO/Founder and Marketing/Sales lead, store them in `metadata.json`, and import into a `Contact` DB table.

**Architecture:** `linkedin-finder.ts` runs two DuckDuckGo searches per brand inside `extractCompany`. Results flow through `RawCompany` → `metadata.json` → `db-importer.ts` → `Contact` table. No new CLI commands. No external paid APIs.

**Tech Stack:** Playwright (reuses existing page), Prisma, TypeScript, DuckDuckGo HTML search.

---

## Data Model

### New Prisma model — `Contact`

```prisma
model Contact {
  id          String   @id @default(cuid())
  companyId   String
  company     Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  name        String
  title       String
  linkedinUrl String   @unique
  foundAt     DateTime @default(now())
}
```

- `linkedinUrl` is unique — deduplication key on upsert.
- `name` is derived from the LinkedIn URL slug (`john-doe` → `John Doe`), best-effort.
- `title` is one of: `"CEO / Founder"` or `"Marketing Lead"`.

### Company model change

Add `contacts Contact[]` relation to existing `Company` model.

### `metadata.json` — new `contacts` field

```json
"contacts": [
  { "name": "John Doe",  "title": "CEO / Founder",  "linkedinUrl": "https://www.linkedin.com/in/john-doe" },
  { "name": "Jane Smith","title": "Marketing Lead",  "linkedinUrl": "https://www.linkedin.com/in/jane-smith" }
]
```

---

## Files

### New: `scraper/src/lib/linkedin-finder.ts`

**Responsibility:** Given a Playwright page and a brand name, search DuckDuckGo twice and return up to 3 LinkedIn `/in/` profile URLs with inferred name and title.

**Queries:**
1. `"[brand]" (founder OR CEO) site:linkedin.com/in` → title `"CEO / Founder"`
2. `"[brand]" (CMO OR "marketing director" OR "sales director") site:linkedin.com/in` → title `"Marketing Lead"`

**Logic:**
- `page.goto` DuckDuckGo HTML endpoint for each query.
- Extract `a.result__a` hrefs, filter to those containing `linkedin.com/in/`.
- Skip duplicate `/in/` slugs across both queries.
- Derive `name` from slug: `split('-').map(capitalize).join(' ')`.
- Return `{ name, title, linkedinUrl }[]`, max 2 per title (4 total cap, realistically 1–3).
- All errors are non-fatal — returns `[]` on any failure.
- 1.5 second wait between the two queries.

**Export:** `findLinkedInProfiles(page: Page, brand: string): Promise<Contact[]>`

where `Contact = { name: string; title: string; linkedinUrl: string }`.

---

### Modified: `scraper/src/scrapers/base.scraper.ts`

Add `contacts?` to `RawCompany`:

```typescript
export interface RawCompany {
  name: string
  brand: string
  emails: string[]
  website?: string
  country: 'IN' | 'US'
  contactUrl?: string
  linkedin?: string
  social?: Record<string, string>
  contacts?: Array<{ name: string; title: string; linkedinUrl: string }>
}
```

---

### Modified: `scraper/src/scrapers/amazon-india.scraper.ts` and `amazon-us.scraper.ts`

In `extractCompany`, after the email finding block, add:

```typescript
const contacts = brand ? await findLinkedInProfiles(page, brand) : []
return { ..., contacts }
```

Import `findLinkedInProfiles` from `../lib/linkedin-finder.js`.

---

### Modified: `scraper/src/runner/orchestrator.ts`

Add `contacts` to the `metadata` object written to `metadata.json`:

```typescript
const metadata: MetadataJson = {
  ...
  contacts: rawCompany.contacts ?? [],
}
```

---

### Modified: `scraper/src/types.ts`

Add `contacts` to `MetadataJson`:

```typescript
contacts: Array<{ name: string; title: string; linkedinUrl: string }>
```

---

### Modified: `scraper/src/import/db-importer.ts`

After upserting the company, upsert each contact:

```typescript
for (const c of meta.contacts ?? []) {
  await prisma.contact.upsert({
    where:  { linkedinUrl: c.linkedinUrl },
    create: { companyId: company.id, name: c.name, title: c.title, linkedinUrl: c.linkedinUrl },
    update: { name: c.name, title: c.title },
  })
}
```

---

### Modified: `scraper/prisma/schema.prisma`

- Add `Contact` model (see above).
- Add `contacts Contact[]` to `Company`.

---

## Error Handling

- `findLinkedInProfiles` catches all errors internally, always returns `[]` on failure — scraping must not fail because of enrichment.
- DuckDuckGo rate limiting: 1.5s delay between queries is sufficient for single-brand sequential use.
- Malformed LinkedIn URLs (no `/in/` segment) are filtered out silently.

---

## What This Does NOT Do

- Does not scrape LinkedIn profile pages — only stores the URL.
- Does not use any paid API.
- Does not add a separate CLI enrich command.
- Does not touch the dashboard (contacts are in DB, ready for a future UI).
