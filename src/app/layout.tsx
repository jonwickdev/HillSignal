import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://hillsignal.com'),
  title: {
    default: 'HillSignal — Congressional Activity Intelligence for Investors',
    template: '%s — HillSignal',
  },
  description: 'Track Congressional bills, votes, and hearings that move markets. AI-powered analysis gives retail investors an edge — know what lawmakers know, before the market does.',
  keywords: 'congress, congressional activity, trading signals, political investing, market intelligence, bill tracking, retail investors, stock market, legislation',
  authors: [{ name: 'HillSignal' }],
  openGraph: {
    title: 'HillSignal — Congressional Activity Intelligence for Investors',
    description: 'Track Congressional bills, votes, and hearings that move markets. AI-powered signal intelligence for retail investors.',
    type: 'website',
    locale: 'en_US',
    siteName: 'HillSignal',
    url: 'https://hillsignal.com',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HillSignal — Congressional Activity Tracking for Retail Investors',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HillSignal — Congressional Activity Intelligence',
    description: 'Track Congressional bills, votes, and hearings that move markets. AI-powered signal intelligence for retail investors.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
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
