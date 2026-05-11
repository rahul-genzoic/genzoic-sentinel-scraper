import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const DATA_ROOT = path.resolve(process.env.DATA_ROOT ?? path.join(process.cwd(), '../scraper/data'))

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  const filePath = path.resolve(path.join(DATA_ROOT, ...segments))

  if (!filePath.startsWith(DATA_ROOT)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const file = await fs.readFile(filePath)
    const ext = path.extname(filePath).slice(1).toLowerCase()
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'

    return new NextResponse(file, {
      headers: {
        'Content-Type': mime,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return new NextResponse('Not Found', { status: 404 })
  }
}
