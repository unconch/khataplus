import { PublicShopProfile } from "@/components/public-shop-profile"
import { notFound } from "next/navigation"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const shopName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

    return {
        title: `${shopName} | KhataPlus Verified Shop`,
        description: `Visit ${shopName}'s digital profile on KhataPlus. View contact details, location, and order via WhatsApp directly.`,
    }
}

export default async function ShopPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    // In a real app, you'd fetch this from the DB using the slug
    // For demo/scale, we mimic the shop name from the slug
    const shopName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

    return (
        <PublicShopProfile
            shopName={shopName}
            category="Kirana & General Store"
            city="Mumbai, Maharashtra"
            phone="+91 99999 00000"
        />
    )
}
