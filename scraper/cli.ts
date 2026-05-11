#!/usr/bin/env node
import 'dotenv/config'
import { program } from 'commander'
import { getScraper, getAllScrapers, listScraperNames } from './src/scrapers/registry.js'
import { SCRAPER_CONFIGS } from './src/config/scrapers.config.js'
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
  .option('--category <category>', 'Product category to search (omit to run all default categories for the source)')
  .option('--limit <number>', 'Max products to scrape per category', '50')
  .option('--headed', 'Run browser in headed (visible) mode for debugging')
  .action(async (opts) => {
    const limit = parseInt(opts.limit, 10)
    const headed: boolean = !!opts.headed
    const scrapers = opts.source === 'all' ? getAllScrapers() : [getScraper(opts.source)]
    for (const scraper of scrapers) {
      const config = SCRAPER_CONFIGS[scraper.name]
      const categories: string[] = opts.category ? [opts.category] : (config?.categories ?? ['supplements'])
      for (const category of categories) {
        const summary = await runScraper({ scraper, category, limit, headed })
        console.log(`\n✓ ${scraper.name}/${category}: ${summary.scraped} scraped, ${summary.failed} failed (${summary.durationMs}ms)\n`)
      }
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
