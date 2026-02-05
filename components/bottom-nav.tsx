"use client"

import Link from "next/link"
import { Plus } from "lucide-react"

import { SystemSettings, Profile } from "@/lib/types"

type OrgRole = "admin" | "manager" | "staff"

interface BottomNavProps {
  role: OrgRole | Profile["role"]
  settings: SystemSettings
}

export function BottomNav({ role, settings }: BottomNavProps) {
  const isStaff = role === "staff"
  const canSell = !isStaff || settings.allow_staff_sales

  if (!canSell) return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Link href="/home/sales">
        <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl shadow-primary/40 active:scale-95 transition-transform hover:scale-105">
          <Plus className="h-8 w-8" />
        </div>
      </Link>
    </div>
  )
}
