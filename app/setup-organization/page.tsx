import { redirect } from "next/navigation"
import { session } from "@descope/nextjs-sdk/server"
import { OnboardingWizard } from "@/components/onboarding-wizard"
import { getUserOrganizations } from "@/lib/data"

export default async function SetupOrganizationPage() {
    const sessionRes = await session()
    const userId = sessionRes?.token?.sub

    if (!userId) {
        redirect("/auth/login")
    }

    const userOrgs = await getUserOrganizations(userId)
    if (userOrgs.length > 0) {
        redirect("/dashboard")
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
            {/* Background Aesthetics */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 -right-4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <div className="w-full max-w-xl relative z-10 py-12">
                <OnboardingWizard userId={userId} />
            </div>
        </div>
    )
}
