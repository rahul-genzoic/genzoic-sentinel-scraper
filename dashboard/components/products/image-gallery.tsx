'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { ProductImage } from '@prisma/client'

const LABEL_TABS = [
  { value: 'all',               label: 'All' },
  { value: 'front_label',       label: 'Front' },
  { value: 'back_label',        label: 'Back' },
  { value: 'nutrition_panel',   label: 'Nutrition' },
  { value: 'ingredients_panel', label: 'Ingredients' },
  { value: 'claims_panel',      label: 'Claims' },
  { value: 'unknown',           label: 'Unknown' },
]

interface ImageGalleryProps {
  images: ProductImage[]
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [activeTab, setActiveTab] = useState('all')
  const [lightbox, setLightbox] = useState<string | null>(null)

  const filtered = activeTab === 'all'
    ? images
    : images.filter((img) => img.labelType === activeTab)

  function imageUrl(diskPath: string): string {
    const n = diskPath.replace(/\\/g, '/')
    const idx = n.lastIndexOf('/data/')
    const rel = idx >= 0 ? n.slice(idx + 6) : n.replace(/^data\//, '')
    return `/data/${rel}`
  }

  return (
    <div>
      <div className="flex gap-1 mb-4 flex-wrap">
        {LABEL_TABS.map((tab) => {
          const count = tab.value === 'all'
            ? images.length
            : images.filter((img) => img.labelType === tab.value).length
          if (count === 0 && tab.value !== 'all') return null
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === tab.value
                  ? 'bg-accent-purple text-white'
                  : 'bg-bg-card text-text-secondary hover:text-text-primary'
              }`}
            >
              {tab.label} <span className="opacity-60">({count})</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {filtered.map((img) => (
          <button
            key={img.id}
            onClick={() => setLightbox(imageUrl(img.diskPath))}
            className="aspect-square bg-bg-card rounded overflow-hidden border border-border
                       hover:border-accent-purple transition-colors group relative"
          >
            <Image
              src={imageUrl(img.diskPath)}
              alt={img.labelType ?? 'product image'}
              fill
              className="object-contain p-2"
              unoptimized
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1
                            opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-xs text-white truncate">{img.labelType ?? 'unknown'}</p>
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-text-muted text-sm text-center py-10">No images in this category.</p>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-3xl max-h-full w-full h-full">
            <Image
              src={lightbox}
              alt="full size"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  )
}
