"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PosThemeSwitch() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    setDark(root.classList.contains("dark"))
  }, [])

  const toggle = () => {
    const root = document.documentElement
    const next = !dark
    setDark(next)
    root.classList.toggle("dark", next)
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={toggle} className="gap-2">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {dark ? "Light" : "Dark"}
    </Button>
  )
}
