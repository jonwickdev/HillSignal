import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Insights on Congressional activity, federal contracts, and how legislation impacts the stock market. Research and analysis from HillSignal.',
  alternates: {
    canonical: 'https://hillsignal.com/blog',
  },
}

// Static blog posts — stored here for simplicity, no CMS needed yet
export interface BlogPost {
  slug: string
  title: string
  description: string
  date: string
  readTime: string
  category: string
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'how-congressional-bills-move-markets',
    title: 'How Congressional Bills Move Stock Prices: The CHIPS Act, IRA, and What Retail Investors Miss',
    description: 'The CHIPS Act moved $200B in private semiconductor investment. The Inflation Reduction Act triggered a 22% clean energy rally. Here\'s how to spot the next market-moving bill before Wall Street prices it in.',
    date: '2026-03-18',
    readTime: '8 min read',
    category: 'Education',
  },
  {
    slug: 'federal-contracts-hidden-trading-signal',
    title: '$773 Billion in Federal Contracts: The Trading Signal Hiding in Plain Sight',
    description: 'In FY2024, the U.S. government awarded $773.68 billion in contracts — $464 billion to defense alone. Lockheed Martin got $50.7B. This data is public, updated daily, and most investors ignore it entirely.',
    date: '2026-03-15',
    readTime: '9 min read',
    category: 'Research',
  },
  {
    slug: 'retail-investor-guide-political-intelligence',
    title: 'Political Intelligence for Retail Investors: What Hedge Funds Pay $20K/Year to Know',
    description: 'Congressional leaders outperform backbenchers by up to 47% annually (NBER, 2025). Bloomberg Government costs $8K+/year. The underlying data is free — here\'s how to actually use it.',
    date: '2026-03-12',
    readTime: '10 min read',
    category: 'Strategy',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-hill-black">
      {/* Header */}
      <header className="border-b border-hill-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-hill-white">Hill<span className="text-hill-orange">Signal</span></Link>
          <Link href="/" className="text-hill-muted hover:text-hill-white text-sm transition-colors">← Back to Home</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-3xl md:text-4xl font-bold text-hill-white mb-4">Blog</h1>
        <p className="text-hill-muted mb-12">
          Research, analysis, and education on how Congressional activity impacts the stock market.
        </p>

        <div className="space-y-8">
          {BLOG_POSTS.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <article className="bg-hill-dark border border-hill-border rounded-lg p-6 hover:border-hill-orange/50 transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-hill-orange text-xs font-mono uppercase">{post.category}</span>
                  <span className="text-hill-muted text-xs">•</span>
                  <span className="text-hill-muted text-xs">{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  <span className="text-hill-muted text-xs">•</span>
                  <span className="text-hill-muted text-xs">{post.readTime}</span>
                </div>
                <h2 className="text-xl font-semibold text-hill-white mb-2 group-hover:text-hill-orange transition-colors">
                  {post.title}
                </h2>
                <p className="text-hill-muted text-sm leading-relaxed">{post.description}</p>
              </article>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16 bg-hill-dark border border-hill-border rounded-lg p-8">
          <h2 className="text-xl font-semibold text-hill-white mb-3">Want the signals, not just the articles?</h2>
          <p className="text-hill-muted mb-4">Get AI-analyzed Congressional signals delivered to your inbox daily.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-hill-orange hover:bg-hill-orange-dark text-white font-semibold py-3 px-6 rounded-lg transition-all">
            Get Access →
          </Link>
        </div>
      </main>
    </div>
  )
}
