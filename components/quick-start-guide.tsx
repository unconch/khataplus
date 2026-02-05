"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, Circle, ArrowRight, Building2, Package, Users, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface QuickStartProps {
    orgId: string
    stats: {
        hasInventory: boolean
        hasCustomers: boolean
        hasSales: boolean
        isProfileComplete: boolean
    }
}

export function QuickStartGuide({ orgId, stats }: QuickStartProps) {
    const steps = [
        {
            title: "Business Profile",
            description: "Set your GSTIN and address",
            icon: Building2,
            href: "/home/settings",
            isComplete: stats.isProfileComplete
        },
        {
            title: "Add Products",
            description: "Build your inventory catalog",
            icon: Package,
            href: "/home/inventory",
            isComplete: stats.hasInventory
        },
        {
            title: "Add Customers",
            description: "Import or add regular clients",
            icon: Users,
            href: "/home/customers",
            isComplete: stats.hasCustomers
        },
        {
            title: "First Sale",
            description: "Create your first professional invoice",
            icon: ShoppingCart,
            href: "/home",
            isComplete: stats.hasSales
        }
    ]

    const completedCount = steps.filter(s => s.isComplete).length
    const progress = (completedCount / steps.length) * 100

    if (completedCount === steps.length) return null

    return (
        <Card className="border-primary/10 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CardHeader className="bg-primary/5 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg font-bold">Getting Started</CardTitle>
                        <CardDescription className="text-xs">Complete these steps to launch your business</CardDescription>
                    </div>
                    <div className="text-right">
                        <span className="text-xl font-black text-primary">{progress}%</span>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Ready</p>
                    </div>
                </div>
                <Progress value={progress} className="h-1.5 mt-4" />
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border/50">
                    {steps.map((step, idx) => (
                        <Link
                            key={step.title}
                            href={step.href}
                            className={cn(
                                "flex items-center justify-between p-4 transition-colors hover:bg-muted/50 group",
                                step.isComplete && "bg-muted/30"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                                    step.isComplete
                                        ? "bg-emerald-500/10 text-emerald-500"
                                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                )}>
                                    <step.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className={cn(
                                        "text-sm font-bold",
                                        step.isComplete ? "text-muted-foreground line-through" : "text-foreground"
                                    )}>
                                        {step.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{step.description}</p>
                                </div>
                            </div>
                            <div>
                                {step.isComplete ? (
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                ) : (
                                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
