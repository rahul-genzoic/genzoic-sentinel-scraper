import { Topbar } from '@/components/layout/topbar'
import { KanbanBoard } from '@/components/workflow/kanban-board'
import { getWorkflowCounts, getCompaniesByStatus } from '@/lib/queries/companies'

export default async function WorkflowPage() {
  const counts = await getWorkflowCounts()
  const initialStatus = 'new'
  const companies = await getCompaniesByStatus(initialStatus)

  return (
    <div className="flex flex-col h-screen">
      <Topbar crumbs={[{ label: 'Workflow' }]} />
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          initialCounts={counts}
          initialCompanies={companies}
          initialStatus={initialStatus}
        />
      </div>
    </div>
  )
}
