import type { Prisma } from '@prisma/client'

type ActivityLogEntry = Prisma.ActivityLogGetPayload<Record<string, never>>

interface ActivityTimelineProps {
  entries: ActivityLogEntry[]
}

function formatEvent(entry: ActivityLogEntry): string {
  const payload = entry.payload as Record<string, string> | null
  switch (entry.eventType) {
    case 'status_change':
      return `Status changed from "${payload?.from ?? '?'}" to "${payload?.to ?? '?'}"`
    case 'note_updated':
      return 'Notes updated'
    case 'outreach_sent':
      return `Outreach sent via ${payload?.channel ?? 'unknown'} to ${payload?.recipient ?? ''}`
    default:
      return entry.eventType
  }
}

export function ActivityTimeline({ entries }: ActivityTimelineProps) {
  if (entries.length === 0) {
    return <p className="text-text-muted text-sm">No activity yet.</p>
  }

  return (
    <ol className="relative border-l border-border ml-2 space-y-4">
      {entries.map((entry) => (
        <li key={entry.id} className="ml-4">
          <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-bg-card border border-border" />
          <p className="text-sm text-text-primary">{formatEvent(entry)}</p>
          <time className="text-xs text-text-muted">
            {new Date(entry.createdAt).toLocaleString()}
          </time>
        </li>
      ))}
    </ol>
  )
}
