import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-hill-black flex flex-col">
      <header className="py-6 px-4">
        <div className="max-w-md mx-auto">
          <Link href="/" className="text-2xl font-bold text-hill-white">
            Hill<span className="text-hill-orange">Signal</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>
      <footer className="py-6 px-4 text-center">
        <p className="text-hill-muted text-sm">
          © 2026 HillSignal. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
