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
    // if (userOrgs.length > 0) {
    //     redirect("/dashboard")
    // }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <div className="w-full max-w-lg">
                <OnboardingWizard userId={userId} />
            </div>
        </div>
    )
}
