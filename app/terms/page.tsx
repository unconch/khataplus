import Link from "next/link"
import { ArrowLeft, FileText, Scale } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"

export default function TermsOfServicePage() {
    return (
        <div className="min-h-screen bg-white text-zinc-900 antialiased selection:bg-emerald-500/30">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-zinc-200/80">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <Logo size={32} className="text-emerald-600" />
                        <span className="font-bold text-xl tracking-tight text-zinc-900">KhataPlus</span>
                    </Link>
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="gap-2 hover:bg-zinc-100 rounded-full px-4 text-zinc-600">
                            <ArrowLeft size={16} /> Back to Home
                        </Button>
                    </Link>
                </div>
            </nav>

            <main className="pt-32 pb-24 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-12 animate-in fade-in slide-up duration-500">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
                            <FileText size={32} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Terms of Service</h1>
                        <p className="text-zinc-500 text-lg">Last updated: February 18, 2026</p>
                    </div>

                    <div className="space-y-10 text-zinc-700 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">1. Agreement to Terms</h2>
                            <p>
                                These Terms of Service ("Terms") govern your use of KhataPlus websites, applications,
                                APIs, and related services (collectively, the "Service"). By creating an account or
                                using the Service, you agree to these Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">2. Eligibility and Accounts</h2>
                            <p>
                                You must provide accurate account details and keep your credentials secure. You are
                                responsible for activities under your account. You may authorize staff or teammates in
                                your organization, and you are responsible for their access configuration.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">3. Acceptable Use</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Do not use the Service for unlawful, fraudulent, or deceptive activity.</li>
                                <li>Do not attempt to reverse engineer, disrupt, or abuse our systems.</li>
                                <li>Do not upload harmful content, malware, or unauthorized third-party data.</li>
                                <li>Use only data you are legally permitted to process.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">4. Subscriptions, Billing, and Payments</h2>
                            <p>
                                Paid plans and add-ons may be billed on recurring or one-time terms as shown at
                                checkout. Payments are processed by our payment partner(s), including Cashfree, and are
                                subject to their terms.
                            </p>
                            <ul className="list-disc pl-6 space-y-2 mt-3">
                                <li>Plan features, limits, and pricing are displayed in-app or on pricing pages.</li>
                                <li>Taxes, if applicable, may be added at checkout.</li>
                                <li>Failure to pay may lead to downgrade, suspension, or restricted access.</li>
                                <li>You authorize us to apply plan changes after successful payment confirmation.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">5. Refunds and Cancellations</h2>
                            <p>
                                Unless otherwise required by law, charges are non-refundable after successful billing.
                                You may cancel future renewals from your billing settings; cancellation prevents future
                                charges and does not reverse already processed payments.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">6. Data and Privacy</h2>
                            <p>
                                You retain ownership of business data you submit. You grant us limited rights to host,
                                process, secure, and transmit that data solely to provide and improve the Service. Our
                                data handling practices are described in our Privacy Policy.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">7. Service Availability and Changes</h2>
                            <p>
                                We may update, change, or discontinue features at any time. We aim for high
                                availability but do not guarantee uninterrupted access. Maintenance windows, outages,
                                or third-party incidents may affect availability.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">8. Intellectual Property</h2>
                            <p>
                                The Service, including software, branding, and content, is owned by KhataPlus and its
                                licensors and is protected by intellectual property laws. These Terms grant you a
                                limited, non-exclusive, non-transferable right to use the Service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">9. Suspension and Termination</h2>
                            <p>
                                We may suspend or terminate access if you violate these Terms, pose a security risk,
                                or engage in misuse. You may stop using the Service at any time. Certain obligations
                                (including payment obligations and legal protections) survive termination.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">10. Disclaimers and Limitation of Liability</h2>
                            <p>
                                The Service is provided on an "as is" and "as available" basis to the fullest extent
                                allowed by law. KhataPlus is not liable for indirect, incidental, special,
                                consequential, or punitive damages, or for loss of profits, business, or data.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">11. Governing Law and Disputes</h2>
                            <p>
                                These Terms are governed by the laws of India. Subject to applicable law, disputes are
                                subject to the exclusive jurisdiction of courts in Assam, India.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">12. Contact</h2>
                            <p>
                                For legal or billing queries, contact us at{" "}
                                <a className="text-emerald-700 font-semibold" href="mailto:legal@khataplus.online">
                                    legal@khataplus.online
                                </a>.
                            </p>
                        </section>

                        <section className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100">
                            <div className="flex items-start gap-3">
                                <Scale className="text-emerald-600 mt-0.5" size={20} />
                                <div>
                                    <h3 className="text-xl font-bold text-zinc-900 mb-2">Acknowledgement</h3>
                                    <p className="text-zinc-600 mb-5">
                                        By continuing to use KhataPlus, you acknowledge that you have read and agreed
                                        to these Terms of Service.
                                    </p>
                                    <Link href="/">
                                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                            I Understand
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            <footer className="bg-zinc-900 text-white py-12 px-6 border-t border-zinc-800">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-3">
                        <Logo size={32} className="text-emerald-400" />
                        <span className="font-bold text-xl">KhataPlus</span>
                    </div>
                    <div className="text-zinc-500 text-sm">&copy; 2026 KhataPlus. All rights reserved.</div>
                </div>
            </footer>
        </div>
    )
}
