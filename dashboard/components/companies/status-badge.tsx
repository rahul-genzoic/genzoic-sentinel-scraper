import { Badge } from '@/components/ui/badge'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new:               { label: 'New',               className: 'bg-text-muted/20 text-text-secondary border-transparent' },
  analyzed:          { label: 'Analyzed',           className: 'bg-accent-blue/10 text-accent-blue border-accent-blue/30' },
  outreach_sent:     { label: 'Outreach Sent',      className: 'bg-accent-amber/10 text-accent-amber border-accent-amber/30' },
  in_discussion:     { label: 'In Discussion',      className: 'bg-accent-amber/20 text-accent-amber border-accent-amber/40' },
  working_with_them: { label: 'Working With Them',  className: 'bg-accent-green/10 text-accent-green border-accent-green/30' },
  report_shared:     { label: 'Report Shared',      className: 'bg-accent-green/20 text-accent-green border-accent-green/40' },
  completed:         { label: 'Completed',          className: 'bg-accent-green/30 text-accent-green border-accent-green/50' },
  ignored:           { label: 'Ignored',            className: 'bg-border text-text-muted border-transparent' },
  high_priority:     { label: 'High Priority',      className: 'bg-accent-purple/20 text-accent-purple border-accent-purple/40' },
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-border text-text-muted border-transparent' }
  return (
    <Badge variant="outline" className={cfg.className}>
      {cfg.label}
    </Badge>
  )
}

export const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({
  value,
  label,
}))
