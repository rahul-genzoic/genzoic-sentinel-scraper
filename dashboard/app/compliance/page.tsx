import { Topbar } from '@/components/layout/topbar'
import { prisma } from '@/lib/db'
import Link from 'next/link'

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

  const SEVERITY_COLOR: Record<string, string> = {
    critical: 'text-accent-red',
    warning:  'text-accent-amber',
    info:     'text-accent-blue',
  }

  return (
    <div>
      <Topbar crumbs={[{ label: 'Compliance Findings' }]} />

      <div className="px-6 py-3 border-b border-border flex items-center gap-3">
        <form className="flex items-center gap-3">
          <select
            name="severity"
            defaultValue={params.severity ?? ''}
            className="h-8 px-2 bg-bg-card border border-border rounded text-sm text-text-secondary
                       focus:outline-none focus:border-accent-purple"
          >
            <option value="">All severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
          <select
            name="engine"
            defaultValue={params.engine ?? ''}
            className="h-8 px-2 bg-bg-card border border-border rounded text-sm text-text-secondary
                       focus:outline-none focus:border-accent-purple"
          >
            <option value="">All engines</option>
            <option value="fssai">FSSAI</option>
            <option value="fda">FDA</option>
          </select>
          <button
            type="submit"
            className="h-8 px-3 bg-accent-purple text-white rounded text-sm font-medium
                       hover:bg-accent-purple/90 transition-colors"
          >
            Filter
          </button>
        </form>
        <span className="text-sm text-text-secondary ml-auto">{findings.length} findings</span>
      </div>

      <table className="sentinel-table">
        <thead>
          <tr><th>Company</th><th>Product</th><th>Severity</th><th>Finding</th><th>Engine</th><th>Date</th></tr>
        </thead>
        <tbody>
          {findings.map((f) => (
            <tr key={f.id}>
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
                <span className={`text-xs font-medium ${SEVERITY_COLOR[f.severity ?? ''] ?? 'text-text-secondary'}`}>
                  {f.severity ?? '—'}
                </span>
              </td>
              <td className="text-text-secondary max-w-md truncate">{f.finding}</td>
              <td className="text-text-muted text-xs uppercase">{f.engine ?? '—'}</td>
              <td className="text-text-muted text-xs">
                {new Date(f.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {findings.length === 0 && (
        <p className="text-center text-text-muted text-sm py-12">
          No compliance findings yet. The analysis engine writes to this table.
        </p>
      )}
    </div>
  )
}
