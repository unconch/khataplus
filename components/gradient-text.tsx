"use client"



interface GradientTextProps {
    children: React.ReactNode
    className?: string
    colors?: string[]
    animationSpeed?: number
    showBorder?: boolean
}

export function GradientText({
    children,
    className = "",
    colors = ["#10b981", "#14b8a6", "#f59e0b", "#10b981"], // Emerald, Teal, Amber, Loop back to Emerald
    animationSpeed = 8,
    showBorder = false
}: GradientTextProps) {
    const gradientColors = colors.join(", ")

    return (
        <div className={`relative flex items-center max-w-fit mx-auto md:mx-0 ${className}`}>
            <div
                className="relative z-10 bg-clip-text text-transparent bg-[length:300%_auto] animate-gradient-x"
                style={{
                    backgroundImage: `linear-gradient(to right, ${gradientColors})`,
                    animationDuration: `${animationSpeed}s`
                }}
            >
                {children}
            </div>

            {showBorder && (
                <div
                    className="absolute -inset-2 rounded-lg z-0 opacity-20 blur-xl bg-[length:300%_auto] animate-gradient-x"
                    style={{
                        backgroundImage: `linear-gradient(to right, ${gradientColors})`,
                        animationDuration: `${animationSpeed}s`
                    }}
                />
            )}
        </div>
    )
}
