'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  Building2, Package, ShieldCheck,
  Kanban, Mail, ChevronLeft, ChevronRight,
} from 'lucide-react'

const NAV = [
  {
    group: 'DISCOVERY',
    items: [
      { href: '/companies', label: 'Companies', icon: Building2 },
      { href: '/products',  label: 'Products',  icon: Package },
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
  const [open, setOpen] = useState(true)

  return (
    <>
      <aside
        className={`fixed left-0 top-0 h-screen bg-bg-sidebar border-r border-border flex flex-col z-40 transition-all duration-200 ${
          open ? 'w-52' : 'w-12'
        }`}
      >
        <div className="px-3 py-5 border-b border-border flex items-center justify-between min-h-[57px]">
          {open && (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-accent-purple flex-shrink-0" />
              <span className="text-sm font-semibold text-text-primary tracking-tight">
                Sentinel
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="ml-auto text-text-muted hover:text-text-primary transition-colors"
            aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {open ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-1.5">
          {NAV.map(({ group, items }) => (
            <div key={group} className="mb-5">
              {open && (
                <p className="text-[10px] font-semibold text-text-muted tracking-widest px-2 mb-1">
                  {group}
                </p>
              )}
              {items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    title={!open ? label : undefined}
                    className={`flex items-center gap-2.5 px-2 py-1.5 rounded text-sm transition-colors mb-0.5 ${
                      active
                        ? 'bg-accent-purple/10 text-accent-purple font-medium'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {open && label}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* Offset main content */}
      <style>{`main { margin-left: ${open ? '13rem' : '3rem'}; transition: margin-left 0.2s; }`}</style>
    </>
  )
}
