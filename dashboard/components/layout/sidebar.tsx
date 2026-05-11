'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2, Package, Image, ShieldCheck,
  Kanban, Mail
} from 'lucide-react'

const NAV = [
  {
    group: 'DISCOVERY',
    items: [
      { href: '/companies', label: 'Companies', icon: Building2 },
      { href: '/products',  label: 'Products',  icon: Package },
      { href: '/images',    label: 'Images',    icon: Image },
    ],
  },
  {
    group: 'COMPLIANCE',
    items: [
      { href: '/compliance', label: 'Findings', icon: ShieldCheck },
    ],
  },
  {
    group: 'WORKFLOW',
    items: [
      { href: '/workflow',  label: 'Kanban',   icon: Kanban },
      { href: '/outreach',  label: 'Outreach', icon: Mail },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-52 bg-bg-sidebar border-r border-border flex flex-col z-40">
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-accent-purple flex-shrink-0" />
          <span className="text-sm font-semibold text-text-primary tracking-tight">
            Sentinel
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {NAV.map(({ group, items }) => (
          <div key={group} className="mb-5">
            <p className="text-[10px] font-semibold text-text-muted tracking-widest px-2 mb-1">
              {group}
            </p>
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded text-sm transition-colors mb-0.5 ${
                    active
                      ? 'bg-accent-purple/10 text-accent-purple font-medium'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
