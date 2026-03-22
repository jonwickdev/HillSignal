'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
    })
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-hill-black/80 backdrop-blur-md border-b border-hill-border">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href={isLoggedIn ? '/dashboard' : '/'} className="text-2xl font-bold text-hill-white">
          Hill<span className="text-hill-orange">Signal</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="/about" className="text-hill-muted hover:text-hill-white transition-colors">
            About
          </Link>
          <Link href="/blog" className="text-hill-muted hover:text-hill-white transition-colors">
            Blog
          </Link>
          <Link href="/glossary" className="text-hill-muted hover:text-hill-white transition-colors">
            Glossary
          </Link>
          {isLoggedIn ? (
            <Link href="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <a href="#signals" className="text-hill-muted hover:text-hill-white transition-colors">
                Signals
              </a>
              <a href="#pricing" className="text-hill-muted hover:text-hill-white transition-colors">
                Pricing
              </a>
              <Link href="/login" className="text-hill-muted hover:text-hill-white transition-colors">
                Login
              </Link>
              <Link href="/signup">
                <Button size="sm">Get Access</Button>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-hill-white p-2"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <nav className="md:hidden bg-hill-dark border-t border-hill-border">
          <div className="px-4 py-4 space-y-4">
            <Link
              href="/about"
              className="block text-hill-muted hover:text-hill-white transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/blog"
              className="block text-hill-muted hover:text-hill-white transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </Link>
            <Link
              href="/glossary"
              className="block text-hill-muted hover:text-hill-white transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Glossary
            </Link>
            {isLoggedIn ? (
              <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full">Dashboard</Button>
              </Link>
            ) : (
              <>
                <a
                  href="#signals"
                  className="block text-hill-muted hover:text-hill-white transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Signals
                </a>
                <a
                  href="#pricing"
                  className="block text-hill-muted hover:text-hill-white transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Pricing
                </a>
                <Link
                  href="/login"
                  className="block text-hill-muted hover:text-hill-white transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full">Get Access</Button>
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
