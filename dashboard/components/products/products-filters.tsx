'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { X } from 'lucide-react'

const MARKETPLACES = ['Amazon US', 'Amazon IN', 'Flipkart', 'iHerb']

export function ProductsFilters() {
  const router = useRouter()
  const params = useSearchParams()

  function push(key: string, value: string) {
    const p = new URLSearchParams(params.toString())
    if (value) p.set(key, value)
    else p.delete(key)
    p.delete('page')
    router.push(`/products?${p.toString()}`)
  }

  const hasFilters = params.has('marketplace') || params.has('category')

  return (
    <div className="px-6 py-3 flex items-center gap-3 border-b border-border bg-bg-sidebar/50">
      <Select
        value={params.get('marketplace') ?? ''}
        onValueChange={(v) => push('marketplace', v ?? '')}
      >
        <SelectTrigger className="w-44 bg-bg-card border-border text-text-secondary focus:ring-accent-purple/20">
          <SelectValue placeholder="All marketplaces" />
        </SelectTrigger>
        <SelectContent className="bg-bg-card border-border">
          <SelectItem value="">All marketplaces</SelectItem>
          {MARKETPLACES.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/products')}
          className="gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  )
}
