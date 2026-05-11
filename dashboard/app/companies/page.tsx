import { Topbar } from '@/components/layout/topbar'
import { CompaniesTable } from '@/components/companies/companies-table'
import { getCompanies } from '@/lib/queries/companies'
import { STATUS_OPTIONS } from '@/components/companies/status-badge'

interface PageProps {
  searchParams: Promise<{
    status?: string
    country?: string
    q?: string
    sort?: string
    dir?: 'asc' | 'desc'
    page?: string
  }>
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { companies, total } = await getCompanies({
    status:  params.status,
    country: params.country,
    q:       params.q,
    sort:    params.sort ?? 'scraped_at',
    dir:     params.dir ?? 'desc',
    page:    params.page ? parseInt(params.page) : 1,
  })

  return (
    <div>
      <Topbar crumbs={[{ label: 'Companies' }]} />

      <div className="px-6 py-3 flex items-center gap-3 border-b border-border bg-bg-sidebar/50">
        <form className="flex items-center gap-3 w-full">
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Search companies…"
            className="h-8 px-3 bg-bg-card border border-border rounded text-sm text-text-primary
                       placeholder:text-text-muted focus:outline-none focus:border-accent-purple w-56"
          />
          <select
            name="status"
            defaultValue={params.status ?? ''}
            className="h-8 px-2 bg-bg-card border border-border rounded text-sm text-text-secondary
                       focus:outline-none focus:border-accent-purple"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            name="country"
            defaultValue={params.country ?? ''}
            className="h-8 px-2 bg-bg-card border border-border rounded text-sm text-text-secondary
                       focus:outline-none focus:border-accent-purple"
          >
            <option value="">All countries</option>
            <option value="IN">India</option>
            <option value="US">United States</option>
          </select>
          <button
            type="submit"
            className="h-8 px-3 bg-accent-purple text-white rounded text-sm font-medium
                       hover:bg-accent-purple/90 transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      <CompaniesTable
        companies={companies}
        total={total}
        currentFilters={{ status: params.status, country: params.country, q: params.q }}
      />
    </div>
  )
}
