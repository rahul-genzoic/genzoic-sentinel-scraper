import { Topbar } from '@/components/layout/topbar'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import Image from 'next/image'

interface PageProps {
  searchParams: Promise<{ labelType?: string }>
}

const LABEL_TYPES = [
  'front_label', 'back_label', 'nutrition_panel',
  'ingredients_panel', 'claims_panel', 'unknown',
]

export default async function ImagesPage({ searchParams }: PageProps) {
  const params = await searchParams

  const images = await prisma.productImage.findMany({
    where: params.labelType ? { labelType: params.labelType } : {},
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      product: {
        select: {
          id:   true,
          name: true,
          company: { select: { id: true, name: true } },
        },
      },
    },
  })

  function imageUrl(diskPath: string): string {
    const normalised = diskPath.replace(/\\/g, '/')
    const parts = normalised.split('/data/')
    return `/api/images/${parts[1] ?? diskPath}`
  }

  return (
    <div>
      <Topbar crumbs={[{ label: 'Images' }]} />

      <div className="px-6 py-3 border-b border-border flex items-center gap-3">
        <div className="flex gap-1.5 flex-wrap">
          <Link
            href="/images"
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              !params.labelType ? 'bg-accent-purple text-white' : 'bg-bg-card text-text-secondary hover:text-text-primary'
            }`}
          >
            All ({images.length})
          </Link>
          {LABEL_TYPES.map((lt) => (
            <Link
              key={lt}
              href={`/images?labelType=${lt}`}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                params.labelType === lt ? 'bg-accent-purple text-white' : 'bg-bg-card text-text-secondary hover:text-text-primary'
              }`}
            >
              {lt.replace(/_/g, ' ')}
            </Link>
          ))}
        </div>
      </div>

      <div className="p-6 grid grid-cols-6 gap-3">
        {images.map((img) => (
          <div key={img.id} className="group">
            <Link href={`/products/${img.product.id}`}>
              <div className="aspect-square bg-bg-card rounded border border-border overflow-hidden
                              hover:border-accent-purple transition-colors relative">
                <Image
                  src={imageUrl(img.diskPath)}
                  alt={img.labelType ?? 'image'}
                  fill
                  className="object-contain p-2"
                  unoptimized
                />
              </div>
              <p className="text-xs text-text-muted mt-1 truncate">{img.product.company.name}</p>
              <p className="text-xs text-text-secondary truncate">{img.product.name}</p>
            </Link>
          </div>
        ))}
      </div>

      {images.length === 0 && (
        <p className="text-center text-text-muted text-sm py-12">
          No images yet. Run a scrape to collect product images.
        </p>
      )}
    </div>
  )
}
