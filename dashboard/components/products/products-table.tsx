import Link from 'next/link'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { ChevronLeft, ChevronRight, ImageIcon, AlertTriangle } from 'lucide-react'
import type { getProducts } from '@/lib/queries/products'

type Product = Awaited<ReturnType<typeof getProducts>>['products'][number]

const PAGE_SIZE = 50

interface ProductsTableProps {
  products: Product[]
  total: number
  currentPage?: number
  currentFilters?: {
    marketplace?: string
    category?: string
  }
}

function pageUrl(filters: ProductsTableProps['currentFilters'] = {}, page: number) {
  const p = new URLSearchParams()
  if (filters.marketplace) p.set('marketplace', filters.marketplace)
  if (filters.category)    p.set('category', filters.category)
  if (page > 1)            p.set('page', String(page))
  const qs = p.toString()
  return `/products${qs ? `?${qs}` : ''}`
}

const MARKETPLACE_STYLES: Record<string, string> = {
  'Amazon US': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Amazon IN': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Flipkart':  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'iHerb':     'bg-green-500/10 text-green-400 border-green-500/20',
}

function MarketplaceBadge({ marketplace }: { marketplace: string }) {
  const cls = MARKETPLACE_STYLES[marketplace] ?? 'bg-muted/40 text-muted-foreground border-border'
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap', cls)}>
      {marketplace}
    </span>
  )
}

function FindingsBadge({ count }: { count: number }) {
  if (count === 0) return <span className="text-muted-foreground/40 text-xs">—</span>
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
      <AlertTriangle className="w-3 h-3" />
      {count}
    </span>
  )
}

function Pagination({ total, page, filters }: { total: number; page: number; filters: ProductsTableProps['currentFilters'] }) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  if (totalPages <= 1) return null

  const from = (page - 1) * PAGE_SIZE + 1
  const to   = Math.min(page * PAGE_SIZE, total)

  const delta = 3
  const start = Math.max(1, page - delta)
  const end   = Math.min(totalPages, page + delta)
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const navBtn = cn(buttonVariants({ variant: 'outline', size: 'icon-sm' }))
  const pageBtn = (active: boolean) => cn(buttonVariants({ variant: active ? 'default' : 'outline', size: 'xs' }))

  return (
    <div className="px-6 py-3 flex items-center justify-between border-t border-border text-sm">
      <span className="text-muted-foreground text-xs">{from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link href={pageUrl(filters, page - 1)} className={navBtn}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <span className={cn(navBtn, 'pointer-events-none opacity-40')}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </span>
        )}

        {start > 1 && (
          <>
            <Link href={pageUrl(filters, 1)} className={pageBtn(false)}>1</Link>
            {start > 2 && <span className="text-muted-foreground text-xs px-1">…</span>}
          </>
        )}

        {pages.map((p) =>
          p === page ? (
            <span key={p} className={pageBtn(true)}>{p}</span>
          ) : (
            <Link key={p} href={pageUrl(filters, p)} className={pageBtn(false)}>{p}</Link>
          )
        )}

        {end < totalPages && (
          <>
            {end < totalPages - 1 && <span className="text-muted-foreground text-xs px-1">…</span>}
            <Link href={pageUrl(filters, totalPages)} className={pageBtn(false)}>{totalPages}</Link>
          </>
        )}

        {page < totalPages ? (
          <Link href={pageUrl(filters, page + 1)} className={navBtn}>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <span className={cn(navBtn, 'pointer-events-none opacity-40')}>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </div>
  )
}

export function ProductsTable({ products, total, currentPage = 1, currentFilters }: ProductsTableProps) {
  return (
    <div>
      <div className="px-6 py-3 border-b border-border text-sm flex items-center gap-2">
        <span className="font-semibold text-foreground">{total}</span>
        <span className="text-muted-foreground">products</span>
        {total > PAGE_SIZE && (
          <span className="text-muted-foreground">
            — showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)}
          </span>
        )}
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-220px)]">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-[#0f0f0f]">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-10 text-center text-xs uppercase tracking-wider text-muted-foreground font-medium">#</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Product</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium whitespace-nowrap">Company</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium whitespace-nowrap">Marketplace</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Category</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium text-right w-20">Images</TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium text-right w-24">Findings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p, i) => (
              <TableRow key={p.id} className="border-border hover:bg-white/[0.02]">
                <TableCell className="text-center text-muted-foreground text-xs w-10">
                  {(currentPage - 1) * PAGE_SIZE + i + 1}
                </TableCell>
                <TableCell className="max-w-md py-3 px-2">
                  <Link
                    href={`/products/${p.id}`}
                    className="text-accent-purple hover:underline text-sm leading-snug line-clamp-2 whitespace-normal"
                    title={p.name}
                  >
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell className="py-3 px-2">
                  <Link
                    href={`/companies/${p.company.id}`}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
                  >
                    {p.company.name}
                  </Link>
                </TableCell>
                <TableCell className="py-3 px-2">
                  <MarketplaceBadge marketplace={p.marketplace} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground py-3 px-2">
                  {p.category ?? <span className="text-muted-foreground/30">—</span>}
                </TableCell>
                <TableCell className="text-right py-3 px-2">
                  <span className="inline-flex items-center gap-1 text-muted-foreground text-sm">
                    <ImageIcon className="w-3.5 h-3.5 opacity-50" />
                    {p._count.images}
                  </span>
                </TableCell>
                <TableCell className="text-right py-3 px-2">
                  <FindingsBadge count={p._count.findings} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {products.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm">
          No products found. Run a scrape to get started.
        </div>
      )}

      <Pagination total={total} page={currentPage} filters={currentFilters} />
    </div>
  )
}
