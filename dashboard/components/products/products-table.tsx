import Link from 'next/link'
import type { getProducts } from '@/lib/queries/products'

type Product = Awaited<ReturnType<typeof getProducts>>['products'][number]

export function ProductsTable({ products, total }: { products: Product[]; total: number }) {
  return (
    <div>
      <div className="px-6 py-3 border-b border-border text-sm text-text-secondary">
        {total} products
      </div>
      <table className="sentinel-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Company</th>
            <th>Marketplace</th>
            <th>Category</th>
            <th>Images</th>
            <th>Findings</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>
                <Link href={`/products/${p.id}`} className="text-accent-purple hover:underline">
                  {p.name}
                </Link>
              </td>
              <td>
                <Link href={`/companies/${p.company.id}`} className="text-text-secondary hover:text-text-primary">
                  {p.company.name}
                </Link>
              </td>
              <td className="text-text-secondary text-xs">{p.marketplace}</td>
              <td className="text-text-secondary">{p.category ?? '—'}</td>
              <td className="text-text-secondary">{p._count.images}</td>
              <td className="text-text-secondary">{p._count.findings}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {products.length === 0 && (
        <p className="text-center text-text-muted text-sm py-12">No products. Run a scrape first.</p>
      )}
    </div>
  )
}
