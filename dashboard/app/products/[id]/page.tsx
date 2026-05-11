import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Topbar } from '@/components/layout/topbar'
import { ImageGallery } from '@/components/products/image-gallery'
import { getProduct } from '@/lib/queries/products'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params
  let product
  try {
    product = await getProduct(id)
  } catch {
    notFound()
  }

  return (
    <div>
      <Topbar
        crumbs={[
          { label: 'Products', href: '/products' },
          { label: product.name },
        ]}
      />

      <div className="p-6 grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">{product.name}</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-text-muted text-xs uppercase tracking-wider">Company</dt>
              <dd className="mt-0.5">
                <Link href={`/companies/${product.company.id}`} className="text-accent-purple hover:underline">
                  {product.company.name}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-text-muted text-xs uppercase tracking-wider">Marketplace</dt>
              <dd className="text-text-primary mt-0.5">{product.marketplace}</dd>
            </div>
            <div>
              <dt className="text-text-muted text-xs uppercase tracking-wider">Category</dt>
              <dd className="text-text-primary mt-0.5">{product.category ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-text-muted text-xs uppercase tracking-wider">Source URL</dt>
              <dd className="mt-0.5">
                {product.sourceUrl ? (
                  <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer"
                    className="text-accent-blue hover:underline text-xs break-all">
                    {product.sourceUrl}
                  </a>
                ) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-text-muted text-xs uppercase tracking-wider">Scraped</dt>
              <dd className="text-text-secondary mt-0.5">
                {product.scrapedAt ? new Date(product.scrapedAt).toLocaleString() : '—'}
              </dd>
            </div>
          </dl>

          {product.findings.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                Compliance Findings
              </h3>
              <ul className="space-y-2">
                {product.findings.map((f) => (
                  <li key={f.id} className="flex gap-2 text-sm">
                    <span className={`mt-0.5 flex-shrink-0 w-2 h-2 rounded-full ${
                      f.severity === 'critical' ? 'bg-accent-red'
                      : f.severity === 'warning' ? 'bg-accent-amber'
                      : 'bg-accent-blue'
                    }`} />
                    <span className="text-text-secondary">{f.finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Label Images ({product.images.length})
          </h3>
          <ImageGallery images={product.images} />
        </div>
      </div>
    </div>
  )
}
