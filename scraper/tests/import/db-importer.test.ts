import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@prisma/client', () => {
  const upsertCompany = vi.fn().mockResolvedValue({ id: 'company-uuid-1' })
  const upsertProduct = vi.fn().mockResolvedValue({ id: 'product-uuid-1' })
  const findFirst     = vi.fn().mockResolvedValue(null)
  const createImage   = vi.fn().mockResolvedValue({})

  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      company:      { upsert: upsertCompany },
      product:      { upsert: upsertProduct },
      productImage: { findFirst, create: createImage },
      $disconnect:  vi.fn(),
    })),
  }
})

vi.mock('fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs/promises')>()
  return {
    ...actual,
    readdir: vi.fn().mockResolvedValue([
      Object.assign('muscleblaze', { isDirectory: () => true }),
    ]),
    readFile: vi.fn().mockImplementation((p: string) => {
      if (String(p).endsWith('metadata.json')) {
        return Promise.resolve(JSON.stringify({
          company:     'MuscleBlaze',
          brand:       'MuscleBlaze',
          website:     'https://muscleblaze.com',
          emails:      ['info@muscleblaze.com'],
          contactUrl:  '',
          linkedin:    '',
          social:      {},
          country:     'IN',
          marketplace: 'amazon-india',
          productName: 'Biozyme Whey',
          productUrl:  'https://amazon.in/dp/B0001',
          category:    'protein',
          scrapedAt:   '2026-05-08T10:00:00Z',
          images: [
            { filename: 'front.jpg', labelType: 'front_label', sha256: 'abc123' },
          ],
        }))
      }
      return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    }),
  }
})

vi.mock('../../src/lib/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('importFromDisk', () => {
  beforeEach(() => vi.clearAllMocks())

  it('upserts company from metadata.json', async () => {
    const { importFromDisk } = await import('../../src/import/db-importer.js')
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new (PrismaClient as any)()

    await importFromDisk('./data', prisma)

    expect(prisma.company.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where:  { name_country: { name: 'MuscleBlaze', country: 'IN' } },
        create: expect.objectContaining({ name: 'MuscleBlaze', country: 'IN' }),
      })
    )
  })

  it('upserts product linked to company', async () => {
    const { importFromDisk } = await import('../../src/import/db-importer.js')
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new (PrismaClient as any)()

    await importFromDisk('./data', prisma)

    expect(prisma.product.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where:  { sourceUrl: 'https://amazon.in/dp/B0001' },
        create: expect.objectContaining({ name: 'Biozyme Whey', companyId: 'company-uuid-1' }),
      })
    )
  })
})
