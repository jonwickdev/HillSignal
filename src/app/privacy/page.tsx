import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | HillSignal',
  description: 'Privacy Policy for HillSignal - How we collect, use, and protect your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-hill-black">
      {/* Header */}
      <header className="py-6 px-4 border-b border-hill-border">
        <div className="max-w-4xl mx-auto">
          <a href="/" className="text-2xl font-bold text-hill-white">
            Hill<span className="text-hill-orange">Signal</span>
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-hill-white mb-2">
            Privacy Policy
          </h1>
          <p className="text-hill-muted mb-8">
            Last Updated: March 15, 2026
          </p>

          <div className="prose prose-invert max-w-none space-y-8 text-hill-text">
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">1. Introduction</h2>
              <p className="text-hill-muted leading-relaxed mb-4">
                HillSignal ("Company," "we," "us," or "our") respects your privacy and is committed to protecting your personal 
                data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit 
                our website hillsignal.com and use our services (collectively, the "Service").
              </p>
              <p className="text-hill-muted leading-relaxed mb-4">
                Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do 
                not access the Service. By using the Service, you consent to the collection, use, and disclosure of your 
                information as described in this Privacy Policy.
              </p>
              <p className="text-hill-muted leading-relaxed">
                This Privacy Policy applies to information we collect through our Service and in email, text, and other electronic 
                communications sent through or in connection with the Service.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-lg font-medium text-hill-white mb-3">2.1 Information You Provide to Us</h3>
              <p className="text-hill-muted leading-relaxed mb-4">We collect information you voluntarily provide, including:</p>
              <ul className="list-disc list-inside text-hill-muted space-y-2 ml-4 mb-6">
                <li><strong>Account Information:</strong> Email address and password when you create an account</li>
                <li><strong>Profile Information:</strong> Your sector preferences and email notification settings</li>
                <li><strong>Payment Information:</strong> Billing details processed through Stripe (we do not store full credit card numbers)</li>
                <li><strong>Communications:</strong> Information you provide when contacting us for support</li>
              </ul>

              <h3 className="text-lg font-medium text-hill-white mb-3">2.2 Information Collected Automatically</h3>
              <p className="text-hill-muted leading-relaxed mb-4">When you access our Service, we automatically collect:</p>
              <ul className="list-disc list-inside text-hill-muted space-y-2 ml-4 mb-6">
                <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the Service</li>
                <li><strong>Log Data:</strong> IP address, access times, referring URLs</li>
                <li><strong>Cookies and Similar Technologies:</strong> Information collected through cookies, pixels, and local storage</li>
              </ul>

              <h3 className="text-lg font-medium text-hill-white mb-3">2.3 Information from Third Parties</h3>
              <p className="text-hill-muted leading-relaxed">
                We may receive information about you from third-party services you connect to your account, including authentication 
                providers and payment processors like Stripe.
              </p>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">3. How We Use Your Information</h2>
              <p className="text-hill-muted leading-relaxed mb-4">We use the information we collect to:</p>
              <ul className="list-disc list-inside text-hill-muted space-y-2 ml-4">
                <li><strong>Provide the Service:</strong> Deliver Congressional signals, alerts, and market intelligence based on your preferences</li>
                <li><strong>Process Payments:</strong> Complete transactions and send related information</li>
                <li><strong>Send Communications:</strong> Email alerts, newsletters, and service updates based on your notification preferences</li>
                <li><strong>Personalize Experience:</strong> Customize content based on your sector preferences</li>
                <li><strong>Improve the Service:</strong> Analyze usage patterns to enhance features and user experience</li>
                <li><strong>Ensure Security:</strong> Detect and prevent fraud, abuse, and unauthorized access</li>
                <li><strong>Legal Compliance:</strong> Comply with legal obligations and enforce our Terms of Service</li>
                <li><strong>Customer Support:</strong> Respond to your inquiries and provide assistance</li>
              </ul>
            </section>

            {/* Legal Basis for Processing (GDPR) */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">4. Legal Basis for Processing (GDPR)</h2>
              <p className="text-hill-muted leading-relaxed mb-4">
                If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, we process your personal 
                data based on the following legal grounds:
              </p>
              <ul className="list-disc list-inside text-hill-muted space-y-2 ml-4">
                <li><strong>Contract Performance:</strong> To provide the Service you have requested</li>
                <li><strong>Legitimate Interests:</strong> To improve and secure our Service, and for marketing (where permitted)</li>
                <li><strong>Consent:</strong> Where you have explicitly consented to specific processing</li>
                <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
              </ul>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">5. Cookies and Tracking Technologies</h2>
              <p className="text-hill-muted leading-relaxed mb-4">
                We use cookies and similar tracking technologies to collect and store information about your interactions with our Service.
              </p>
              
              <h3 className="text-lg font-medium text-hill-white mb-3">5.1 Types of Cookies We Use</h3>
              <div className="bg-hill-dark border border-hill-border rounded-lg p-4 mb-4">
                <table className="w-full text-sm text-hill-muted">
                  <thead>
                    <tr className="border-b border-hill-border">
                      <th className="text-left py-2 text-hill-white">Type</th>
                      <th className="text-left py-2 text-hill-white">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-hill-border/50">
                      <td className="py-2">Essential</td>
                      <td className="py-2">Required for authentication and security</td>
                    </tr>
                    <tr className="border-b border-hill-border/50">
                      <td className="py-2">Functional</td>
                      <td className="py-2">Remember your preferences and settings</td>
                    </tr>
                    <tr>
                      <td className="py-2">Analytics</td>
                      <td className="py-2">Understand how you use our Service</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-medium text-hill-white mb-3">5.2 Managing Cookies</h3>
              <p className="text-hill-muted leading-relaxed">
                Most web browsers allow you to control cookies through their settings. However, disabling cookies may limit your 
                ability to use certain features of our Service. You can manage your cookie preferences in your browser settings.
              </p>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">6. Third-Party Services</h2>
              <p className="text-hill-muted leading-relaxed mb-4">
                We use trusted third-party service providers to operate our Service:
              </p>

              <div className="space-y-4">
                <div className="bg-hill-dark border border-hill-border rounded-lg p-4">
                  <h4 className="text-hill-white font-medium mb-2">Stripe (Payment Processing)</h4>
                  <p className="text-hill-muted text-sm mb-2">
                    We use Stripe to process payments securely. Stripe collects payment information directly and is PCI-DSS compliant. 
                    We do not store your full credit card number.
                  </p>
                  <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" 
                     className="text-hill-orange text-sm hover:underline">Stripe Privacy Policy →</a>
                </div>

                <div className="bg-hill-dark border border-hill-border rounded-lg p-4">
                  <h4 className="text-hill-white font-medium mb-2">Supabase (Authentication & Database)</h4>
                  <p className="text-hill-muted text-sm mb-2">
                    We use Supabase for user authentication and secure data storage. Your account information and preferences are 
                    stored in Supabase's secure infrastructure.
                  </p>
                  <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" 
                     className="text-hill-orange text-sm hover:underline">Supabase Privacy Policy →</a>
                </div>

                <div className="bg-hill-dark border border-hill-border rounded-lg p-4">
                  <h4 className="text-hill-white font-medium mb-2">Vercel (Hosting)</h4>
                  <p className="text-hill-muted text-sm mb-2">
                    Our website is hosted on Vercel, which may collect access logs and performance metrics.
                  </p>
                  <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" 
                     className="text-hill-orange text-sm hover:underline">Vercel Privacy Policy →</a>
                </div>
              </div>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">7. How We Share Your Information</h2>
              <p className="text-hill-muted leading-relaxed mb-4">We may share your information in the following circumstances:</p>
              <ul className="list-disc list-inside text-hill-muted space-y-2 ml-4">
                <li><strong>Service Providers:</strong> With third parties who help us operate our Service (as described above)</li>
                <li><strong>Legal Requirements:</strong> When required by law, court order, or governmental authority</li>
                <li><strong>Protection of Rights:</strong> To protect our rights, privacy, safety, or property, and that of our users</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> When you have given us explicit permission</li>
              </ul>
              <p className="text-hill-muted leading-relaxed mt-4">
                <strong>We do not sell your personal information to third parties.</strong>
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">8. Data Retention</h2>
              <p className="text-hill-muted leading-relaxed mb-4">
                We retain your personal data only for as long as necessary to fulfill the purposes for which we collected it, 
                including to satisfy any legal, accounting, or reporting requirements.
              </p>
              <ul className="list-disc list-inside text-hill-muted space-y-2 ml-4">
                <li><strong>Account Data:</strong> Retained while your account is active and for 30 days after deletion</li>
                <li><strong>Payment Records:</strong> Retained for 7 years for tax and legal compliance</li>
                <li><strong>Usage Logs:</strong> Retained for up to 12 months</li>
                <li><strong>Email Preferences:</strong> Retained until you update them or delete your account</li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">9. Data Security</h2>
              <p className="text-hill-muted leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your personal data, including:
              </p>
              <ul className="list-disc list-inside text-hill-muted space-y-2 ml-4 mb-4">
                <li>Encryption of data in transit (HTTPS/TLS)</li>
                <li>Encryption of sensitive data at rest</li>
                <li>Secure authentication with password hashing</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls limiting data access to authorized personnel</li>
                <li>Row Level Security (RLS) in our database</li>
              </ul>
              <p className="text-hill-muted leading-relaxed">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to 
                use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">10. Your Rights</h2>
              <p className="text-hill-muted leading-relaxed mb-4">
                Depending on your location, you may have the following rights regarding your personal data:
              </p>

              <h3 className="text-lg font-medium text-hill-white mb-3">10.1 All Users</h3>
              <ul className="list-disc list-inside text-hill-muted space-y-2 ml-4 mb-6">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                <li><strong>Deletion:</strong> Request deletion of your data (subject to legal retention requirements)</li>
                <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Update Preferences:</strong> Modify your email and sector preferences at any time</li>
              </ul>

              <h3 className="text-lg font-medium text-hill-white mb-3">10.2 GDPR Rights (EEA, UK, Switzerland)</h3>
              <ul className="list-disc list-inside text-hill-muted space-y-2 ml-4 mb-6">
                <li><strong>Right to Portability:</strong> Receive your data in a structured, machine-readable format</li>
                <li><strong>Right to Restriction:</strong> Request restriction of processing in certain circumstances</li>
                <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent</li>
                <li><strong>Right to Lodge a Complaint:</strong> File a complaint with your local data protection authority</li>
              </ul>

              <h3 className="text-lg font-medium text-hill-white mb-3">10.3 CCPA Rights (California Residents)</h3>
              <ul className="list-disc list-inside text-hill-muted space-y-2 ml-4">
                <li><strong>Right to Know:</strong> Request disclosure of personal information collected, used, and disclosed</li>
                <li><strong>Right to Delete:</strong> Request deletion of personal information</li>
                <li><strong>Right to Opt-Out:</strong> Opt-out of the sale of personal information (note: we do not sell personal information)</li>
                <li><strong>Right to Non-Discrimination:</strong> Equal service regardless of exercising your privacy rights</li>
              </ul>
            </section>

            {/* California Privacy Rights */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">11. California Privacy Rights (CCPA)</h2>
              <p className="text-hill-muted leading-relaxed mb-4">
                If you are a California resident, the California Consumer Privacy Act (CCPA) provides you with specific rights 
                regarding your personal information.
              </p>
              <div className="bg-hill-dark border border-hill-border rounded-lg p-4 mb-4">
                <h4 className="text-hill-white font-medium mb-2">Categories of Information We Collect</h4>
                <ul className="list-disc list-inside text-hill-muted space-y-1 text-sm">
                  <li>Identifiers (email address)</li>
                  <li>Commercial information (purchase history)</li>
                  <li>Internet activity (browsing history on our site)</li>
                  <li>Inferences (sector preferences)</li>
                </ul>
              </div>
              <p className="text-hill-muted leading-relaxed">
                To exercise your CCPA rights, please contact us at{' '}
                <a href="mailto:legal@hillsignal.com" className="text-hill-orange hover:underline">legal@hillsignal.com</a>. 
                We will respond to your request within 45 days.
              </p>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">12. International Data Transfers</h2>
              <p className="text-hill-muted leading-relaxed mb-4">
                HillSignal is based in the United States. If you are accessing our Service from outside the United States, 
                please be aware that your information may be transferred to, stored, and processed in the United States where 
                our servers are located and our central database is operated.
              </p>
              <p className="text-hill-muted leading-relaxed">
                If you are located in the EEA, UK, or Switzerland, we will take appropriate measures to ensure that your personal 
                data receives an adequate level of protection in the jurisdictions in which we process it, including through 
                Standard Contractual Clauses approved by the European Commission.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">13. Children's Privacy</h2>
              <p className="text-hill-muted leading-relaxed">
                Our Service is not intended for individuals under the age of 18. We do not knowingly collect personal information 
                from children under 18. If we learn that we have collected personal information from a child under 18, we will 
                take steps to delete such information as soon as possible. If you believe we have collected information from a 
                child under 18, please contact us immediately.
              </p>
            </section>

            {/* Do Not Track */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">14. Do Not Track Signals</h2>
              <p className="text-hill-muted leading-relaxed">
                Some browsers include a "Do Not Track" (DNT) feature that signals to websites that you do not want your online 
                activity tracked. Currently, there is no uniform standard for interpreting DNT signals. At this time, our Service 
                does not respond to DNT browser signals. However, you can use the range of other tools we provide to control data 
                collection and use.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">15. Changes to This Privacy Policy</h2>
              <p className="text-hill-muted leading-relaxed mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy 
                Policy on this page and updating the "Last Updated" date at the top.
              </p>
              <p className="text-hill-muted leading-relaxed">
                For significant changes, we will provide additional notice (such as adding a statement to our homepage or sending 
                you an email notification). We encourage you to review this Privacy Policy periodically for any changes. Your 
                continued use of the Service after any changes to this Privacy Policy constitutes your acceptance of such changes.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">16. Contact Us</h2>
              <p className="text-hill-muted leading-relaxed mb-4">
                If you have any questions about this Privacy Policy, your personal data, or would like to exercise your rights, 
                please contact us:
              </p>
              <div className="bg-hill-dark border border-hill-border rounded-lg p-4">
                <p className="text-hill-muted">HillSignal</p>
                <p className="text-hill-muted">Email: <a href="mailto:legal@hillsignal.com" className="text-hill-orange hover:underline">legal@hillsignal.com</a></p>
                <p className="text-hill-muted">Privacy Inquiries: <a href="mailto:privacy@hillsignal.com" className="text-hill-orange hover:underline">privacy@hillsignal.com</a></p>
                <p className="text-hill-muted">Website: <a href="https://hillsignal.com" className="text-hill-orange hover:underline">https://hillsignal.com</a></p>
              </div>
              <p className="text-hill-muted leading-relaxed mt-4">
                For GDPR-related inquiries, you may also contact your local data protection authority.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-hill-border">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-hill-muted text-sm">
            © {new Date().getFullYear()} HillSignal. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <a href="/privacy" className="text-hill-orange">Privacy Policy</a>
            <a href="/terms" className="text-hill-muted hover:text-hill-white transition-colors">Terms of Service</a>
            <a href="/" className="text-hill-muted hover:text-hill-white transition-colors">Home</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
