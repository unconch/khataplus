const domain = process.env.AUTH0_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "")
const appBaseUrl = process.env.APP_BASE_URL?.replace(/\/$/, "")

export const isAuth0Configured =
  Boolean(domain) &&
  Boolean(process.env.AUTH0_CLIENT_ID) &&
  Boolean(process.env.AUTH0_CLIENT_SECRET) &&
  Boolean(process.env.AUTH0_SECRET) &&
  Boolean(appBaseUrl)

// Auth0 package is optional in this project setup.
// Keep a stable export shape for callers that may import this module.
export const auth0 = null

