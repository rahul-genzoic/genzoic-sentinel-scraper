import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface Crumb {
  label: string
  href?: string
}

interface TopbarProps {
  crumbs: Crumb[]
  actions?: React.ReactNode
}

export function Topbar({ crumbs, actions }: TopbarProps) {
  return (
    <div className="h-12 border-b border-border bg-bg-app flex items-center px-6 gap-4 sticky top-0 z-30">
      <nav className="flex items-center gap-1 text-sm flex-1 min-w-0">
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1 min-w-0">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-text-secondary hover:text-text-primary truncate transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-text-primary font-medium truncate">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}
