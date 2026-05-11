interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
}

export function EmptyState({ title, description, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {icon && <div className="mb-4 text-text-muted">{icon}</div>}
      <p className="text-text-secondary font-medium">{title}</p>
      {description && (
        <p className="text-text-muted text-sm mt-1 max-w-sm">{description}</p>
      )}
    </div>
  )
}
