import Link from 'next/link'
import { StatusBadge, STATUS_OPTIONS } from './status-badge'
import type { getCompanies } from '@/lib/queries/companies'

type Company = Awaited<ReturnType<typeof getCompanies>>['companies'][number]

interface CompaniesTableProps {
  companies: Company[]
  total: number
  currentFilters: {
    status?: string
    country?: string
    q?: string
  }
}

export function CompaniesTable({ companies, total, currentFilters }: CompaniesTableProps) {
  return (
    <div>
      <div className="px-6 py-3 flex items-center gap-3 border-b border-border text-sm">
        <span className="text-text-secondary">{total} companies</span>
      </div>

      <table className="sentinel-table">
        <thead>
          <tr>
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
          {companies.map((company) => (
            <tr key={company.id}>
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

      {companies.length === 0 && (
        <div className="py-16 text-center text-text-muted text-sm">
          No companies found. Run a scrape to get started.
        </div>
      )}
    </div>
  )
}
