import { prisma } from '@/lib/db'

export async function getProducts(filters: {
  companyId?: string
  category?: string
  marketplace?: string
  page?: number
} = {}) {
  const { companyId, category, marketplace, page = 1 } = filters
  const PAGE_SIZE = 50

  const where = {
    ...(companyId   ? { companyId }   : {}),
    ...(category    ? { category }    : {}),
    ...(marketplace ? { marketplace } : {}),
  }

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * PAGE_SIZE,
      take:    PAGE_SIZE,
      include: {
        company: { select: { id: true, name: true } },
        _count:  { select: { images: true, findings: true } },
      },
    }),
    prisma.product.count({ where }),
  ])

  return { products, total }
}

export async function getProduct(id: string) {
  return prisma.product.findUniqueOrThrow({
    where:   { id },
    include: {
      company:  { select: { id: true, name: true } },
      images:   { orderBy: { createdAt: 'asc' } },
      findings: { orderBy: { createdAt: 'desc' } },
    },
  })
}
