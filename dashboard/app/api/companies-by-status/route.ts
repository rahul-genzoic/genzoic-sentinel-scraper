import { NextRequest, NextResponse } from 'next/server'
import { getCompaniesByStatus } from '@/lib/queries/companies'

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get('status')
  if (!status) return NextResponse.json({ error: 'Missing status' }, { status: 400 })

  const companies = await getCompaniesByStatus(status)
  return NextResponse.json(companies)
}
