'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        return
      }

      // Check if user needs to confirm email
      if (data.user && !data.session) {
        setSuccess(true)
      } else if (data.session) {
        // User is signed in, redirect to checkout
        router.push('/checkout')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Card>
        <div className="text-center">
          <div className="w-16 h-16 bg-hill-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-hill-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-hill-white mb-2">Check Your Email</h2>
          <p className="text-hill-muted mb-6">
            We've sent a confirmation link to <span className="text-hill-white">{email}</span>.
            Click the link to verify your account and complete your purchase.
          </p>
          <Link href="/login">
            <Button variant="secondary" className="w-full">
              Back to Login
            </Button>
          </Link>
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-hill-white mb-2">Become a Founding Member</h1>
        <p className="text-hill-muted">Create your account to get started</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-hill-red/10 border border-hill-red/30 rounded-lg p-4">
            <p className="text-hill-red text-sm">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-hill-text mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-hill-gray border border-hill-border rounded-lg px-4 py-3 text-hill-white placeholder-hill-muted focus:outline-none focus:border-hill-orange transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-hill-text mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-hill-gray border border-hill-border rounded-lg px-4 py-3 text-hill-white placeholder-hill-muted focus:outline-none focus:border-hill-orange transition-colors"
            placeholder="Min 6 characters"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-hill-text mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full bg-hill-gray border border-hill-border rounded-lg px-4 py-3 text-hill-white placeholder-hill-muted focus:outline-none focus:border-hill-orange transition-colors"
            placeholder="Confirm your password"
          />
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Create Account & Continue to Payment
        </Button>

        <p className="text-hill-muted text-xs text-center">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-hill-orange hover:underline">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-hill-orange hover:underline">Privacy Policy</Link>.
        </p>
      </form>

      <div className="mt-6 text-center">
        <p className="text-hill-muted text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-hill-orange hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </Card>
  )
}
