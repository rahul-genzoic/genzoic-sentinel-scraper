'use client'

import { useTransition } from 'react'
import { StatusBadge, STATUS_OPTIONS } from './status-badge'
import { updateCompanyStatus } from '@/lib/actions/companies'
import { ExternalLink } from 'lucide-react'

interface CompanyHeaderProps {
  id: string
  name: string
  brand: string | null
  status: string
  website: string | null
  country: string
  emails: string[]
}

export function CompanyHeader({ id, name, brand, status, website, country, emails }: CompanyHeaderProps) {
  const [pending, startTransition] = useTransition()

  return (
    <div className="px-6 py-5 border-b border-border">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{name}</h1>
          {brand && brand !== name && (
            <p className="text-text-secondary text-sm mt-0.5">{brand}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={status} />
            <span className="text-xs font-mono bg-bg-card px-1.5 py-0.5 rounded text-text-muted">
              {country}
            </span>
            {website && (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-accent-blue hover:underline"
              >
                {website.replace(/^https?:\/\//, '')}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          {emails.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {emails.map((email) => (
                <a
                  key={email}
                  href={`mailto:${email}`}
                  className="text-xs text-text-secondary hover:text-accent-purple transition-colors"
                >
                  {email}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            disabled={pending}
            defaultValue={status}
            onChange={(e) =>
              startTransition(() =>
                updateCompanyStatus(id, e.target.value, status)
              )
            }
            className="h-8 px-2 bg-bg-card border border-border rounded text-sm text-text-secondary
                       focus:outline-none focus:border-accent-purple disabled:opacity-50"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
