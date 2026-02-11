import { ImageResponse } from "next/og"

export const size = {
    width: 32,
    height: 32,
}
export const contentType = "image/png"

// 3D Isometric-ish Book
export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "transparent",
                }}
            >
                <svg
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Shadow */}
                    <path d="M8 26L26 26L28 9L10 9L8 26Z" fill="black" opacity="0.2" transform="translate(2, 2)" />

                    {/* White Pages Thickness (Right and Bottom) */}
                    {/* Bottom Thickness */}
                    <path d="M7 25L25 25L27 7L25 6L25 24L7 24L7 25Z" fill="#e4e4e7" />
                    {/* Side Thickness (Right side) */}
                    <path d="M25 24L27 7L27 25L25 24Z" fill="#d4d4d8" />
                    {/* Paper Lines on Side */}
                    <path d="M25.5 22L26.5 22.5" stroke="#a1a1aa" strokeWidth="0.5" />
                    <path d="M25.5 19L26.5 19.5" stroke="#a1a1aa" strokeWidth="0.5" />
                    <path d="M25.5 16L26.5 16.5" stroke="#a1a1aa" strokeWidth="0.5" />

                    {/* Main Cover (Front Face) */}
                    <path
                        d="M5 5H23C24.1046 5 25 5.89543 25 7V23C25 24.1046 24.1046 25 23 25H5C3.89543 25 3 24.1046 3 23V7C3 5.89543 3.89543 5 5 5Z"
                        fill="#10b981" // Emerald 500
                    />

                    {/* Cover Gradient/Highlight (simulated with opacity) */}
                    <rect x="3" y="5" width="22" height="20" rx="2" fill="white" fillOpacity="0.1" />
                    <path d="M3 7C3 5.89543 3.89543 5 5 5H6V25H5C3.89543 25 3 24.1046 3 23V7Z" fill="black" fillOpacity="0.1" /> {/* Spine shadow */}

                    {/* 3D Embossed Plus Symbol */}
                    {/* Shadow for depth */}
                    <path d="M14 11V19" stroke="#047857" strokeWidth="4" strokeLinecap="round" transform="translate(1,1)" />
                    <path d="M10 15H18" stroke="#047857" strokeWidth="4" strokeLinecap="round" transform="translate(1,1)" />
                    {/* Main Plus */}
                    <path d="M14 11V19" stroke="white" strokeWidth="4" strokeLinecap="round" />
                    <path d="M10 15H18" stroke="white" strokeWidth="4" strokeLinecap="round" />
                </svg>
            </div>
        ),
        { ...size }
    )
}
