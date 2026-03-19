import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BLOG_POSTS } from '../page'

const BLOG_CONTENT: Record<string, React.ReactNode> = {
  'how-congressional-bills-move-markets': (
    <>
      <p>
        In August 2022, President Biden signed the CHIPS and Science Act into law. Within 18 months, 
        semiconductor companies had announced over{' '}
        <a href="https://patentpc.com/blog/how-the-chips-act-is-impacting-the-u-s-semiconductor-industry-key-stats" target="_blank" rel="noopener noreferrer">
        $200 billion in new U.S. manufacturing investment</a>. Intel committed $100 billion across four new fabrication 
        plants. TSMC pledged $40 billion for facilities in Arizona. Samsung earmarked $17 billion for Texas.
      </p>
      <p>
        That same month, the Inflation Reduction Act passed with $369 billion in climate and energy spending. 
        Within a year, 270 new clean energy projects were announced totaling{' '}
        <a href="https://e2.org/project-tracker/" target="_blank" rel="noopener noreferrer">$130 billion in 
        private investment</a>. By 2025, the S&amp;P Clean Energy Index had{' '}
        <a href="https://www.ainvest.com/news/clean-energy-stocks-rally-policy-uncertainty-strategic-entry-point-growth-2508/" target="_blank" rel="noopener noreferrer">
        surged 22% year-to-date</a>.
      </p>
      <p>
        These aren&apos;t outliers. They&apos;re the pattern. Congressional bills move billions of dollars in capital allocation 
        every year, and most retail investors find out about it from CNBC two weeks after institutional money has already repositioned.
      </p>

      <h2>Why Most Investors Miss the Signal</h2>
      <p>
        The problem isn&apos;t that the information is secret. Every bill introduced in Congress is published 
        on <a href="https://www.congress.gov/browse" target="_blank" rel="noopener noreferrer">Congress.gov</a> within hours. 
        The problem is volume and legibility. The 119th Congress has already introduced thousands of bills 
        since January 2025, covering everything from fentanyl scheduling to tax reconciliation. Reading raw 
        legislation is a full-time job, and identifying which bills have genuine market impact requires fluency 
        in both policy and capital markets.
      </p>
      <p>
        Institutional investors solve this with expensive tools. Bloomberg Government (BGOV) starts 
        around <a href="https://about.bgov.com/request-pricing/" target="_blank" rel="noopener noreferrer">$8,000+/year 
        per seat</a>. FiscalNote, Quorum, and CQ Roll Call run $5,000 to $20,000+ annually. These platforms 
        employ policy analysts who translate legislative text into market implications. Retail investors typically 
        rely on mainstream financial media, which covers maybe 2% of Congressional activity — and usually after 
        the fact.
      </p>

      <h2>What Types of Bills Actually Move Stock Prices</h2>
      <p>
        Not every bill matters to markets. Most die in committee without a hearing. But certain categories have 
        consistently demonstrated measurable stock price impact:
      </p>

      <h3>Sector-specific spending authorization</h3>
      <p>
        This is the most direct path from bill to stock price. When Congress authorizes spending in a specific sector, 
        it creates a pipeline of revenue for companies in that space. The CHIPS Act directed $39 billion in manufacturing 
        incentives plus a{' '}
        <a href="https://www.pwc.com/us/en/library/chips-act.html" target="_blank" rel="noopener noreferrer">25% investment 
        tax credit for semiconductor manufacturing</a>. The beneficiaries were obvious: Intel, TSMC, Samsung, Micron. 
        The question was timing — investors who tracked the bill through committee markup had weeks of lead time before 
        mainstream coverage.
      </p>

      <h3>Tax credit and incentive changes</h3>
      <p>
        The IRA&apos;s production tax credits for renewable energy and 45Q carbon capture credits created entire 
        new business models. Bank of America identified{' '}
        <a href="https://www.cnbc.com/2023/07/19/stock-picks-for-companies-to-benefit-from-the-ira-bofa.html" target="_blank" rel="noopener noreferrer">
        dozens of companies</a> positioned to benefit — across renewables (Array Technologies, Sunrun, First Solar), 
        energy storage (Bloom Energy, Eaton), clean vehicles (Ford, GM, Rivian), and carbon capture (Linde, CF Industries). 
        This analysis was published a year after passage. The opportunity was visible in the bill text months earlier.
      </p>

      <h3>Defense authorization and appropriations</h3>
      <p>
        The annual National Defense Authorization Act (NDAA) is the single most predictable market-moving bill in Congress. 
        DoD budget authority hit $909.6 billion in FY2024, up from $874.3 billion the prior year. The{' '}
        <a href="https://dsm.forecastinternational.com/2025/11/12/top-100-defense-contractors-2024/" target="_blank" rel="noopener noreferrer">
        top 100 defense contractors</a> captured $287 billion of that. When the NDAA text reveals which programs 
        get funded — missile defense, shipbuilding, cyber warfare — the affected contractors are identifiable from the 
        appropriations language itself.
      </p>

      <h3>Industry regulation</h3>
      <p>
        Drug pricing bills can swing pharmaceutical stocks in a single session. AI regulation proposals affect 
        the entire tech sector. Antitrust actions create both winners (competitors) and losers (targets). These 
        bills don&apos;t need to pass to move prices — often the introduction alone signals regulatory intent 
        that reprices risk for affected companies.
      </p>

      <h2>The Timing Gap Is Real</h2>
      <p>
        A bill doesn&apos;t move markets on the day it&apos;s introduced. It moves markets at these inflection points: 
        committee markup (where the bill&apos;s actual provisions get finalized), floor vote scheduling (which signals 
        leadership support), and conference committee (where House and Senate versions get reconciled). Each of these 
        stages is publicly visible on Congress.gov but rarely makes financial news until the final vote.
      </p>
      <p>
        The window between committee activity and mainstream coverage is where informed investors have an edge. Not 
        insider information — public information that most people aren&apos;t tracking.
      </p>

      <h2>What HillSignal Does With This</h2>
      <p>
        We pull new bills from Congress.gov daily, run each one through AI analysis to identify affected sectors and 
        publicly traded companies, score the market impact, and surface the ones worth paying attention to. The goal 
        isn&apos;t to replace your own research — it&apos;s to solve the discovery problem. You shouldn&apos;t have to 
        read 10,000 bills a year to find the 50 that matter to your portfolio.
      </p>

      <p className="text-hill-muted text-xs mt-8 pt-4 border-t border-hill-border">
        <strong>Sources:</strong>{' '}
        <a href="https://patentpc.com/blog/how-the-chips-act-is-impacting-the-u-s-semiconductor-industry-key-stats" target="_blank" rel="noopener noreferrer">PatentPC (CHIPS Act stats)</a>,{' '}
        <a href="https://e2.org/project-tracker/" target="_blank" rel="noopener noreferrer">E2 Clean Energy Project Tracker</a>,{' '}
        <a href="https://www.pwc.com/us/en/library/chips-act.html" target="_blank" rel="noopener noreferrer">PwC CHIPS Act Analysis</a>,{' '}
        <a href="https://www.cnbc.com/2023/07/19/stock-picks-for-companies-to-benefit-from-the-ira-bofa.html" target="_blank" rel="noopener noreferrer">CNBC/BofA IRA Beneficiaries</a>,{' '}
        <a href="https://dsm.forecastinternational.com/2025/11/12/top-100-defense-contractors-2024/" target="_blank" rel="noopener noreferrer">Defense Security Monitor Top 100</a>.
        All data from publicly available government and research sources.
      </p>
    </>
  ),

  'federal-contracts-hidden-trading-signal': (
    <>
      <p>
        In fiscal year 2024, the U.S. federal government awarded{' '}
        <a href="https://govspend.com/blog/federal-contract-awards-hit-773-68b-in-fy24-small-businesses-see-4b-increase/" target="_blank" rel="noopener noreferrer">
        $773.68 billion in contracts</a> to 108,899 companies. That&apos;s more than the GDP of 
        Switzerland. It&apos;s public data, published on{' '}
        <a href="https://www.usaspending.gov/" target="_blank" rel="noopener noreferrer">USAspending.gov</a> by 
        the U.S. Treasury. And virtually no retail investor tracks it.
      </p>
      <p>
        Here&apos;s why that&apos;s a problem: unlike analyst estimates or earnings whispers, a federal contract award 
        is <em>confirmed revenue</em>. When the Department of Defense signs a $500 million contract with a publicly 
        traded company, that money is going to hit their balance sheet. It&apos;s not a forecast. It&apos;s not guidance. 
        It&apos;s a binding federal obligation.
      </p>

      <h2>The Numbers: Who Gets the Money</h2>
      <p>
        Defense agencies dominated FY2024 contract spending, accounting for $464.2 billion — roughly 60% of all 
        federal contract awards. The breakdown by military branch, per{' '}
        <a href="https://govspend.com/blog/federal-contract-spending-2024-insights-trends/" target="_blank" rel="noopener noreferrer">GovSpend&apos;s FY24 analysis</a>:
      </p>
      <ul>
        <li><strong>Department of the Navy:</strong> $137.48 billion</li>
        <li><strong>Air Force:</strong> $105.18 billion</li>
        <li><strong>Army:</strong> $102.42 billion</li>
        <li><strong>Defense Logistics Agency:</strong> $53.00 billion</li>
      </ul>
      <p>
        At the company level, the concentration is even more striking. The{' '}
        <a href="https://dsm.forecastinternational.com/2025/11/12/top-100-defense-contractors-2024/" target="_blank" rel="noopener noreferrer">
        top 100 defense contractors captured $287 billion</a> — 63% of all defense contract dollars. The top recipients:
      </p>
      <ul>
        <li><strong>Lockheed Martin:</strong> $50.749 billion</li>
        <li><strong>RTX Corporation (Raytheon):</strong> $24.817 billion</li>
        <li><strong>Boeing:</strong> $23.218 billion</li>
      </ul>
      <p>
        But here&apos;s what makes this data interesting for investors: the list isn&apos;t static. 
        SpaceX jumped from #53 to #28 in FY2024. Anduril appeared at #74. Palantir hit #96. New entrants 
        winning large contracts is a leading indicator of revenue growth that earnings reports won&apos;t 
        confirm for quarters.
      </p>

      <h2>Beyond Defense: Contracts Across Every Sector</h2>
      <p>
        While defense dominates by dollar volume, federal contracts flow across every major sector of the economy. 
        According to the{' '}
        <a href="https://www.gao.gov/blog/snapshot-government-wide-contracting-fy-2024-interactive-dashboard" target="_blank" rel="noopener noreferrer">
        U.S. GAO&apos;s FY2024 contracting snapshot</a>, the total $755 billion in obligations (slightly different from 
        award value due to de-obligations) spanned:
      </p>
      <ul>
        <li><strong>Healthcare:</strong> HHS, VA, and NIH contracts fund hospital systems, pharmaceutical R&amp;D, and 
        medical device procurement. When the VA awards a $200M contract for a new EHR system, companies like Oracle Health 
        (Cerner) see direct revenue impact.</li>
        <li><strong>Technology:</strong> Cloud computing, cybersecurity, and IT modernization contracts from DoD, DHS, and 
        GSA. Microsoft, Amazon (AWS), Google Cloud, and Palantir compete for these. A single cloud authorization (like 
        the JEDI/JWCC program) can represent billions in recurring revenue.</li>
        <li><strong>Infrastructure:</strong> DOT and Army Corps of Engineers contracts for highways, bridges, and water 
        systems. Companies like Fluor, AECOM, and Jacobs Engineering depend on this pipeline.</li>
        <li><strong>Energy:</strong> DOE contracts for nuclear cleanup, grid modernization, and research programs. These 
        often go to companies like Bechtel, BWX Technologies, and Honeywell.</li>
      </ul>
      <p>
        The top NAICS code by dollar value in FY2024 was Engineering Services, followed by Aircraft Manufacturing — reflecting 
        the dominance of{' '}
        <a href="https://gsa.federalschedules.com/resources/naics-code-government-spending-report/" target="_blank" rel="noopener noreferrer">
        professional services and defense hardware</a> in federal procurement.
      </p>

      <h2>Why This Data Isn&apos;t Priced In</h2>
      <p>
        There&apos;s a common objection: &ldquo;If it&apos;s public data, why isn&apos;t it already priced in?&rdquo; 
        Three reasons:
      </p>
      <p>
        <strong>Volume overwhelms attention.</strong> Thousands of contract modifications and new awards are posted to 
        USAspending.gov every business day. Most are small, routine, or go to private companies. Finding the ones 
        that matter to public equity investors requires filtering by dollar amount, recipient, and sector — work 
        that most individual investors (and honestly, most financial journalists) don&apos;t do.
      </p>
      <p>
        <strong>Coverage is sparse.</strong> Major financial media covers maybe the top 10 contract awards per year. 
        A $400 million contract to a mid-cap defense company might never make Bloomberg or Reuters. But that 
        award could represent 15% of the company&apos;s annual revenue.
      </p>
      <p>
        <strong>The data is messy.</strong> USAspending.gov is a database, not a news feed. Contracts appear under 
        the legal entity name of the recipient, which often differs from the publicly traded parent company. 
        You need to know that &ldquo;Sikorsky Aircraft Corporation&rdquo; is a Lockheed Martin subsidiary, or that 
        &ldquo;Amazon Web Services, Inc.&rdquo; rolls up to AMZN. This translation layer is what makes raw contract 
        data actionable for investors.
      </p>

      <h2>How HillSignal Uses This Data</h2>
      <p>
        We pull contract awards from USAspending.gov daily, filter for awards over $10 million, match recipients to 
        publicly traded parent companies, categorize by sector, and use AI to score the market impact. Each contract 
        signal includes the affected tickers, dollar amount, awarding agency, and a plain-English analysis of what 
        the contract means for the company&apos;s revenue outlook.
      </p>
      <p>
        The goal is to turn a government database into something an investor can actually scan over morning coffee 
        and decide whether it&apos;s worth a deeper look.
      </p>

      <p className="text-hill-muted text-xs mt-8 pt-4 border-t border-hill-border">
        <strong>Sources:</strong>{' '}
        <a href="https://govspend.com/blog/federal-contract-awards-hit-773-68b-in-fy24-small-businesses-see-4b-increase/" target="_blank" rel="noopener noreferrer">GovSpend FY24 Contract Awards</a>,{' '}
        <a href="https://www.gao.gov/blog/snapshot-government-wide-contracting-fy-2024-interactive-dashboard" target="_blank" rel="noopener noreferrer">GAO FY2024 Contracting Dashboard</a>,{' '}
        <a href="https://dsm.forecastinternational.com/2025/11/12/top-100-defense-contractors-2024/" target="_blank" rel="noopener noreferrer">Defense Security Monitor Top 100</a>,{' '}
        <a href="https://www.usaspending.gov/" target="_blank" rel="noopener noreferrer">USAspending.gov</a>,{' '}
        <a href="https://gsa.federalschedules.com/resources/naics-code-government-spending-report/" target="_blank" rel="noopener noreferrer">Federal Schedules NAICS Report</a>.
        All contract data is from public government sources.
      </p>
    </>
  ),

  'retail-investor-guide-political-intelligence': (
    <>
      <p>
        In December 2025, a working paper from the National Bureau of Economic Research analyzed Congressional stock 
        trades from 1995 to 2021 and found that{' '}
        <a href="https://fortune.com/2025/12/07/congress-stock-market-trades-leadership-outperformance-trading-ban-bill-discharge-petition/" target="_blank" rel="noopener noreferrer">
        Congressional leaders outperformed backbenchers by up to 47% annually</a>. Not because they&apos;re 
        better stock pickers — because they set the legislative agenda, decide which bills get a vote, and 
        receive briefings that inform their understanding of where federal dollars will flow next.
      </p>
      <p>
        A separate study from UC San Diego&apos;s Rady School of Management, published in January 2025, found that{' '}
        <a href="https://today.ucsd.edu/story/congressional-stock-trading-severely-undermines-public-trust-and-compliance-with-the-law" target="_blank" rel="noopener noreferrer">
        awareness of congressional stock trading significantly reduces Americans&apos; trust in Congress</a> — and 
        their willingness to comply with laws those same members pass. That&apos;s the backdrop: 86% of voters 
        support a ban on Congressional stock trading, and the people who would have to vote for it are the ones 
        profiting from the current system.
      </p>
      <p>
        This article isn&apos;t about outrage. It&apos;s about strategy. If members of Congress are trading on 
        information derived from their legislative work — and the data strongly suggests they are — then the 
        underlying information driving those trades is public. The question for retail investors is whether 
        you can access it, and whether it&apos;s useful.
      </p>

      <h2>What Institutional Investors Pay For</h2>
      <p>
        &ldquo;Political intelligence&rdquo; is a real industry with real revenue. Institutional investors subscribe 
        to platforms that track legislative activity and translate it into market implications:
      </p>
      <ul>
        <li><strong>Bloomberg Government (BGOV)</strong> — The gold standard. Custom pricing starts around $8,000+/year 
        per seat (<a href="https://about.bgov.com/request-pricing/" target="_blank" rel="noopener noreferrer">request 
        a quote</a>). Covers bills, regulations, contracts, lobbying, and committee activity.</li>
        <li><strong>FiscalNote</strong> — Legislative tracking with AI-powered analysis. Enterprise pricing, typically 
        $10,000-$20,000+/year.</li>
        <li><strong>Quorum</strong> — Government affairs platform used by corporations and lobbying firms. Similar 
        enterprise pricing tier.</li>
        <li><strong>CQ Roll Call</strong> — Detailed legislative tracking and analysis. $5,000-$15,000/year range.</li>
      </ul>
      <p>
        Some hedge funds go further. They hire former Congressional staffers and lobbyists as consultants — paying 
        six figures for intelligence on which bills have real momentum, which amendments are being negotiated behind 
        closed doors, and where federal spending is likely to land. This practice, documented by the{' '}
        <a href="https://www.brennancenter.org/our-work/research-reports/congressional-stock-trading-explained" target="_blank" rel="noopener noreferrer">
        Brennan Center for Justice</a>, is entirely legal. It&apos;s also an obvious information advantage.
      </p>

      <h2>The Underlying Data Is Free</h2>
      <p>
        Here&apos;s the thing about political intelligence: the raw data feeding these $10,000/year platforms is 
        almost entirely public. It has to be. These are government actions, funded by taxpayers, and disclosed 
        by law:
      </p>
      <ul>
        <li><strong>Congressional bills:</strong>{' '}
        <a href="https://www.congress.gov/browse" target="_blank" rel="noopener noreferrer">Congress.gov</a> — every 
        bill, resolution, and amendment, with full text, status tracking, and committee activity.</li>
        <li><strong>Federal contracts:</strong>{' '}
        <a href="https://www.usaspending.gov/" target="_blank" rel="noopener noreferrer">USAspending.gov</a> — every 
        federal contract award, with recipient, dollar amount, agency, and NAICS classification.</li>
        <li><strong>Congressional trading disclosures:</strong>{' '}
        <a href="https://efdsearch.senate.gov/search/" target="_blank" rel="noopener noreferrer">Senate eFD</a> and{' '}
        <a href="https://disclosures-clerk.house.gov/FinancialDisclosure" target="_blank" rel="noopener noreferrer">
        House Financial Disclosures</a> — required periodic transaction reports under the STOCK Act.</li>
        <li><strong>Regulatory filings:</strong>{' '}
        <a href="https://www.federalregister.gov/" target="_blank" rel="noopener noreferrer">Federal Register</a> — proposed 
        and final rules from every federal agency.</li>
      </ul>
      <p>
        The information isn&apos;t secret. It&apos;s fragmented across a dozen government websites, published in 
        formats designed for lawyers and bureaucrats, and updated at volumes that make manual tracking impossible 
        for anyone with a day job. That&apos;s the gap. Not access — processing.
      </p>

      <h2>What the Existing Retail Tools Get Wrong</h2>
      <p>
        Platforms like{' '}
        <a href="https://www.quiverquant.com" target="_blank" rel="noopener noreferrer">Quiver Quantitative</a> ($25/month) 
        and <a href="https://unusualwhales.com/politics" target="_blank" rel="noopener noreferrer">Unusual Whales</a> do 
        important work making Congressional trading data accessible. Unusual Whales publishes{' '}
        <a href="https://unusualwhales.com/congress-trading-report-2025" target="_blank" rel="noopener noreferrer">
        annual reports</a> showing which members outperform the S&amp;P 500 and even launched two ETFs (NANC and KRUZ) 
        that mirror Democratic and Republican Congressional trades respectively.
      </p>
      <p>
        But tracking what Congress <em>trades</em> has a fundamental timing problem. STOCK Act disclosures 
        are required within 30 days of the transaction — and the{' '}
        <a href="https://campaignlegal.org/update/congressional-stock-trading-and-stock-act" target="_blank" rel="noopener noreferrer">
        Campaign Legal Center reports</a> that many filers are routinely late, with the penalty being just $200. 
        By the time you see that a Senator bought defense stocks, the trade happened weeks ago.
      </p>
      <p>
        HillSignal takes a different approach. Instead of tracking <em>what Congress buys</em>, we track{' '}
        <em>what Congress does</em> — the bills they introduce, the contracts the agencies they oversee award, 
        the legislative activity that drives those trades in the first place. The source data, not the 
        derivative disclosure.
      </p>

      <h2>The Five Signal Categories Worth Watching</h2>
      <p>
        If you&apos;re just starting to pay attention to congressional activity as an investment signal, 
        focus on these categories — ranked by historical reliability:
      </p>

      <h3>1. Large federal contract awards ($100M+)</h3>
      <p>
        The single most actionable signal in political intelligence. A contract award is confirmed revenue. 
        In FY2024, the top 100 defense contractors alone received{' '}
        <a href="https://dsm.forecastinternational.com/2025/11/12/top-100-defense-contractors-2024/" target="_blank" rel="noopener noreferrer">
        $287 billion</a> in contracts. New entrants winning large awards — like SpaceX jumping from #53 to #28 — 
        are particularly interesting because they represent inflecting revenue.
      </p>

      <h3>2. Sector-specific spending bills</h3>
      <p>
        The NDAA (defense), farm bills (agriculture), and infrastructure authorization act all direct hundreds 
        of billions toward specific industries. The CHIPS Act&apos;s $52.7 billion triggered $200 billion in 
        follow-on investment. Tracking which bills advance through committee reveals where federal money will 
        flow 6-18 months before it shows up in earnings.
      </p>

      <h3>3. Tax credit creation or expansion</h3>
      <p>
        The IRA&apos;s clean energy tax credits created entire new revenue streams for companies like First Solar, 
        Sunrun, and Bloom Energy. When a bill creates or extends an industry-specific tax credit, the beneficiaries 
        are identifiable from the legislation text.
      </p>

      <h3>4. Regulatory and antitrust action</h3>
      <p>
        Bills targeting specific industries — drug pricing, Big Tech antitrust, AI regulation, cryptocurrency 
        frameworks — don&apos;t need to pass to move prices. Introduction signals regulatory intent. Committee 
        hearings signal momentum. Even a stalled bill can reprice risk for affected companies.
      </p>

      <h3>5. Healthcare policy</h3>
      <p>
        Medicare/Medicaid reimbursement rates, PBM reform, drug pricing negotiations, and VA healthcare 
        contracts directly impact pharmaceutical, hospital system, and medical device company revenues. 
        Healthcare legislation is among the most volatile for stock prices because the dollar amounts 
        are massive and the affected companies are easy to identify.
      </p>

      <h2>The Honest Limitations</h2>
      <p>
        Political intelligence is an information edge, not a crystal ball. Bills stall, get amended beyond 
        recognition, or die in conference committee. Contract awards get protested, reduced, or cancelled. 
        The stock market doesn&apos;t always react to legislative signals on your timeline — or at all.
      </p>
      <p>
        What this data gives you is context. When you see a defense stock moving, you can check whether 
        it just won a $500M contract. When a clean energy company rallies, you can see whether a relevant 
        tax credit just advanced through committee. It&apos;s not trading advice. It&apos;s information 
        that should be part of any serious investor&apos;s research process.
      </p>

      <p className="text-hill-muted text-xs mt-8 pt-4 border-t border-hill-border">
        <strong>Sources:</strong>{' '}
        <a href="https://fortune.com/2025/12/07/congress-stock-market-trades-leadership-outperformance-trading-ban-bill-discharge-petition/" target="_blank" rel="noopener noreferrer">Fortune/NBER Congressional Trading Study</a>,{' '}
        <a href="https://today.ucsd.edu/story/congressional-stock-trading-severely-undermines-public-trust-and-compliance-with-the-law" target="_blank" rel="noopener noreferrer">UC San Diego Trust Study</a>,{' '}
        <a href="https://www.brennancenter.org/our-work/research-reports/congressional-stock-trading-explained" target="_blank" rel="noopener noreferrer">Brennan Center</a>,{' '}
        <a href="https://campaignlegal.org/update/congressional-stock-trading-and-stock-act" target="_blank" rel="noopener noreferrer">Campaign Legal Center</a>,{' '}
        <a href="https://unusualwhales.com/congress-trading-report-2025" target="_blank" rel="noopener noreferrer">Unusual Whales 2025 Report</a>.
        All referenced data is from publicly available research and government sources.
      </p>
    </>
  ),
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = BLOG_POSTS.find((p) => p.slug === slug)
  if (!post) return { title: 'Post Not Found' }

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `https://hillsignal.com/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      siteName: 'HillSignal',
      url: `https://hillsignal.com/blog/${post.slug}`,
      publishedTime: post.date,
    },
  }
}

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }))
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = BLOG_POSTS.find((p) => p.slug === slug)
  const content = BLOG_CONTENT[slug]

  if (!post || !content) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'HillSignal' },
    publisher: { '@type': 'Organization', name: 'HillSignal', url: 'https://hillsignal.com' },
  }

  return (
    <div className="min-h-screen bg-hill-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="border-b border-hill-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-hill-white">Hill<span className="text-hill-orange">Signal</span></Link>
          <Link href="/blog" className="text-hill-muted hover:text-hill-white text-sm transition-colors">← All Posts</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        {/* Meta */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-hill-orange text-xs font-mono uppercase">{post.category}</span>
          <span className="text-hill-muted text-xs">•</span>
          <span className="text-hill-muted text-xs">{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <span className="text-hill-muted text-xs">•</span>
          <span className="text-hill-muted text-xs">{post.readTime}</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-hill-white mb-8 leading-tight">{post.title}</h1>

        {/* Article body */}
        <article className="prose prose-invert max-w-none
          prose-headings:text-hill-white prose-headings:font-semibold
          prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-hill-border prose-h2:pb-2
          prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-hill-orange/90
          prose-p:text-hill-text prose-p:leading-[1.75] prose-p:mb-5 prose-p:text-[15px]
          prose-li:text-hill-text prose-li:leading-[1.75] prose-li:text-[15px] prose-li:mb-2
          prose-strong:text-hill-white prose-strong:font-semibold
          prose-em:text-hill-orange prose-em:not-italic prose-em:font-medium
          prose-ul:my-4 prose-ul:ml-4
          prose-a:text-hill-orange prose-a:underline prose-a:decoration-hill-orange/30 hover:prose-a:decoration-hill-orange prose-a:underline-offset-2 prose-a:transition-colors">
          {content}
        </article>

        {/* CTA */}
        <div className="mt-16 bg-hill-dark border border-hill-orange/30 rounded-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-hill-white mb-3">Get these signals delivered daily</h2>
          <p className="text-hill-muted mb-4 text-sm">
            Stop reading about Congressional activity after the market moves. 
            HillSignal delivers AI-analyzed signals to your inbox every morning.
          </p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-hill-orange hover:bg-hill-orange-dark text-white font-semibold py-3 px-6 rounded-lg transition-all">
            Get Access for $5 →
          </Link>
        </div>

        {/* Other posts */}
        <div className="mt-12">
          <h3 className="text-hill-white font-semibold mb-4">More from the blog</h3>
          <div className="space-y-3">
            {BLOG_POSTS.filter((p) => p.slug !== slug).map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="block bg-hill-dark border border-hill-border rounded-lg p-4 hover:border-hill-orange/50 transition-all">
                <p className="text-hill-white font-medium text-sm">{p.title}</p>
                <p className="text-hill-muted text-xs mt-1">{p.readTime}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
