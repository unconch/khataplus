import { MetadataRoute } from 'next'
import { sql } from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://khataplus.com'

    // Core routes
    const routes = [
        '',
        '/pricing',
        '/auth/login',
        '/auth/sign-up',
        '/beta',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // Fetch dynamic pSEO data from DB
    // By using the DB, any new city added in Admin Panel immediately appears here.
    const cities = await sql`SELECT slug FROM pseo_cities WHERE enabled = true` as { slug: string }[]
    const categories = await sql`SELECT slug FROM pseo_categories WHERE enabled = true` as { slug: string }[]

    // Generate pSEO routes
    const pseoRoutes = []

    for (const city of cities) {
        for (const cat of categories) {
            pseoRoutes.push({
                url: `${baseUrl}/for/${cat.slug}/in/${city.slug}`,
                lastModified: new Date(),
                changeFrequency: 'monthly' as const,
                priority: 0.7,
            })
        }
    }

    // Sample Shop routes (Dynamic in future)
    const shopRoutes = [
        {
            url: `${baseUrl}/shop/jain-general-store`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.6,
        }
    ]

    return [...routes, ...pseoRoutes, ...shopRoutes]
}
