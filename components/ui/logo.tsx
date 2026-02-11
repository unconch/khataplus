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
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn("", className)}
            {...props}
        >
            {/* Shadow - subtle drop shadow */}
            <path d="M8 26L26 26L28 9L10 9L8 26Z" fill="currentColor" fillOpacity="0.1" transform="translate(2, 2)" />

            {/* White Pages Thickness (Right and Bottom) */}
            {/* Bottom Thickness */}
            <path d="M7 25L25 25L27 7L25 6L25 24L7 24L7 25Z" fill="#e4e4e7" className="text-zinc-200 dark:text-zinc-700" fillOpacity="1" />
            {/* Side Thickness (Right side) */}
            <path d="M25 24L27 7L27 25L25 24Z" fill="#d4d4d8" className="text-zinc-300 dark:text-zinc-600" fillOpacity="1" />

            {/* Main Cover (Front Face) */}
            <path
                d="M5 5H23C24.1046 5 25 5.89543 25 7V23C25 24.1046 24.1046 25 23 25H5C3.89543 25 3 24.1046 3 23V7C3 5.89543 3.89543 5 5 5Z"
                fill="currentColor"
                className="text-emerald-500"
            />

            {/* Cover Gradient/Highlight (simulated with opacity) */}
            <rect x="3" y="5" width="22" height="20" rx="2" fill="white" fillOpacity="0.15" />
            {/* Spine Shade */}
            <path d="M3 7C3 5.89543 3.89543 5 5 5H6V25H5C3.89543 25 3 24.1046 3 23V7Z" fill="black" fillOpacity="0.1" />

            {/* 3D Embossed Plus Symbol */}
            {/* Shadow for depth */}
            <path d="M14 11V19" stroke="black" strokeOpacity="0.2" strokeWidth="4" strokeLinecap="round" transform="translate(1,1)" />
            <path d="M10 15H18" stroke="black" strokeOpacity="0.2" strokeWidth="4" strokeLinecap="round" transform="translate(1,1)" />
            {/* Main Plus */}
            <path d="M14 11V19" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <path d="M10 15H18" stroke="white" strokeWidth="4" strokeLinecap="round" />
        </svg>
    )
}

export function LogoText({ className }: { className?: string }) {
    return (
        <div className={cn("flex flex-col", className)}>
            <span className="text-xl font-black tracking-tighter leading-none">KHATA</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 leading-none">PLUS</span>
        </div>
    )
}
