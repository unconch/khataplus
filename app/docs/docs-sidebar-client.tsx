"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { GROUP_ORDER, GROUP_LABELS, DOC_ARTICLES } from "./docs-data"
import { useDocsNav } from "./docs-nav-provider"

export function DocsSidebarClient() {
  const pathname = usePathname()
  const { activeAnchor } = useDocsNav()
  const articleAnchors = [
    { id: "when-to-use", label: "When to Use This" },
    { id: "workflow", label: "Workflow" },
    { id: "steps", label: "Steps" },
    { id: "example", label: "Real Example" },
    { id: "issues", label: "Common Issues" },
  ]

  return (
    <aside className="hidden md:flex flex-col w-[260px] lg:w-[280px] shrink-0 border-r border-zinc-800 h-screen sticky top-0 overflow-y-auto pt-24 pb-12 px-6 scrollbar-none bg-zinc-950">
      <nav className="space-y-8">
        {GROUP_ORDER.map((group) => {
          const items = DOC_ARTICLES.filter((article) => article.group === group)
          if (items.length === 0) return null

          return (
            <div key={group} className="space-y-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 pl-2">{GROUP_LABELS[group]}</h4>
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
                            ? "bg-zinc-800/80 text-white font-medium shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                        )}
                      >
                        <span className="truncate">{item.title}</span>
                      </Link>

                      {isActive && (
                        <div className="mt-1 ml-4 border-l border-zinc-800 pl-3 space-y-2 mb-4 animate-in fade-in slide-in-from-top-1 duration-300">
                          {articleAnchors.map((anchor) => (
                            <a
                              key={anchor.id}
                              href={`#${anchor.id}`}
                              className={cn(
                                "block text-[13px] transition-all duration-200 py-1 relative group/anchor",
                                activeAnchor === anchor.id
                                  ? "text-emerald-400 font-medium"
                                  : "text-zinc-500 hover:text-zinc-300"
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
