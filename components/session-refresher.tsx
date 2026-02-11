"use client"

// SessionRefresher was previously used for Descope session management.
// With Clerk, session management is handled automatically by the ClerkProvider.
// This component is maintained as a no-op for backwards compatibility with any existing imports.

export function SessionRefresher() {
    return null
}
