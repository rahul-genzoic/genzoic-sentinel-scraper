'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'

export async function updateCompanyStatus(
  companyId: string,
  status: string,
  previousStatus: string
) {
  await prisma.$transaction([
    prisma.company.update({
      where: { id: companyId },
      data:  { status, updatedAt: new Date() },
    }),
    prisma.activityLog.create({
      data: {
        companyId,
        eventType: 'status_change',
        payload:   { from: previousStatus, to: status },
      },
    }),
  ])

  revalidatePath('/companies')
  revalidatePath(`/companies/${companyId}`)
  revalidatePath('/workflow')
}

export async function updateCompanyNotes(companyId: string, notes: string) {
  await prisma.$transaction([
    prisma.company.update({
      where: { id: companyId },
      data:  { notes },
    }),
    prisma.activityLog.create({
      data: {
        companyId,
        eventType: 'note_updated',
        payload:   { preview: notes.slice(0, 100) },
      },
    }),
  ])

  revalidatePath(`/companies/${companyId}`)
}
