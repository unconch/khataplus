"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, X, Receipt, Users, ShoppingCart, ArrowRight, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"

interface SearchDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

interface SearchResult {
    type: "customer" | "sale"
    id: string
    title: string
    subtitle: string
    href: string
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!query.trim()) {
            setResults([])
            return
        }

        const search = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
                if (res.ok) {
                    const data = await res.json()
                    setResults(data.results || [])
                }
            } catch (e) {
                console.error("Search error:", e)
            } finally {
                setLoading(false)
            }
        }

        const debounce = setTimeout(search, 300)
        return () => clearTimeout(debounce)
    }, [query])

    const handleClose = () => {
        setQuery("")
        setResults([])
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
                <VisuallyHidden>
                    <DialogTitle>Search</DialogTitle>
                </VisuallyHidden>
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b">
                    <Search size={20} className="text-muted-foreground flex-shrink-0" />
                    <input
                        type="text"
                        placeholder="Search customers, sales..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground"
                        autoFocus
                    />
                    {query && (
                        <button onClick={() => setQuery("")} className="p-1 hover:bg-muted rounded">
                            <X size={16} className="text-muted-foreground" />
                        </button>
                    )}
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 size={24} className="animate-spin text-muted-foreground" />
                        </div>
                    ) : results.length > 0 ? (
                        <div className="py-2">
                            {results.map((result) => (
                                <Link
                                    key={`${result.type}-${result.id}`}
                                    href={result.href}
                                    onClick={handleClose}
                                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted transition-colors"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${result.type === "customer"
                                        ? "bg-blue-100 dark:bg-blue-900/30"
                                        : "bg-emerald-100 dark:bg-emerald-900/30"
                                        }`}>
                                        {result.type === "customer" ? (
                                            <Users size={18} className="text-blue-600 dark:text-blue-400" />
                                        ) : (
                                            <Receipt size={18} className="text-emerald-600 dark:text-emerald-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{result.title}</p>
                                        <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
                                    </div>
                                    <ArrowRight size={16} className="text-muted-foreground flex-shrink-0" />
                                </Link>
                            ))}
                        </div>
                    ) : query ? (
                        <div className="py-12 text-center text-muted-foreground">
                            <p className="text-sm">No results found for "{query}"</p>
                        </div>
                    ) : (
                        <div className="py-12 text-center text-muted-foreground">
                            <Search size={32} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Search for customers or sales</p>
                        </div>
                    )}
                </div>

                {/* Quick Links */}
                <div className="border-t p-3 bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2 px-1">Quick Links</p>
                    <div className="flex gap-2">
                        <Link
                            href="/home/customers"
                            onClick={handleClose}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-background border text-sm font-medium hover:bg-muted transition-colors"
                        >
                            <Users size={14} />
                            Customers
                        </Link>
                        <Link
                            href="/home/sales"
                            onClick={handleClose}
                            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-background border text-sm font-medium hover:bg-muted transition-colors"
                        >
                            <ShoppingCart size={14} />
                            Sales
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
