'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/db'

export async function logOutreach(data: {
  companyId: string
  channel: string
  recipient: string
  subject: string
  body: string
}) {
  const record = await prisma.outreach.create({
    data: {
      companyId: data.companyId,
      channel:   data.channel,
      recipient: data.recipient,
      subject:   data.subject,
      body:      data.body,
      status:    'sent',
      sentAt:    new Date(),
    },
  })

  await prisma.activityLog.create({
    data: {
      companyId: data.companyId,
      eventType: 'outreach_sent',
      payload:   { channel: data.channel, recipient: data.recipient },
    },
  })

  revalidatePath('/outreach')
  revalidatePath(`/companies/${data.companyId}`)
  return record
}

export async function updateOutreachStatus(
  outreachId: string,
  status: 'sent' | 'opened' | 'replied' | 'no_response'
) {
  await prisma.outreach.update({
    where: { id: outreachId },
    data:  {
      status,
      ...(status === 'replied' ? { repliedAt: new Date() } : {}),
    },
  })
  revalidatePath('/outreach')
}
