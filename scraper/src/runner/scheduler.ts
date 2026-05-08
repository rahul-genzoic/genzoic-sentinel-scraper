import cron from 'node-cron'
import fs from 'fs/promises'
import { getScraper } from '../scrapers/registry.js'
import { runScraper } from './orchestrator.js'
import { logger } from '../lib/logger.js'

interface ScheduleEntry {
  source: string
  category: string
  cron: string
  limit?: number
}

export async function startScheduler(configPath: string): Promise<void> {
  const raw = await fs.readFile(configPath, 'utf-8')
  const entries: ScheduleEntry[] = JSON.parse(raw)

  for (const entry of entries) {
    if (!cron.validate(entry.cron)) {
      logger.error('invalid cron expression', { source: entry.source, cron: entry.cron })
      continue
    }

    cron.schedule(entry.cron, () => {
      logger.info('scheduled run starting', { source: entry.source, category: entry.category })
      const scraper = getScraper(entry.source)
      runScraper({ scraper, category: entry.category, limit: entry.limit }).catch((err) => {
        logger.error('scheduled run failed', { source: entry.source, error: String(err) })
      })
    })

    logger.info('scheduled', { source: entry.source, cron: entry.cron })
  }

  logger.info(`scheduler running with ${entries.length} jobs — press Ctrl+C to stop`)
  await new Promise(() => {}) // keep process alive
}
