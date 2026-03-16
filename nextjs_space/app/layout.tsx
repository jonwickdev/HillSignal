import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://hillsignal.com'),
  title: 'HillSignal - Congressional Activity Intelligence',
  description: 'Real-time Congressional activity signals for informed investors. Know what lawmakers know, before the market does.',
  keywords: 'congress, congressional, trading, signals, politics, investing, market intelligence',
  authors: [{ name: 'HillSignal' }],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'HillSignal - Congressional Activity Intelligence',
    description: 'Real-time Congressional activity signals for informed investors.',
    type: 'website',
    locale: 'en_US',
    siteName: 'HillSignal',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HillSignal - Congressional Activity Intelligence',
    description: 'Real-time Congressional activity signals for informed investors.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js" />
      </head>
      <body className={`${inter.className} bg-hill-black text-hill-text antialiased`}>
        {children}
      </body>
    </html>
  )
}
