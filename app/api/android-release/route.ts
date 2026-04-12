import { NextResponse } from "next/server"
import { androidApkUrl, androidReleaseEntries, latestAndroidRelease } from "@/app/android/release-data"

const githubReleaseApi = "https://api.github.com/repos/unconch/khataplus/releases/tags/android-latest"
const fallbackReleaseUrl = "https://github.com/unconch/khataplus/releases/tag/android-latest"

type AndroidReleaseManifest = {
  version?: string
  versionCode?: number
  date?: string
  downloadUrl?: string
  releaseUrl?: string
  notes?: string[]
}

type GithubReleaseAsset = {
  name?: string
  browser_download_url?: string
}

export async function GET() {
  try {
    const releaseResponse = await fetch(githubReleaseApi, {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "KhataPlus-Android-Update-Checker",
      },
    })

    if (releaseResponse.ok) {
      const release = await releaseResponse.json()
      const manifestAsset = Array.isArray(release.assets)
        ? (release.assets as GithubReleaseAsset[]).find((asset) => asset.name === "android-release.json")
        : null

      if (manifestAsset?.browser_download_url) {
        const manifestResponse = await fetch(manifestAsset.browser_download_url, {
          cache: "no-store",
        })

        if (manifestResponse.ok) {
          const manifest = (await manifestResponse.json()) as AndroidReleaseManifest
          const latestRelease = {
            ...latestAndroidRelease,
            version: manifest.version ?? latestAndroidRelease.version,
            date: manifest.date ?? latestAndroidRelease.date,
            downloadUrl: manifest.downloadUrl ?? androidApkUrl,
            releaseUrl: manifest.releaseUrl ?? fallbackReleaseUrl,
            notes: manifest.notes ?? latestAndroidRelease.notes,
          }

          return NextResponse.json({
            latestRelease,
            releases: androidReleaseEntries.map((entry) => ({
              ...entry,
              downloadUrl: latestRelease.downloadUrl,
              releaseUrl: latestRelease.releaseUrl,
            })),
          })
        }
      }
    }
  } catch {
    // Fall back to the bundled release list below.
  }

  return NextResponse.json({
    latestRelease: {
      ...latestAndroidRelease,
      downloadUrl: androidApkUrl,
      releaseUrl: fallbackReleaseUrl,
    },
    releases: androidReleaseEntries.map((entry) => ({
      ...entry,
      downloadUrl: androidApkUrl,
      releaseUrl: fallbackReleaseUrl,
    })),
  })
}
