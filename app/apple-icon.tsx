import { ImageResponse } from "next/og"

export const size = {
    width: 180,
    height: 180,
}
export const contentType = "image/png"

// High-res 3D Book
export default function AppleIcon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#09090b",
                }}
            >
                <svg
                    width="140"
                    height="140"
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    {/* Shadow */}
                    <path d="M8 26L26 26L28 9L10 9L8 26Z" fill="black" opacity="0.3" transform="translate(1, 1)" />

                    {/* White Pages Thickness (Right and Bottom) */}
                    <path d="M7 25L25 25L27 7L25 6L25 24L7 24L7 25Z" fill="#e4e4e7" />
                    <path d="M25 24L27 7L27 25L25 24Z" fill="#d4d4d8" />

                    {/* Mock Lines */}
                    <path d="M26 21L26.8 21.5" stroke="#a1a1aa" strokeWidth="0.5" />
                    <path d="M26 17L26.8 17.5" stroke="#a1a1aa" strokeWidth="0.5" />
                    <path d="M26 13L26.8 13.5" stroke="#a1a1aa" strokeWidth="0.5" />

                    {/* Main Cover (Front Face) */}
                    <path
                        d="M5 5H23C24.1046 5 25 5.89543 25 7V23C25 24.1046 24.1046 25 23 25H5C3.89543 25 3 24.1046 3 23V7C3 5.89543 3.89543 5 5 5Z"
                        fill="#10b981"
                    />

                    {/* Spine Highlight */}
                    <path d="M3 7C3 5.89543 3.89543 5 5 5H8V25H5C3.89543 25 3 24.1046 3 23V7Z" fill="url(#spineGrad)" fillOpacity="0.4" />

                    {/* 3D Plus */}
                    <path d="M14 11V19" stroke="#065f46" strokeWidth="4" strokeLinecap="round" transform="translate(0.5,0.5)" />
                    <path d="M10 15H18" stroke="#065f46" strokeWidth="4" strokeLinecap="round" transform="translate(0.5,0.5)" />

                    <path d="M14 11V19" stroke="white" strokeWidth="4" strokeLinecap="round" />
                    <path d="M10 15H18" stroke="white" strokeWidth="4" strokeLinecap="round" />

                    <defs>
                        <linearGradient id="spineGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="black" />
                            <stop offset="100%" stopColor="transparent" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
        ),
        { ...size }
    )
}
