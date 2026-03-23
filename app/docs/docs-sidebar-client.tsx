"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { GROUP_ORDER, GROUP_LABELS, DOC_ARTICLES } from "./docs-data"
import { useDocsNav } from "./docs-nav-provider"

export function DocsSidebarClient() {
  const pathname = usePathname()
  const { activeAnchor, theme } = useDocsNav()
  const isLight = theme === "light"
  const articleAnchors = [
    { id: "when-to-use", label: "When to Use This" },
    { id: "workflow", label: "Workflow" },
    { id: "steps", label: "Steps" },
    { id: "example", label: "Real Example" },
    { id: "issues", label: "Common Issues" },
  ]

  return (
    <aside className={cn(
      "hidden md:flex flex-col w-[260px] lg:w-[280px] shrink-0 border-r h-screen sticky top-0 overflow-y-auto pt-24 pb-12 px-6 scrollbar-none",
      isLight ? "border-zinc-200 bg-white/70" : "border-zinc-800 bg-zinc-950"
    )}>
      <nav className="space-y-8">
        {GROUP_ORDER.map((group) => {
          const items = DOC_ARTICLES.filter((article) => article.group === group)
          if (items.length === 0) return null

          return (
            <div key={group} className="space-y-3">
              <h4 className={cn(
                "pl-2 text-[11px] font-semibold uppercase tracking-wider",
                isLight ? "text-zinc-500" : "text-zinc-500"
              )}>{GROUP_LABELS[group]}</h4>
              <div className="space-y-0.5 block">
                {items.map((item) => {
                  const href = `/docs/${item.slug}`
                  const isActive = pathname === href

                  return (
                    <div key={item.slug} className="space-y-1">
                      <Link
                        href={href}
                        className={cn(
                          "group flex items-center justify-between py-2 px-3 rounded-lg text-sm transition-all duration-200",
                          isActive
                            ? (isLight ? "bg-zinc-900 text-white font-medium shadow-sm" : "bg-zinc-800/80 text-white font-medium shadow-sm")
                            : (isLight ? "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900")
                        )}
                      >
                        <span className="truncate">{item.title}</span>
                      </Link>

                      {isActive && (
                        <div className={cn(
                          "mt-1 mb-4 ml-4 space-y-2 border-l pl-3 animate-in fade-in slide-in-from-top-1 duration-300",
                          isLight ? "border-zinc-200" : "border-zinc-800"
                        )}>
                          {articleAnchors.map((anchor) => (
                            <a
                              key={anchor.id}
                              href={`#${anchor.id}`}
                              className={cn(
                                "block text-[13px] transition-all duration-200 py-1 relative group/anchor",
                                activeAnchor === anchor.id
                                  ? "text-emerald-400 font-medium"
                                  : (isLight ? "text-zinc-500 hover:text-zinc-800" : "text-zinc-500 hover:text-zinc-300")
                              )}
                            >
                              {anchor.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
