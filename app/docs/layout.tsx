import { DocsNavProvider } from "./docs-nav-provider"

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsNavProvider>{children}</DocsNavProvider>
}
