import { prisma } from '@/lib/db'

export interface CompanyFilters {
  status?: string
  country?: string
  q?: string
  sort?: string
  dir?: 'asc' | 'desc'
  page?: number
}

const PAGE_SIZE = 50

export async function getCompanies(filters: CompanyFilters = {}) {
  const { status, country, q, sort = 'scraped_at', dir = 'desc', page = 1 } = filters

  const where = {
    ...(status  ? { status }  : {}),
    ...(country ? { country } : {}),
    ...(q ? {
      OR: [
        { name:  { contains: q, mode: 'insensitive' as const } },
        { brand: { contains: q, mode: 'insensitive' as const } },
      ],
    } : {}),
  }

  const [companies, total] = await prisma.$transaction([
    prisma.company.findMany({
      where,
      orderBy: { [sort]: dir },
      skip:  (page - 1) * PAGE_SIZE,
      take:  PAGE_SIZE,
      include: { _count: { select: { products: true } } },
    }),
    prisma.company.count({ where }),
  ])

  return { companies, total, page, pageSize: PAGE_SIZE }
}

export async function getCompany(id: string) {
  return prisma.company.findUniqueOrThrow({
    where: { id },
    include: {
      products:    { orderBy: { createdAt: 'desc' }, take: 20 },
      activityLog: { orderBy: { createdAt: 'desc' }, take: 50 },
      outreach:    { orderBy: { createdAt: 'desc' } },
      _count:      { select: { products: true } },
    },
  })
}

export async function getWorkflowCounts() {
  const rows = await prisma.company.groupBy({
    by: ['status'],
    _count: { status: true },
  })
  return Object.fromEntries(rows.map((r) => [r.status, r._count.status]))
}

export async function getCompaniesByStatus(status: string) {
  return prisma.company.findMany({
    where: { status },
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { products: true } } },
  })
}
