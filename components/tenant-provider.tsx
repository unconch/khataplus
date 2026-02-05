"use client"

import React, { createContext, useContext, ReactNode } from "react"
import { Organization } from "@/lib/types"

interface TenantContextType {
    tenant: Organization | null
    isMultiTenant: boolean
}

const TenantContext = createContext<TenantContextType>({
    tenant: null,
    isMultiTenant: false,
})

export function TenantProvider({
    children,
    tenant
}: {
    children: ReactNode,
    tenant: Organization | null
}) {
    return (
        <TenantContext.Provider value={{ tenant, isMultiTenant: !!tenant }}>
            {children}
        </TenantContext.Provider>
    )
}

export function useTenant() {
    return useContext(TenantContext)
}
