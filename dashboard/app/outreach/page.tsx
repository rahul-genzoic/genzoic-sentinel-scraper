import { Topbar } from '@/components/layout/topbar'
import { StatusBadge } from '@/components/companies/status-badge'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function OutreachPage() {
  const outreach = await prisma.outreach.findMany({
    orderBy: { createdAt: 'desc' },
    take:    200,
    include: { company: { select: { id: true, name: true } } },
  })

  return (
    <div>
      <Topbar crumbs={[{ label: 'Outreach' }]} />

      <div className="px-6 py-3 border-b border-border text-sm text-text-secondary">
        {outreach.length} outreach records
      </div>

      <table className="sentinel-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Channel</th>
            <th>Recipient</th>
            <th>Subject</th>
            <th>Status</th>
            <th>Sent</th>
            <th>Replied</th>
          </tr>
        </thead>
        <tbody>
          {outreach.map((o) => (
            <tr key={o.id}>
              <td>
                <Link href={`/companies/${o.company.id}`} className="text-accent-purple hover:underline">
                  {o.company.name}
                </Link>
              </td>
              <td className="text-text-secondary capitalize">{o.channel ?? '—'}</td>
              <td className="text-text-secondary text-xs">{o.recipient ?? '—'}</td>
              <td className="text-text-secondary">{o.subject ?? '—'}</td>
              <td><StatusBadge status={o.status} /></td>
              <td className="text-text-muted text-xs">
                {o.sentAt ? new Date(o.sentAt).toLocaleDateString() : '—'}
              </td>
              <td className="text-text-muted text-xs">
                {o.repliedAt ? new Date(o.repliedAt).toLocaleDateString() : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {outreach.length === 0 && (
        <p className="text-center text-text-muted text-sm py-12">
          No outreach logged yet. Use the company detail page to log outreach.
        </p>
      )}
    </div>
  )
}
