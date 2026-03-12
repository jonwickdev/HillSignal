'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = createClient()
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      if (data.user) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-hill-white mb-2">Welcome Back</h1>
        <p className="text-hill-muted">Sign in to access your signals</p>
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
            className="w-full bg-hill-gray border border-hill-border rounded-lg px-4 py-3 text-hill-white placeholder-hill-muted focus:outline-none focus:border-hill-orange transition-colors"
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-hill-muted text-sm">
          Don't have an account?{' '}
          <Link href="/signup" className="text-hill-orange hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </Card>
  )
}
