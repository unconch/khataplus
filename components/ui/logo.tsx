"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface LogoProps extends React.SVGProps<SVGSVGElement> {
    size?: number
    className?: string
}

export function Logo({ size = 40, className, ...props }: LogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("text-primary", className)}
            {...props}
        >
            <rect x="15" y="12" width="60" height="76" rx="4" fill="currentColor" opacity="0.15" />
            <rect x="20" y="8" width="60" height="76" rx="4" fill="currentColor" opacity="0.3" />
            <rect x="25" y="4" width="60" height="76" rx="4" fill="currentColor" />
            <rect x="25" y="4" width="8" height="76" rx="2" fill="currentColor" opacity="0.7" />
            <rect x="45" y="36" width="30" height="8" rx="2" fill="white" />
            <rect x="56" y="25" width="8" height="30" rx="2" fill="white" />
            <rect x="38" y="58" width="40" height="2" rx="1" fill="white" opacity="0.5" />
            <rect x="38" y="64" width="35" height="2" rx="1" fill="white" opacity="0.4" />
            <rect x="38" y="70" width="40" height="2" rx="1" fill="white" opacity="0.3" />
        </svg>
    )
}

export function LogoText({ className }: { className?: string }) {
    return (
        <div className={cn("flex flex-col", className)}>
            <span className="text-xl font-black tracking-tighter leading-none">KHATA</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/40 leading-none">PLUS</span>
        </div>
    )
}
