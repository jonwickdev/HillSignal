import Link from 'next/link'

/**
 * Auth pages layout - shared between login and signup
 * Clean, minimal design focused on the form
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-hill-black flex flex-col">
      {/* Simple header */}
      <header className="py-6 px-4">
        <div className="max-w-md mx-auto">
          <Link href="/" className="text-2xl font-bold text-hill-white">
            Hill<span className="text-hill-orange">Signal</span>
          </Link>
        </div>
      </header>
      
      {/* Auth form container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
      
      {/* Simple footer */}
      <footer className="py-6 px-4 text-center">
        <p className="text-hill-muted text-sm">
          © {new Date().getFullYear()} HillSignal. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
