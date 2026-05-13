# Genzoic Sentinel

A marketplace compliance and data collection system for monitoring health and supplement products on e-commerce platforms (Amazon India & US).

## Overview

Sentinel scrapes product listings, detects compliance issues in labels and descriptions, tracks outreach campaigns, and presents everything through a web dashboard.

## Structure

```
Genzoic Sentinel/
├── scraper/        # Node.js CLI — scraping, importing, data checks
├── dashboard/      # Next.js web dashboard
├── data/           # Raw scraped data (company/product directories)
└── docs/           # Specs and implementation plans
```

## Tech Stack

- **Scraper**: Node.js, TypeScript, Playwright, Prisma, Commander, Winston
- **Dashboard**: Next.js 16, React 19, Tailwind CSS, shadcn/ui, Prisma
- **Database**: PostgreSQL

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running on port 5432

### Setup

1. **Clone the repo**

   ```bash
   git clone https://github.com/rahul-genzoic/genzoic-sentinel-scraper.git
   cd genzoic-sentinel-scraper
   ```

2. **Configure environment**

   Scraper (`scraper/.env`):
   ```env
   DATABASE_URL="postgresql://postgres:<password>@localhost:5432/sentinel"
   DATA_ROOT="./data"
   LOG_DIR="./logs"
   ```

   Dashboard (`dashboard/.env.local`):
   ```env
   DATABASE_URL="postgresql://postgres:<password>@localhost:5432/sentinel"
   DATA_ROOT="../data"
   ```

3. **Install dependencies and run migrations**

   ```bash
   cd scraper && npm install && npm run migrate
   cd ../dashboard && npm install
   ```

### Running

**Dashboard** (http://localhost:3000):
```bash
cd dashboard && npm run dev
```

**Scraper CLI:**
```bash
cd scraper

npm run scrape:amazon      # Scrape Amazon India & US
npm run import             # Import scraped data into the database
npm run check              # Validate data integrity
npm run check:fix          # Auto-fix incomplete metadata
```

## Database Models

`Company` · `Product` · `ProductImage` · `ComplianceFinding` · `ActivityLog` · `Outreach` · `Contact`

## License

[MIT](LICENSE)
