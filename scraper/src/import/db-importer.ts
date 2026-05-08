import { readFile, readdir } from 'fs/promises'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { logger } from '../lib/logger.js'
import type { MetadataJson } from '../types.js'

async function findMetadataFiles(dir: string): Promise<string[]> {
  const results: string[] = []

  // Try to read metadata.json directly in this directory first
  const directMeta = path.join(dir, 'metadata.json')
  const hasDirect = await readFile(directMeta, 'utf-8').then(() => true).catch(() => false)
  if (hasDirect) {
    results.push(directMeta)
  }

  // Recurse into subdirectories
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  for (const entry of entries) {
    if (typeof entry.name !== 'string' || !entry.name) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...await findMetadataFiles(full))
    } else if (entry.name === 'metadata.json') {
      // Already captured above if at this level; avoid duplicates
      if (!results.includes(full)) results.push(full)
    }
  }

  return results
}

export async function importFromDisk(
  dataDir: string,
  prisma: PrismaClient = new PrismaClient()
): Promise<{ imported: number; failed: number }> {
  const metadataFiles = await findMetadataFiles(dataDir)
  let imported = 0
  let failed = 0

  for (const filePath of metadataFiles) {
    try {
      const meta: MetadataJson = JSON.parse(await readFile(filePath, 'utf-8'))
      const productDir = path.dirname(filePath)

      const company = await prisma.company.upsert({
        where:  { name_country: { name: meta.company, country: meta.country } },
        create: {
          name:       meta.company,
          brand:      meta.brand,
          website:    meta.website || null,
          country:    meta.country,
          emails:     meta.emails,
          contactUrl: meta.contactUrl || null,
          linkedin:   meta.linkedin  || null,
          social:     meta.social,
          scrapedAt:  new Date(meta.scrapedAt),
        },
        update: {
          emails:    meta.emails,
          website:   meta.website || undefined,
          scrapedAt: new Date(meta.scrapedAt),
        },
      })

      const product = await prisma.product.upsert({
        where:  { sourceUrl: meta.productUrl },
        create: {
          companyId:   company.id,
          name:        meta.productName,
          marketplace: meta.marketplace,
          sourceUrl:   meta.productUrl,
          category:    meta.category,
          country:     meta.country,
          diskPath:    productDir,
          scrapedAt:   new Date(meta.scrapedAt),
        },
        update: {
          name:      meta.productName,
          diskPath:  productDir,
          scrapedAt: new Date(meta.scrapedAt),
        },
      })

      for (const img of meta.images) {
        const exists = await prisma.productImage.findFirst({ where: { sha256: img.sha256 } })
        if (!exists) {
          await prisma.productImage.create({
            data: {
              productId: product.id,
              filename:  img.filename,
              diskPath:  path.join(productDir, img.filename),
              labelType: img.labelType,
              sha256:    img.sha256,
            },
          })
        }
      }

      imported++
      logger.info('imported', { product: meta.productName, company: meta.company })
    } catch (err) {
      failed++
      logger.error('import failed', { file: filePath, error: String(err) })
    }
  }

  await prisma.$disconnect()
  logger.info('import complete', { imported, failed, total: metadataFiles.length })
  return { imported, failed }
}
