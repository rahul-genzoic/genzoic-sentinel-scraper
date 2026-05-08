import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { classifyImage } from './image-classifier.js'
import type { ImageMeta, LabelType } from '../types.js'

interface DownloadOptions {
  outputDir: string
  imageUrls: string[]
}

interface DownloadResult {
  images: ImageMeta[]
  skipped: number
}

function sha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

async function loadHashes(outputDir: string): Promise<Set<string>> {
  const hashFile = path.join(outputDir, 'hashes.json')
  try {
    const raw = await fs.readFile(hashFile, 'utf-8')
    return new Set(JSON.parse(raw) as string[])
  } catch {
    return new Set()
  }
}

async function saveHashes(outputDir: string, hashes: Set<string>): Promise<void> {
  await fs.writeFile(
    path.join(outputDir, 'hashes.json'),
    JSON.stringify(Array.from(hashes)),
    'utf-8'
  )
}

function labelTypeToFilename(labelType: LabelType, index: number): string {
  const map: Record<LabelType, string> = {
    front_label:       'front.jpg',
    back_label:        'back.jpg',
    nutrition_panel:   'nutrition.jpg',
    ingredients_panel: 'ingredients.jpg',
    claims_panel:      'claims.jpg',
    unknown:           `unknown_${index}.jpg`,
  }
  return map[labelType]
}

export async function downloadImages(options: DownloadOptions): Promise<DownloadResult> {
  const { outputDir, imageUrls } = options
  await fs.mkdir(outputDir, { recursive: true })

  const existingHashes = await loadHashes(outputDir)
  const images: ImageMeta[] = []
  let skipped = 0

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i]
    try {
      const response = await fetch(url)
      if (!response.ok) continue

      const buffer = Buffer.from(await response.arrayBuffer())
      const hash = sha256(buffer)

      if (existingHashes.has(hash)) {
        skipped++
        continue
      }

      const labelType = classifyImage(url, '', i)
      const filename = labelTypeToFilename(labelType, i)

      await fs.writeFile(path.join(outputDir, filename), buffer)
      existingHashes.add(hash)
      images.push({ filename, labelType, sha256: hash })
    } catch {
      // individual image failures are non-fatal
    }
  }

  await saveHashes(outputDir, existingHashes)
  return { images, skipped }
}
