export type AndroidReleaseEntry = {
  version: string
  date: string
  summary: string
  accent: string
  notes: string[]
}

export const androidApkUrl =
  "https://github.com/unconch/khataplus/releases/download/android-latest/khataplus-native-debug.apk"

export const androidReleaseEntries: AndroidReleaseEntry[] = [
  {
    version: "1.0.2",
    date: "April 11, 2026",
    summary: "Cleaner download page and faster start flow.",
    accent: "bg-emerald-100 text-emerald-700",
    notes: [
      "Kept the top download card front and center.",
      "Added Play Store-style collapsible version cards below.",
      "Simplified the Android landing page to reduce clutter.",
      "Kept the APK link stable on the android branch release asset.",
    ],
  },
  {
    version: "1.0.1",
    date: "April 10, 2026",
    summary: "Native auth polish and app shell improvements.",
    accent: "bg-sky-100 text-sky-700",
    notes: [
      "Matched the Android auth background and spacing to the web design.",
      "Added the FastLoad setting to boot into Sales faster.",
      "Aligned the native logo treatment with the KhataPlus brand mark.",
      "Improved the bottom nav and tablet rail experience.",
    ],
  },
  {
    version: "1.0.0",
    date: "Initial native release",
    summary: "First native Android APK published.",
    accent: "bg-violet-100 text-violet-700",
    notes: [
      "Introduced the native Kotlin + Compose app shell.",
      "Added OTP-based login and signup for Android.",
      "Connected the app to the KhataPlus session flow.",
      "Published the first downloadable APK from the android branch.",
    ],
  },
]

export const latestAndroidRelease = androidReleaseEntries[0]
