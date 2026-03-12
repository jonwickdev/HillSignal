import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HillSignal - Congressional Activity Intelligence',
  description: 'Real-time Congressional activity signals for informed investors. Know what lawmakers know, before the market does.',
  keywords: 'congress, congressional, trading, signals, politics, investing, market intelligence',
  authors: [{ name: 'HillSignal' }],
  openGraph: {
    title: 'HillSignal - Congressional Activity Intelligence',
    description: 'Real-time Congressional activity signals for informed investors.',
    type: 'website',
    locale: 'en_US',
    siteName: 'HillSignal',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HillSignal - Congressional Activity Intelligence',
    description: 'Real-time Congressional activity signals for informed investors.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-hill-black text-hill-text antialiased`}>
        {children}
      </body>
    </html>
  )
}
