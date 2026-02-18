"use client"

import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react"

export function SiteFooter() {
    return (
        <footer className="bg-white text-zinc-900 pt-24 pb-12 px-6 border-t border-zinc-100">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-xl italic">K</div>
                            <span className="text-2xl font-bold tracking-tight">KhataPlus</span>
                        </Link>
                        <p className="text-zinc-500 max-w-sm mb-8 leading-relaxed">
                            Empowering millions of Indian businesses with simple, powerful, and secure digital tools. Made with ❤️ in NorthEast India.
                        </p>
                        <div className="flex gap-4">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all duration-300">
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-6">Product</h4>
                        <ul className="space-y-4 text-zinc-500">
                            <li><a href="#features" className="hover:text-emerald-600 transition-colors">Features</a></li>
                            <li><Link href="/pricing" className="hover:text-emerald-600 transition-colors">Pricing</Link></li>
                            <li><a href="#" className="hover:text-emerald-600 transition-colors">Testimonials</a></li>
                            <li><a href="#" className="hover:text-emerald-600 transition-colors">Roadmap</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-lg mb-6">Contact</h4>
                        <ul className="space-y-4 text-zinc-500">
                            <li className="flex items-center gap-3"><Mail size={16} /> support@khataplus.com</li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-zinc-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-400 text-sm">
                    <div className="text-center md:text-left">
                        <p>&copy; {new Date().getFullYear()} KhataPlus Inc. All rights reserved.</p>
                        <p className="text-zinc-500 text-xs mt-1">
                            Legal Business Name: <span className="font-semibold text-zinc-700">UNMESH BAISHYA</span>
                        </p>
                    </div>
                    <div className="flex gap-6">
                        <Link href="/privacy" className="hover:text-zinc-900 transition-colors">Privacy Policy</Link>
                        <Link href="/terms-and-condition" className="hover:text-zinc-900 transition-colors">Terms of Service</Link>
                        <Link href="/legal/cancellation-refund" className="hover:text-zinc-900 transition-colors">Cancellation & Refund</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
