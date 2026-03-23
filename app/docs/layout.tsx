import { DocsNavProvider } from "./docs-nav-provider"
import { DocsThemeShell } from "./docs-theme-shell"

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DocsNavProvider>
      <DocsThemeShell>{children}</DocsThemeShell>
    </DocsNavProvider>
  )
}
