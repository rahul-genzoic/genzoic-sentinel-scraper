'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { updateCompanyStatus } from '@/lib/actions/companies'
import { STATUS_OPTIONS } from '@/components/companies/status-badge'
import type { getCompaniesByStatus } from '@/lib/queries/companies'

type Company = Awaited<ReturnType<typeof getCompaniesByStatus>>[number]

interface KanbanCardsProps {
  companies: Company[]
  currentStatus: string
  onStatusChanged?: (companyId: string, newStatus: string) => void
}

export function KanbanCards({ companies, currentStatus, onStatusChanged }: KanbanCardsProps) {
  const [pending, startTransition] = useTransition()

  if (companies.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
        No companies with this status.
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2">
      {companies.map((company) => (
        <div
          key={company.id}
          className="bg-bg-card border border-border rounded-lg p-4 hover:border-accent-purple/50 transition-colors"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/companies/${company.id}`}
                className="text-sm font-medium text-text-primary hover:text-accent-purple transition-colors block truncate"
              >
                {company.name}
              </Link>
              {company.brand && company.brand !== company.name && (
                <p className="text-xs text-text-muted truncate">{company.brand}</p>
              )}
              <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                <span>{company.country}</span>
                <span>·</span>
                <span>{company._count.products} products</span>
                <span>·</span>
                <span>{company.emails.length} emails</span>
              </div>
            </div>

            <select
              disabled={pending}
              defaultValue={currentStatus}
              onChange={(e) => {
                const newStatus = e.target.value
                startTransition(async () => {
                  await updateCompanyStatus(company.id, newStatus, currentStatus)
                  onStatusChanged?.(company.id, newStatus)
                })
              }}
              className="text-xs bg-bg-sidebar border border-border rounded px-1.5 py-1
                         text-text-secondary focus:outline-none focus:border-accent-purple
                         disabled:opacity-50 flex-shrink-0"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  )
}
