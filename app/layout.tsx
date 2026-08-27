import { Analytics } from '@vercel/analytics/next'
import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' })
const plexSans = IBM_Plex_Sans({ subsets: ['latin'], variable: '--font-plex-sans', weight: ['400', '500', '600'] })
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-plex-mono', weight: ['400', '500'] })

export const metadata: Metadata = {
  title: 'SkillForge — AI Skill Gap & Career Portfolio Advisor',
  description: 'SkillForge cross-checks your resume against target technical benchmarks, validates claims with GitHub commit checks, and pinpoints exact portfolio builds to create missing proof.',
}

export const viewport: Viewport = { colorScheme: 'light', themeColor: '#F7F5F0', userScalable: true }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Clean up extension-injected attributes before React hydrates
                  var el = document.documentElement;
                  if (el) {
                    el.removeAttribute('data-kantu');
                    el.removeAttribute('data-lt-installed');
                    el.removeAttribute('cz-shortcut-listen');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
