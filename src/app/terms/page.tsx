import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | HillSignal',
  description: 'Terms of Service for HillSignal - Congressional activity intelligence platform.',
}

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-hill-muted mb-8">
            Last Updated: March 15, 2026
          </p>

          <div className="prose prose-invert max-w-none space-y-8 text-hill-text">
            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">1. Agreement to Terms</h2>
              <p className="text-hill-muted leading-relaxed mb-4">
                Welcome to HillSignal. These Terms of Service ("Terms") govern your access to and use of the HillSignal website, 
                platform, and services (collectively, the "Service") operated by HillSignal ("Company," "we," "us," or "our").
              </p>
              <p className="text-hill-muted leading-relaxed mb-4">
                By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these 
                Terms, you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
              <p className="text-hill-muted leading-relaxed">
                You must be at least 18 years old and legally capable of entering into binding contracts to use this Service. 
                By using HillSignal, you represent and warrant that you meet these requirements.
              </p>
            </section>

            {/* Description of Service */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">2. Description of Service</h2>
              <p className="text-hill-muted leading-relaxed mb-4">
                HillSignal provides a Congressional activity tracking and intelligence service designed to help investors monitor 
                bills, federal contracts, proposed legislation, and other Congressional events that may impact 
                financial markets. Our Service includes:
              </p>
              <ul className="list-disc list-inside text-hill-muted space-y-2 ml-4">
                <li>Daily Congressional activity monitoring and alerts</li>
                <li>Market impact analysis and sentiment indicators</li>
                <li>Sector-specific filtering and customization</li>
                <li>Email notifications based on your preferences</li>
                <li>Access to our dashboard and signal feed</li>
              </ul>
            </section>

            {/* Account Terms */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">3. Account Terms</h2>
              <h3 className="text-lg font-medium text-hill-white mb-3">3.1 Account Registration</h3>
              <p className="text-hill-muted leading-relaxed mb-4">
                To access certain features of the Service, you must register for an account. When you register, you agree to:
              </p>
              <ul className="list-disc list-inside text-hill-muted space-y-2 ml-4 mb-4">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security and confidentiality of your login credentials</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
              <h3 className="text-lg font-medium text-hill-white mb-3">3.2 Account Security</h3>
              <p className="text-hill-muted leading-relaxed">
                You are responsible for safeguarding the password used to access the Service and for any activities or actions 
                under your password. We encourage you to use a strong, unique password. We cannot and will not be liable for any 
                loss or damage arising from your failure to comply with this security obligation.
              </p>
            </section>

            {/* Subscription and Pricing */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">4. Subscription and Pricing</h2>
              <h3 className="text-lg font-medium text-hill-white mb-3">4.1 Pricing Structure</h3>
              <p className="text-hill-muted leading-relaxed mb-4">
                HillSignal offers both lifetime access purchases and subscription-based pricing. Our tiered pricing model offers:
              </p>
              <ul className="list-disc list-inside text-hill-muted space-y-2 ml-4 mb-4">
                <li><strong>Founding Member Tier:</strong> One-time payment of $5 for lifetime access (limited availability)</li>
                <li><strong>Early Adopter Tier:</strong> One-time payment of $9 for lifetime access (limited availability)</li>
                <li><strong>Growth Tier:</strong> One-time payment of $15 for lifetime access (limited availability)</li>
                <li><strong>Standard Tier:</strong> Monthly subscription at $29/month for ongoing access</li>
              </ul>
              <h3 className="text-lg font-medium text-hill-white mb-3">4.2 Lifetime Access</h3>
              <p className="text-hill-muted leading-relaxed mb-4">
                "Lifetime access" means access to the Service for as long as HillSignal operates the Service. This does not 
                guarantee perpetual operation of the Service. Lifetime access includes all current features and reasonable 
                updates, but may not include major new product lines or premium add-ons released in the future.
              </p>
              <h3 className="text-lg font-medium text-hill-white mb-3">4.3 Subscription Terms</h3>
              <p className="text-hill-muted leading-relaxed mb-4">
                Subscriptions automatically renew at the end of each billing period unless cancelled. You may cancel your 
                subscription at any time through your account settings or by contacting us. Cancellation takes effect at the 
                end of the current billing period.
              </p>
              <h3 className="text-lg font-medium text-hill-white mb-3">4.4 Payment Processing</h3>
              <p className="text-hill-muted leading-relaxed">
                All payments are processed securely through Stripe, our third-party payment processor. By providing payment 
                information, you authorize us to charge the applicable fees. You agree to Stripe's terms of service in 
                connection with your payment.
              </p>
            </section>

            {/* Refund Policy */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">5. Refund Policy</h2>
              <h3 className="text-lg font-medium text-hill-white mb-3">5.1 Lifetime Purchases</h3>
              <p className="text-hill-muted leading-relaxed mb-4">
                Due to the digital nature of our Service and the significant discounts offered on lifetime access tiers, 
                all lifetime purchases are final and non-refundable after 7 days from the date of purchase. Within the 
                7-day period, you may request a full refund if you are unsatisfied with the Service.
              </p>
              <h3 className="text-lg font-medium text-hill-white mb-3">5.2 Subscriptions</h3>
              <p className="text-hill-muted leading-relaxed mb-4">
                Subscription fees are non-refundable for partial billing periods. If you cancel your subscription, you will 
                continue to have access until the end of your current billing period, but no refund will be issued for the 
                remaining time.
              </p>
              <h3 className="text-lg font-medium text-hill-white mb-3">5.3 How to Request a Refund</h3>
              <p className="text-hill-muted leading-relaxed">
                To request a refund within the eligible period, please contact us at{' '}
                <a href="mailto:legal@hillsignal.com" className="text-hill-orange hover:underline">legal@hillsignal.com</a>{' '}
                with your account email and reason for the refund request.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">6. Intellectual Property</h2>
              <h3 className="text-lg font-medium text-hill-white mb-3">6.1 Our Property</h3>
              <p className="text-hill-muted leading-relaxed mb-4">
                The Service and its original content (excluding content provided by users), features, and functionality are 
                and will remain the exclusive property of HillSignal and its licensors. The Service is protected by copyright, 
                trademark, and other laws of the United States and foreign countries. Our trademarks and trade dress may not 
                be used in connection with any product or service without our prior written consent.
              </p>
              <h3 className="text-lg font-medium text-hill-white mb-3">6.2 License to Use</h3>
              <p className="text-hill-muted leading-relaxed mb-4">
                Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access 
                and use the Service for your personal, non-commercial investment research purposes.
              </p>
              <h3 className="text-lg font-medium text-hill-white mb-3">6.3 Restrictions</h3>
              <p className="text-hill-muted leading-relaxed">
                You may not: (a) copy, modify, or distribute our content; (b) use our content for commercial purposes without 
                permission; (c) attempt to reverse engineer any aspect of the Service; (d) remove any copyright or proprietary 
                notices; (e) transfer your access to another party; or (f) use automated systems to access the Service.
              </p>
            </section>

            {/* User Conduct */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">7. User Conduct</h2>
              <p className="text-hill-muted leading-relaxed mb-4">You agree not to:</p>
              <ul className="list-disc list-inside text-hill-muted space-y-2 ml-4">
                <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
                <li>Attempt to gain unauthorized access to any portion of the Service</li>
                <li>Interfere with or disrupt the Service or servers connected to the Service</li>
                <li>Use any robot, spider, or other automated means to access the Service</li>
                <li>Impersonate any person or entity or misrepresent your affiliation</li>
                <li>Share your account credentials with others or allow multiple users on one account</li>
                <li>Redistribute, resell, or commercially exploit our content or data</li>
                <li>Use the Service in any manner that could damage, disable, or impair the Service</li>
              </ul>
            </section>

            {/* Disclaimer */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">8. Disclaimer of Warranties</h2>
              <div className="bg-hill-dark border border-hill-border rounded-lg p-4 mb-4">
                <p className="text-hill-muted leading-relaxed font-medium">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
                  INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND 
                  NON-INFRINGEMENT.
                </p>
              </div>
              <p className="text-hill-muted leading-relaxed mb-4">
                We do not warrant that: (a) the Service will be uninterrupted, secure, or error-free; (b) the results obtained 
                from the Service will be accurate or reliable; (c) any errors in the Service will be corrected; or (d) the 
                Service will meet your requirements.
              </p>
              <div className="bg-hill-dark border border-yellow-600/50 rounded-lg p-4">
                <h3 className="text-yellow-500 font-semibold mb-2">⚠️ Not Financial Advice</h3>
                <p className="text-hill-muted leading-relaxed">
                  HillSignal provides information about Congressional activities for informational purposes only. Nothing in 
                  our Service constitutes investment advice, financial advice, trading advice, or any other sort of advice. 
                  You should not treat any of our content as such. We do not recommend that any securities be bought, sold, 
                  or held by you. Always conduct your own due diligence and consult with a qualified financial advisor before 
                  making investment decisions.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">9. Limitation of Liability</h2>
              <div className="bg-hill-dark border border-hill-border rounded-lg p-4 mb-4">
                <p className="text-hill-muted leading-relaxed font-medium">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL HILLSIGNAL, ITS DIRECTORS, EMPLOYEES, PARTNERS, 
                  AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE 
                  DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, 
                  RESULTING FROM YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE.
                </p>
              </div>
              <p className="text-hill-muted leading-relaxed mb-4">
                Our total liability for any claims arising out of or relating to these Terms or the Service shall not exceed 
                the amount you paid us in the twelve (12) months preceding the claim, or $100, whichever is greater.
              </p>
              <p className="text-hill-muted leading-relaxed">
                Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability for incidental 
                or consequential damages, so some of the above limitations may not apply to you.
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">10. Indemnification</h2>
              <p className="text-hill-muted leading-relaxed">
                You agree to defend, indemnify, and hold harmless HillSignal and its licensees and licensors, and their 
                employees, contractors, agents, officers, and directors, from and against any and all claims, damages, 
                obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees) 
                arising from: (a) your use of and access to the Service; (b) your violation of any term of these Terms; 
                (c) your violation of any third-party right, including without limitation any copyright, property, or privacy 
                right; or (d) any claim that your use of the Service caused damage to a third party.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">11. Termination</h2>
              <p className="text-hill-muted leading-relaxed mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice or 
                liability, for any reason whatsoever, including without limitation if you breach these Terms.
              </p>
              <p className="text-hill-muted leading-relaxed mb-4">
                Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, 
                you may simply discontinue using the Service or contact us to request account deletion.
              </p>
              <p className="text-hill-muted leading-relaxed">
                All provisions of these Terms which by their nature should survive termination shall survive termination, 
                including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
              </p>
            </section>

            {/* Dispute Resolution */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">12. Dispute Resolution</h2>
              <h3 className="text-lg font-medium text-hill-white mb-3">12.1 Governing Law</h3>
              <p className="text-hill-muted leading-relaxed mb-4">
                These Terms shall be governed and construed in accordance with the laws of the State of Delaware, United States, 
                without regard to its conflict of law provisions.
              </p>
              <h3 className="text-lg font-medium text-hill-white mb-3">12.2 Informal Resolution</h3>
              <p className="text-hill-muted leading-relaxed mb-4">
                Before filing a claim against HillSignal, you agree to try to resolve the dispute informally by contacting us 
                at <a href="mailto:legal@hillsignal.com" className="text-hill-orange hover:underline">legal@hillsignal.com</a>. 
                We will try to resolve the dispute informally by contacting you via email. If a dispute is not resolved within 
                30 days of submission, you or HillSignal may bring a formal proceeding.
              </p>
              <h3 className="text-lg font-medium text-hill-white mb-3">12.3 Arbitration</h3>
              <p className="text-hill-muted leading-relaxed mb-4">
                Any dispute arising from these Terms or your use of the Service that cannot be resolved informally shall be 
                resolved by binding arbitration in accordance with the rules of the American Arbitration Association. The 
                arbitration shall be conducted in Delaware, and judgment on the arbitration award may be entered into any 
                court having jurisdiction.
              </p>
              <h3 className="text-lg font-medium text-hill-white mb-3">12.4 Class Action Waiver</h3>
              <p className="text-hill-muted leading-relaxed">
                YOU AND HILLSIGNAL AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY 
                AND NOT AS A PLAINTIFF OR CLASS MEMBER IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">13. Changes to Terms</h2>
              <p className="text-hill-muted leading-relaxed mb-4">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is 
                material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a 
                material change will be determined at our sole discretion.
              </p>
              <p className="text-hill-muted leading-relaxed">
                By continuing to access or use our Service after any revisions become effective, you agree to be bound by the 
                revised terms. If you do not agree to the new terms, you are no longer authorized to use the Service.
              </p>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">14. Severability</h2>
              <p className="text-hill-muted leading-relaxed">
                If any provision of these Terms is held to be unenforceable or invalid, such provision will be changed and 
                interpreted to accomplish the objectives of such provision to the greatest extent possible under applicable 
                law, and the remaining provisions will continue in full force and effect.
              </p>
            </section>

            {/* Entire Agreement */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">15. Entire Agreement</h2>
              <p className="text-hill-muted leading-relaxed">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and HillSignal 
                regarding your use of the Service and supersede all prior and contemporaneous understandings, agreements, 
                representations, and warranties, both written and oral, regarding the Service.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold text-hill-white mb-4">16. Contact Us</h2>
              <p className="text-hill-muted leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="bg-hill-dark border border-hill-border rounded-lg p-4">
                <p className="text-hill-muted">HillSignal</p>
                <p className="text-hill-muted">Email: <a href="mailto:legal@hillsignal.com" className="text-hill-orange hover:underline">legal@hillsignal.com</a></p>
                <p className="text-hill-muted">Website: <a href="https://hillsignal.com" className="text-hill-orange hover:underline">https://hillsignal.com</a></p>
              </div>
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
            <a href="/privacy" className="text-hill-muted hover:text-hill-white transition-colors">Privacy Policy</a>
            <a href="/terms" className="text-hill-orange">Terms of Service</a>
            <a href="/" className="text-hill-muted hover:text-hill-white transition-colors">Home</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
