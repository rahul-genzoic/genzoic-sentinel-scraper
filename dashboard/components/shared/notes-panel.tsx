'use client'

import { useState, useTransition } from 'react'
import { updateCompanyNotes } from '@/lib/actions/companies'

interface NotesPanelProps {
  companyId: string
  initialNotes: string | null
}

export function NotesPanel({ companyId, initialNotes }: NotesPanelProps) {
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSave() {
    startTransition(async () => {
      await updateCompanyNotes(companyId, notes)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div>
      <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Notes</h3>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={6}
        placeholder="Add notes about this company…"
        className="w-full bg-bg-card border border-border rounded px-3 py-2 text-sm
                   text-text-primary placeholder:text-text-muted resize-none
                   focus:outline-none focus:border-accent-purple"
      />
      <div className="flex items-center justify-end gap-2 mt-1.5">
        {saved && <span className="text-xs text-accent-green">Saved</span>}
        <button
          onClick={handleSave}
          disabled={pending}
          className="h-7 px-3 bg-accent-purple text-white rounded text-xs font-medium
                     hover:bg-accent-purple/90 transition-colors disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
