import { Topbar } from '@/components/layout/topbar'
import { CompaniesTable } from '@/components/companies/companies-table'
import { getCompanies } from '@/lib/queries/companies'
import { CompaniesFilters } from '@/components/companies/companies-filters'

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
    sort:    params.sort ?? 'scrapedAt',
    dir:     params.dir ?? 'desc',
    page:    params.page ? parseInt(params.page) : 1,
  })

  return (
    <div>
      <Topbar crumbs={[{ label: 'Companies' }]} />

      <CompaniesFilters />

      <CompaniesTable
        companies={companies}
        total={total}
        currentPage={params.page ? parseInt(params.page) : 1}
        currentFilters={{ status: params.status, country: params.country, q: params.q }}
      />
    </div>
  )
}
