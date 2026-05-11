import type { Metadata } from 'next'
import { Sidebar } from '@/components/layout/sidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Genzoic Sentinel',
  description: 'FDA & FSSAI compliance intelligence',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-bg-app text-text-primary">
        <Sidebar />
        <main className="ml-52 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
