#!/usr/bin/env node
import 'dotenv/config'
import { program } from 'commander'
import { getScraper, getAllScrapers, listScraperNames } from './src/scrapers/registry.js'
import { runScraper } from './src/runner/orchestrator.js'
import { startScheduler } from './src/runner/scheduler.js'
import { importFromDisk } from './src/import/db-importer.js'
import { logger } from './src/lib/logger.js'

program
  .name('sentinel')
  .description('Genzoic Sentinel — data collection CLI')
  .version('1.0.0')

program
  .command('scrape')
  .description('Scrape products from a marketplace source')
  .requiredOption('--source <source>', `Scraper name or "all". Options: ${listScraperNames().join(', ')}`)
  .requiredOption('--category <category>', 'Product category to search')
  .option('--limit <number>', 'Max products to scrape', '50')
  .action(async (opts) => {
    const limit = parseInt(opts.limit, 10)
    const scrapers = opts.source === 'all' ? getAllScrapers() : [getScraper(opts.source)]
    for (const scraper of scrapers) {
      const summary = await runScraper({ scraper, category: opts.category, limit })
      console.log(`\n✓ ${scraper.name}: ${summary.scraped} scraped, ${summary.failed} failed (${summary.durationMs}ms)\n`)
    }
  })

program
  .command('import')
  .description('Import scraped data from disk into PostgreSQL')
  .option('--dir <dir>', 'Data root directory', './data')
  .action(async (opts) => {
    const { imported, failed } = await importFromDisk(opts.dir)
    console.log(`\n✓ Import complete: ${imported} imported, ${failed} failed\n`)
  })

program
  .command('schedule')
  .description('Start scheduled scraping jobs from a config file')
  .option('--config <path>', 'Path to schedule.json', './schedule.json')
  .action(async (opts) => {
    await startScheduler(opts.config)
  })

program.parseAsync(process.argv).catch((err) => {
  logger.error('CLI error', { error: String(err) })
  process.exit(1)
})
