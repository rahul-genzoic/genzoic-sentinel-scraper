'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export function ComplianceFilters({ total }: { total: number }) {
  const router = useRouter()
  const params = useSearchParams()

  function push(key: string, value: string) {
    const p = new URLSearchParams(params.toString())
    if (value) p.set(key, value)
    else p.delete(key)
    router.push(`/compliance?${p.toString()}`)
  }

  return (
    <div className="px-6 py-3 border-b border-border flex items-center gap-3">
      <div className="flex items-center gap-3">
        <Select
          value={params.get('severity') ?? ''}
          onValueChange={(v) => push('severity', v ?? '')}
        >
          <SelectTrigger className="w-40 bg-bg-card border-border text-text-secondary focus:ring-accent-purple/20">
            <SelectValue placeholder="All severities" />
          </SelectTrigger>
          <SelectContent className="bg-bg-card border-border">
            <SelectItem value="">All severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={params.get('engine') ?? ''}
          onValueChange={(v) => push('engine', v ?? '')}
        >
          <SelectTrigger className="w-36 bg-bg-card border-border text-text-secondary focus:ring-accent-purple/20">
            <SelectValue placeholder="All engines" />
          </SelectTrigger>
          <SelectContent className="bg-bg-card border-border">
            <SelectItem value="">All engines</SelectItem>
            <SelectItem value="fssai">FSSAI</SelectItem>
            <SelectItem value="fda">FDA</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <span className="text-sm text-text-secondary ml-auto">{total} findings</span>
    </div>
  )
}
