import type { NextConfig } from 'next'
import path from 'path'

const config: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '2mb' },
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
}

export default config
