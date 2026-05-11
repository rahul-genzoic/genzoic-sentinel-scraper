import { Topbar } from '@/components/layout/topbar'
import { ProductsTable } from '@/components/products/products-table'
import { getProducts } from '@/lib/queries/products'

interface PageProps {
  searchParams: Promise<{ page?: string; marketplace?: string; category?: string }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { products, total } = await getProducts({
    marketplace: params.marketplace,
    category:    params.category,
    page:        params.page ? parseInt(params.page) : 1,
  })

  return (
    <div>
      <Topbar crumbs={[{ label: 'Products' }]} />
      <ProductsTable products={products} total={total} />
    </div>
  )
}
