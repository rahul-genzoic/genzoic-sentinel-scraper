import { Topbar } from '@/components/layout/topbar'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { ComplianceFilters } from '@/components/compliance/compliance-filters'

interface PageProps {
  searchParams: Promise<{ severity?: string; engine?: string }>
}

export default async function CompliancePage({ searchParams }: PageProps) {
  const params = await searchParams

  const findings = await prisma.complianceFinding.findMany({
    where: {
      ...(params.severity ? { severity: params.severity } : {}),
      ...(params.engine   ? { engine:   params.engine   } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take:    500,
    include: {
      product: {
        select: {
          id:      true,
          name:    true,
          company: { select: { id: true, name: true } },
        },
      },
    },
  })

  const SEVERITY_VARIANT: Record<string, { variant: 'destructive' | 'outline' | 'secondary'; className: string }> = {
    critical: { variant: 'destructive', className: '' },
    warning:  { variant: 'outline',     className: 'border-accent-amber/40 text-accent-amber bg-accent-amber/10' },
    info:     { variant: 'outline',     className: 'border-accent-blue/40 text-accent-blue bg-accent-blue/10' },
  }

  return (
    <div>
      <Topbar crumbs={[{ label: 'Compliance Findings' }]} />

      <ComplianceFilters total={findings.length} />

      <div className="sentinel-table-scroll">
        <table className="sentinel-table">
          <thead>
            <tr>
              <th className="w-10 text-center">#</th>
              <th>Company</th>
              <th>Product</th>
              <th>Severity</th>
              <th>Finding</th>
              <th>Engine</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {findings.map((f, i) => {
              const sev = SEVERITY_VARIANT[f.severity ?? '']
              return (
                <tr key={f.id}>
                  <td className="text-center text-text-muted text-xs">{i + 1}</td>
                  <td>
                    <Link href={`/companies/${f.product.company.id}`} className="text-accent-purple hover:underline">
                      {f.product.company.name}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/products/${f.product.id}`} className="text-text-secondary hover:text-text-primary">
                      {f.product.name}
                    </Link>
                  </td>
                  <td>
                    {sev ? (
                      <Badge variant={sev.variant} className={sev.className}>
                        {f.severity}
                      </Badge>
                    ) : (
                      <span className="text-text-muted text-xs">—</span>
                    )}
                  </td>
                  <td className="text-text-secondary max-w-md truncate">{f.finding}</td>
                  <td className="text-text-muted text-xs uppercase">{f.engine ?? '—'}</td>
                  <td className="text-text-muted text-xs">
                    {new Date(f.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {findings.length === 0 && (
        <p className="text-center text-text-muted text-sm py-12">
          No compliance findings yet. The analysis engine writes to this table.
        </p>
      )}
    </div>
  )
}
