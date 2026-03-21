export function useMainAuthUrls() {
  // Keep auth links relative so SSR and CSR markup always match.
  return {
    signInUrl: "/auth/login",
    signUpUrl: "/auth/sign-up",
  }
}
