'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { STATUS_OPTIONS } from './status-badge'

export function CompaniesFilters() {
  const router = useRouter()
  const params = useSearchParams()

  function push(key: string, value: string) {
    const p = new URLSearchParams(params.toString())
    if (value) p.set(key, value)
    else p.delete(key)
    p.delete('page')
    router.push(`/companies?${p.toString()}`)
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = (e.currentTarget.elements.namedItem('q') as HTMLInputElement).value
    push('q', q)
  }

  return (
    <div className="px-6 py-3 flex items-center gap-3 border-b border-border bg-bg-sidebar/50">
      <form className="flex items-center gap-3 w-full" onSubmit={handleSubmit}>
        <Input
          name="q"
          defaultValue={params.get('q') ?? ''}
          placeholder="Search companies…"
          className="w-56 bg-bg-card border-border text-text-primary placeholder:text-text-muted
                     focus-visible:border-accent-purple focus-visible:ring-accent-purple/20"
        />

        <Select
          value={params.get('status') ?? ''}
          onValueChange={(v) => push('status', v ?? '')}
        >
          <SelectTrigger className="w-40 bg-bg-card border-border text-text-secondary focus:ring-accent-purple/20">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="bg-bg-card border-border">
            <SelectItem value="">All statuses</SelectItem>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={params.get('country') ?? ''}
          onValueChange={(v) => push('country', v ?? '')}
        >
          <SelectTrigger className="w-36 bg-bg-card border-border text-text-secondary focus:ring-accent-purple/20">
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent className="bg-bg-card border-border">
            <SelectItem value="">All countries</SelectItem>
            <SelectItem value="IN">India</SelectItem>
            <SelectItem value="US">United States</SelectItem>
          </SelectContent>
        </Select>

        <Button
          type="submit"
          className="bg-accent-purple text-white hover:bg-accent-purple/90 border-transparent"
        >
          Search
        </Button>
      </form>
    </div>
  )
}
