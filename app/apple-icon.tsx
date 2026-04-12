import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: "transparent",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="140"
        height="140"
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="kp-logo-gradient" x1="10" y1="10" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#10B981" />
            <stop offset="1" stopColor="#059669" />
          </linearGradient>
        </defs>
        <rect x="40" y="30" width="70" height="80" rx="12" fill="#E2E8F0" />
        <rect x="30" y="40" width="75" height="75" rx="12" fill="#F1F5F9" />
        <rect x="10" y="15" width="90" height="90" rx="16" fill="#000000" opacity="0.05" transform="translate(4, 4)" />
        <rect x="10" y="10" width="90" height="90" rx="16" fill="url(#kp-logo-gradient)" />
        <path d="M10 26C10 17.1634 17.1634 10 26 10H30V100H26C17.1634 100 10 92.8366 10 84V26Z" fill="#059669" />
        <rect x="30" y="50" width="50" height="10" rx="5" fill="#FFFFFF" />
        <rect x="50" y="30" width="10" height="50" rx="5" fill="#FFFFFF" />
      </svg>
    </div>,
    { ...size }
  )
}
