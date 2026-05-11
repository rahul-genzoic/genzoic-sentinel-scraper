'use client'

import { STATUS_OPTIONS } from '@/components/companies/status-badge'

interface KanbanStatusListProps {
  counts: Record<string, number>
  selected: string
  onSelect: (status: string) => void
}

const STATUS_COLORS: Record<string, string> = {
  new:               'bg-text-muted',
  analyzed:          'bg-accent-blue',
  outreach_sent:     'bg-accent-amber',
  in_discussion:     'bg-accent-amber',
  working_with_them: 'bg-accent-green',
  report_shared:     'bg-accent-green',
  completed:         'bg-accent-green',
  ignored:           'bg-border',
  high_priority:     'bg-accent-purple',
}

export function KanbanStatusList({ counts, selected, onSelect }: KanbanStatusListProps) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="w-52 flex-shrink-0 border-r border-border">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-xs text-text-muted">{total} total companies</p>
      </div>
      <ul className="py-2">
        {STATUS_OPTIONS.map(({ value, label }) => {
          const count = counts[value] ?? 0
          const active = selected === value
          return (
            <li key={value}>
              <button
                onClick={() => onSelect(value)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-left ${
                  active
                    ? 'bg-accent-purple/10 text-text-primary'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                }`}
              >
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLORS[value] ?? 'bg-border'}`} />
                <span className="flex-1">{label}</span>
                <span className="text-text-muted text-xs">{count}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
