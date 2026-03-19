import Link from "next/link"
import { ArrowLeft, ReceiptText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/ui/logo"

export default function CancellationRefundPolicyPage() {
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
                    <div className="mb-12">
                        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 text-emerald-600">
                            <ReceiptText size={32} />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                            Cancellation & Refund Policy
                        </h1>
                        <p className="text-zinc-500 text-lg">Last Updated: February 18, 2026</p>
                    </div>

                    <div className="space-y-10 text-zinc-700 leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">1. Free Trial Period</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>30-Day Trial:</strong> All new organizations receive a 30-day free trial with full access to core features.</li>
                                <li><strong>No Credit Card Required:</strong> You can explore KhataPlus without providing payment information.</li>
                                <li><strong>Cancellation During Trial:</strong> You may cancel at any time during the trial period with no charges. Simply stop using the service or delete your organization from Settings.</li>
                                <li><strong>No Refunds for Trial:</strong> Since the trial is free, no refunds apply.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">2. Paid Subscriptions</h2>
                            <h3 className="text-xl font-bold text-zinc-900 mb-2">2.1 Subscription Plans</h3>
                            <ul className="list-disc pl-6 space-y-2 mb-4">
                                <li><strong>Starter Plan:</strong> ₹299/month</li>
                                <li><strong>Pro Plan:</strong> ₹999/month</li>
                                <li><strong>Custom Enterprise:</strong> Contact sales for pricing</li>
                            </ul>

                            <h3 className="text-xl font-bold text-zinc-900 mb-2">2.2 Billing Cycle</h3>
                            <ul className="list-disc pl-6 space-y-2 mb-4">
                                <li>Subscriptions are billed monthly or annually based on your selection.</li>
                                <li>Payment is charged at the beginning of each billing cycle.</li>
                                <li>Auto-renewal occurs unless you cancel before the renewal date.</li>
                            </ul>

                            <h3 className="text-xl font-bold text-zinc-900 mb-2">2.3 Cancellation of Paid Subscriptions</h3>
                            <ul className="list-disc pl-6 space-y-2 mb-4">
                                <li><strong>How to Cancel:</strong> Go to <strong>Settings → Billing → Cancel Subscription</strong> in your dashboard.</li>
                                <li><strong>Effect of Cancellation:</strong> Your subscription will remain active until the end of the current billing period. After that, your account will be downgraded to the Free tier (read-only access with data retention for 90 days).</li>
                                <li><strong>No Partial Refunds:</strong> If you cancel mid-cycle, you will NOT receive a refund for the unused portion of the subscription. You retain access until the period ends.</li>
                            </ul>

                            <h3 className="text-xl font-bold text-zinc-900 mb-2">2.4 Refund Policy for Subscriptions</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>7-Day Money-Back Guarantee:</strong> If you are not satisfied with a paid plan, you may request a full refund within <strong>7 days of your first payment</strong> for that plan.</li>
                                <li><strong>How to Request:</strong> Email support@khataplus.online with your organization name and registered email. Refunds are processed within 7-10 business days.</li>
                                <li><strong>Renewals Not Eligible:</strong> Refunds apply only to the first payment of a new subscription. Renewal charges are non-refundable.</li>
                                <li><strong>Abuse Prevention:</strong> We reserve the right to deny refund requests if there is evidence of abuse (e.g., repeated sign-up and refund cycles).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">3. Add-On Services</h2>
                            <h3 className="text-xl font-bold text-zinc-900 mb-2">3.1 Available Add-Ons</h3>
                            <ul className="list-disc pl-6 space-y-2 mb-4">
                                <li>WhatsApp Automation: ₹199/month</li>
                                <li>Advanced GST Reports: ₹149/month</li>
                                <li>Multi-Location Inventory: ₹249/month</li>
                                <li>AI Sales Forecasting: ₹299/month</li>
                            </ul>

                            <h3 className="text-xl font-bold text-zinc-900 mb-2">3.2 Cancellation of Add-Ons</h3>
                            <ul className="list-disc pl-6 space-y-2">
                                <li>Add-ons can be canceled anytime from <strong>Settings → Add-Ons</strong>.</li>
                                <li>Cancellation takes effect at the end of the current billing cycle.</li>
                                <li><strong>No Refunds:</strong> Add-on charges are non-refundable once activated, even if canceled before the cycle ends.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">4. Pioneer Partner Program (Lifetime Deal)</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Eligibility:</strong> First 1,000 sign-ups only.</li>
                                <li><strong>Benefits:</strong> Lifetime access to Pro features at no cost.</li>
                                <li><strong>No Refunds, No Cancellations:</strong> This is a one-time promotional benefit and cannot be refunded, transferred, or canceled. If you delete your organization, you forfeit the Pioneer status permanently.</li>
                                <li><strong>Fair Use Policy:</strong> We reserve the right to revoke Pioneer status in cases of abuse (e.g., creating 50+ fake organizations to claim benefits).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">5. Data Retention After Cancellation</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>90-Day Grace Period:</strong> After your subscription expires or you cancel, your data remains accessible (read-only) for 90 days.</li>
                                <li><strong>Data Export:</strong> You can export your data as CSV/Excel anytime from <strong>Settings → Export Data</strong>.</li>
                                <li><strong>Permanent Deletion:</strong> After 90 days, all data is permanently deleted via crypto-shredding (encryption keys destroyed, data becomes mathematically unrecoverable). This process is irreversible.</li>
                                <li><strong>Voluntary Deletion:</strong> You can request immediate deletion by contacting support, but this action is permanent and cannot be undone.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">6. Payment Failures & Suspension</h2>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Failed Payments:</strong> If your payment method fails, you will receive email notifications for 7 days.</li>
                                <li><strong>Account Suspension:</strong> After 7 days of failed payment, your account will be suspended (read-only access).</li>
                                <li><strong>Reactivation:</strong> Update your payment method in <strong>Settings → Billing</strong> to reactivate immediately.</li>
                                <li><strong>Permanent Deletion:</strong> If payment failure persists for 30 days, your organization will be permanently deleted (same 90-day retention does NOT apply in this case).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">7. Exceptions & Special Circumstances</h2>
                            <h3 className="text-xl font-bold text-zinc-900 mb-2">7.1 Technical Issues Caused by Us</h3>
                            <p className="mb-4">
                                If KhataPlus experiences a service outage or critical bug that prevents you from using the platform for <strong>more than 48 consecutive hours</strong>, you may request a pro-rated refund for the affected period. Submit a ticket to support@khataplus.online with details.
                            </p>

                            <h3 className="text-xl font-bold text-zinc-900 mb-2">7.2 Fraudulent Transactions</h3>
                            <p className="mb-4">
                                If your payment method was used without your authorization, contact us immediately at support@khataplus.online. We will investigate and process a refund if fraud is confirmed.
                            </p>

                            <h3 className="text-xl font-bold text-zinc-900 mb-2">7.3 Duplicate Charges</h3>
                            <p>
                                If you are accidentally charged twice for the same subscription period, contact us within 14 days for a full refund of the duplicate charge.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">8. Contact Us</h2>
                            <p className="mb-2">For cancellation requests, refund inquiries, or billing issues, contact:</p>
                            <ul className="list-disc pl-6 space-y-2">
                                <li><strong>Email:</strong> support@khataplus.online</li>
                                <li><strong>Response Time:</strong> Within 24-48 hours (business days)</li>
                            </ul>
                        </section>

                        <section className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100">
                            <h2 className="text-2xl font-bold text-zinc-900 mb-3">9. Policy Changes</h2>
                            <p>
                                We may update this policy from time to time. Changes will be posted on this page with an updated "Last Updated" date. Continued use of KhataPlus after changes constitutes acceptance of the updated policy.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    )
}
