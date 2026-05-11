const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new:               { label: 'New',               color: 'bg-text-muted/20 text-text-secondary' },
  analyzed:          { label: 'Analyzed',           color: 'bg-accent-blue/10 text-accent-blue' },
  outreach_sent:     { label: 'Outreach Sent',      color: 'bg-accent-amber/10 text-accent-amber' },
  in_discussion:     { label: 'In Discussion',      color: 'bg-accent-amber/20 text-accent-amber' },
  working_with_them: { label: 'Working With Them',  color: 'bg-accent-green/10 text-accent-green' },
  report_shared:     { label: 'Report Shared',      color: 'bg-accent-green/20 text-accent-green' },
  completed:         { label: 'Completed',          color: 'bg-accent-green/30 text-accent-green' },
  ignored:           { label: 'Ignored',            color: 'bg-border text-text-muted' },
  high_priority:     { label: 'High Priority',      color: 'bg-accent-purple/20 text-accent-purple' },
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-border text-text-muted' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.color}`}>
      {cfg.label}
    </span>
  )
}

export const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({
  value,
  label,
}))
