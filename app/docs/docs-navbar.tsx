"use client"

import { Navbar } from "@/components/landing-page/index"
import { useDocsNav } from "./docs-nav-provider"

interface DocsNavbarProps {
    isAuthenticated: boolean
    orgSlug?: string | null
    isGuest?: boolean
}

export function DocsNavbar({ isAuthenticated, orgSlug, isGuest }: DocsNavbarProps) {
    const { theme } = useDocsNav()

    return (
        <Navbar
            isAuthenticated={isAuthenticated}
            lightMode={theme === "light"}
            orgSlug={orgSlug}
            isGuest={isGuest}
            forcePublicActions={true}
        />
    )
}
