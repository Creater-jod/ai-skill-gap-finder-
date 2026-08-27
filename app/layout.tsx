import { Analytics } from '@vercel/analytics/next'
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' })
const plexSans = IBM_Plex_Sans({ subsets: ['latin'], variable: '--font-plex-sans', weight: ['400', '500', '600'] })
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-plex-mono', weight: ['400', '500'] })

export const metadata: Metadata = {
  title: 'Evidence Ledger — Career Evidence, Made Legible',
  description: 'An evidence-led skill gap and portfolio advisor for tech careers.',
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#F7F5F0', userScalable: true }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}
