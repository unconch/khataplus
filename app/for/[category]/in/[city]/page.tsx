import { PSEOLandingPage } from "@/components/pseo-landing-page"

export async function generateMetadata({ params }: { params: Promise<{ category: string, city: string }> }) {
    const { category, city } = await params

    const formattedCategory = (category || "retail").split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    const formattedCity = (city || "india").split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

    return {
        title: `Best Billing App for ${formattedCategory}s in ${formattedCity} | KhataPlus`,
        description: `Are you a ${formattedCategory} owner in ${formattedCity}? Start digitizing your shop with KhataPlus. GST billing, Udhaar tracking, and inventory management in one app.`,
    }
}

export default async function PSEOPage({ params }: { params: Promise<{ category: string, city: string }> }) {
    const { category, city } = await params
    return <PSEOLandingPage category={category} city={city} />
}
