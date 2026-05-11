'use client'

import { useState } from 'react'
import { KanbanStatusList } from './kanban-status-list'
import { KanbanCards } from './kanban-cards'
import type { getCompaniesByStatus } from '@/lib/queries/companies'

type Company = Awaited<ReturnType<typeof getCompaniesByStatus>>[number]

interface KanbanBoardProps {
  initialCounts: Record<string, number>
  initialCompanies: Company[]
  initialStatus: string
}

export function KanbanBoard({ initialCounts, initialCompanies, initialStatus }: KanbanBoardProps) {
  const [selected, setSelected] = useState(initialStatus)
  const [companies, setCompanies] = useState(initialCompanies)
  const [counts, setCounts] = useState(initialCounts)

  function handleStatusChange(companyId: string, newStatus: string) {
    setCompanies((prev) => prev.filter((c) => c.id !== companyId))
    setCounts((prev) => ({
      ...prev,
      [selected]:  Math.max(0, (prev[selected] ?? 0) - 1),
      [newStatus]: (prev[newStatus] ?? 0) + 1,
    }))
  }

  async function handleSelectStatus(status: string) {
    setSelected(status)
    const res = await fetch(`/api/companies-by-status?status=${status}`)
    if (res.ok) {
      const data = await res.json()
      setCompanies(data)
    }
  }

  return (
    <div className="flex h-full">
      <KanbanStatusList counts={counts} selected={selected} onSelect={handleSelectStatus} />
      <KanbanCards
        companies={companies}
        currentStatus={selected}
        onStatusChanged={handleStatusChange}
      />
    </div>
  )
}
