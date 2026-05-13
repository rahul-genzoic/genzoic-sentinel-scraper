import { notFound } from 'next/navigation'
import { Topbar } from '@/components/layout/topbar'
import { CompanyHeader } from '@/components/companies/company-header'
import { NotesPanel } from '@/components/shared/notes-panel'
import { ActivityTimeline } from '@/components/shared/activity-timeline'
import { StatusBadge } from '@/components/companies/status-badge'
import { getCompany } from '@/lib/queries/companies'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function CompanyDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { tab = 'overview' } = await searchParams

  let company
  try {
    company = await getCompany(id)
  } catch {
    notFound()
  }

  const TABS = ['overview', 'products', 'compliance', 'timeline', 'outreach']

  return (
    <div>
      <Topbar
        crumbs={[
          { label: 'Companies', href: '/companies' },
          { label: company.name },
        ]}
      />

      <CompanyHeader
        id={company.id}
        name={company.name}
        brand={company.brand}
        status={company.status}
        website={company.website}
        country={company.country}
        emails={company.emails}
      />

      <div className="flex border-b border-border px-6">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/companies/${id}?tab=${t}`}
            className={`px-4 py-3 text-sm capitalize border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-accent-purple text-text-primary font-medium'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {t}
          </Link>
        ))}
      </div>

      <div className="p-6">
        {tab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              <div>
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Details</h3>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-text-muted">Website</dt>
                    <dd className="text-text-primary mt-0.5">
                      {company.website
                        ? <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">{company.website}</a>
                        : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Country</dt>
                    <dd className="text-text-primary mt-0.5">{company.country}</dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Status</dt>
                    <dd className="mt-0.5"><StatusBadge status={company.status} /></dd>
                  </div>
                  <div>
                    <dt className="text-text-muted">Products</dt>
                    <dd className="text-text-primary mt-0.5">{company._count.products}</dd>
                  </div>
                </dl>
              </div>
            </div>
            <div className="space-y-6">
              <NotesPanel companyId={company.id} initialNotes={company.notes} />
              {company.contacts.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Contacts</h3>
                  <ul className="space-y-3">
                    {company.contacts.map((c) => (
                      <li key={c.id} className="text-sm">
                        <div className="font-medium text-text-primary">{c.name}</div>
                        {c.title && <div className="text-text-muted text-xs">{c.title}</div>}
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="text-xs text-accent-purple hover:underline">
                            {c.email}
                          </a>
                        )}
                        {c.linkedinUrl && (
                          <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-accent-blue hover:underline">
                            LinkedIn
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'products' && (
          <div>
            <table className="sentinel-table">
              <thead>
                <tr><th>Product</th><th>Marketplace</th><th>Category</th><th>Scraped</th></tr>
              </thead>
              <tbody>
                {company.products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/products/${p.id}`} className="text-accent-purple hover:underline">
                        {p.name}
                      </Link>
                    </td>
                    <td className="text-text-secondary">{p.marketplace}</td>
                    <td className="text-text-secondary">{p.category ?? '—'}</td>
                    <td className="text-text-muted text-xs">
                      {p.scrapedAt ? new Date(p.scrapedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {company.products.length === 0 && (
              <p className="text-text-muted text-sm text-center py-12">No products yet.</p>
            )}
          </div>
        )}

        {tab === 'timeline' && (
          <ActivityTimeline entries={company.activityLog} />
        )}

        {tab === 'outreach' && (
          <div>
            <table className="sentinel-table">
              <thead>
                <tr><th>Channel</th><th>Recipient</th><th>Status</th><th>Sent</th></tr>
              </thead>
              <tbody>
                {company.outreach.map((o) => (
                  <tr key={o.id}>
                    <td className="text-text-secondary capitalize">{o.channel ?? '—'}</td>
                    <td className="text-text-secondary">{o.recipient ?? '—'}</td>
                    <td><StatusBadge status={o.status} /></td>
                    <td className="text-text-muted text-xs">
                      {o.sentAt ? new Date(o.sentAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {company.outreach.length === 0 && (
              <p className="text-text-muted text-sm text-center py-12">No outreach logged yet.</p>
            )}
          </div>
        )}

        {tab === 'compliance' && (() => {
          const findings = company.products.flatMap((p) =>
            p.findings.map((f) => ({ ...f, product: { id: p.id, name: p.name } }))
          ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

          if (findings.length === 0) {
            return <p className="text-text-muted text-sm">No compliance findings yet.</p>
          }

          return (
            <table className="sentinel-table">
              <thead>
                <tr><th>Product</th><th>Severity</th><th>Finding</th><th>Engine</th><th>Date</th></tr>
              </thead>
              <tbody>
                {findings.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <Link href={`/products/${f.product.id}`} className="text-accent-purple hover:underline">
                        {f.product.name}
                      </Link>
                    </td>
                    <td>
                      <span className={`text-xs font-medium ${
                        f.severity === 'critical' ? 'text-accent-red'
                        : f.severity === 'warning' ? 'text-accent-amber'
                        : 'text-accent-blue'
                      }`}>
                        {f.severity ?? '—'}
                      </span>
                    </td>
                    <td className="text-text-secondary max-w-md truncate">{f.finding}</td>
                    <td className="text-text-muted text-xs uppercase">{f.engine ?? '—'}</td>
                    <td className="text-text-muted text-xs">{new Date(f.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        })()}
      </div>
    </div>
  )
}
