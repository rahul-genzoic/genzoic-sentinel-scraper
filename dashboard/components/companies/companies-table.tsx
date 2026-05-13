import Link from 'next/link'
import { StatusBadge } from './status-badge'
import type { getCompanies } from '@/lib/queries/companies'

type Company = Awaited<ReturnType<typeof getCompanies>>['companies'][number]

const PAGE_SIZE = 50

interface CompaniesTableProps {
  companies: Company[]
  total: number
  currentPage?: number
  currentFilters: {
    status?: string
    country?: string
    q?: string
  }
}

function pageUrl(filters: CompaniesTableProps['currentFilters'], page: number) {
  const p = new URLSearchParams()
  if (filters.q) p.set('q', filters.q)
  if (filters.status) p.set('status', filters.status)
  if (filters.country) p.set('country', filters.country)
  if (page > 1) p.set('page', String(page))
  const qs = p.toString()
  return `/companies${qs ? `?${qs}` : ''}`
}

function Pagination({ total, page, filters }: { total: number; page: number; filters: CompaniesTableProps['currentFilters'] }) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  if (totalPages <= 1) return null
  const from = (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="px-6 py-3 flex items-center justify-between border-t border-border text-sm">
      <span className="text-text-muted">{from}–{to} of {total}</span>
      <div className="flex items-center gap-1">
        {pages.map((p) => (
          <Link
            key={p}
            href={pageUrl(filters, p)}
            className={`w-8 h-8 flex items-center justify-center rounded border text-xs transition-colors
              ${p === page
                ? 'bg-accent-purple border-accent-purple text-white font-medium'
                : 'bg-bg-card border-border text-text-secondary hover:border-accent-purple'
              }`}
          >
            {p}
          </Link>
        ))}
      </div>
    </div>
  )
}

export function CompaniesTable({ companies, total, currentPage = 1, currentFilters }: CompaniesTableProps) {
  return (
    <div>
      <div className="px-6 py-3 flex items-center gap-3 border-b border-border text-sm">
        <span className="text-text-secondary">{total} companies</span>
        {total > PAGE_SIZE && (
          <span className="text-text-muted">
            — showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, total)}
          </span>
        )}
      </div>

      <div className="sentinel-table-scroll">
        <table className="sentinel-table">
          <thead>
            <tr>
              <th className="w-10 text-center">#</th>
              <th>Company</th>
              <th>Brand</th>
              <th>Country</th>
              <th>Status</th>
              <th>Emails</th>
              <th>Products</th>
              <th>Last Scraped</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company, i) => (
              <tr key={company.id}>
                <td className="text-center text-text-muted text-xs w-10">
                  {(currentPage - 1) * PAGE_SIZE + i + 1}
                </td>
                <td>
                  <Link
                    href={`/companies/${company.id}`}
                    className="text-accent-purple hover:underline font-medium"
                  >
                    {company.name}
                  </Link>
                </td>
                <td className="text-text-secondary">{company.brand ?? '—'}</td>
                <td>
                  <span className="text-xs font-mono bg-bg-card px-1.5 py-0.5 rounded">
                    {company.country}
                  </span>
                </td>
                <td><StatusBadge status={company.status} /></td>
                <td className="text-text-secondary">{company.emails.length}</td>
                <td className="text-text-secondary">{company._count.products}</td>
                <td className="text-text-muted text-xs">
                  {company.scrapedAt
                    ? new Date(company.scrapedAt).toLocaleDateString()
                    : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {companies.length === 0 && (
        <div className="py-16 text-center text-text-muted text-sm">
          No companies found. Run a scrape to get started.
        </div>
      )}

      <Pagination total={total} page={currentPage} filters={currentFilters} />
    </div>
  )
}
