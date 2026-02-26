#!/usr/bin/env node
/**
 * Build Descope sign-in/sign-up flow JSON files and zip them into one bundle.
 *
 * Usage:
 *   node scripts/build-descope-flow-bundle.mjs path/to/sign-up-or-in.json
 */

import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"

function runNodeScript(scriptPath, args) {
  execFileSync(process.execPath, [scriptPath, ...args], { stdio: "inherit" })
}

function main() {
  const inputPath = process.argv[2]
  if (!inputPath) {
    console.error("Missing input file.\nUsage: node scripts/build-descope-flow-bundle.mjs <exported-flow.json>")
    process.exit(1)
  }

  const repoRoot = process.cwd()
  const generator = path.join(repoRoot, "scripts", "build-descope-flow-files.mjs")
  runNodeScript(generator, [inputPath])

  const outDir = path.join(repoRoot, "descope-import")
  const signIn = path.join(outDir, "sign-in.json")
  const signUp = path.join(outDir, "sign-up.json")
  const zipPath = path.join(outDir, "descope-flows-bundle.zip")

  if (!fs.existsSync(signIn) || !fs.existsSync(signUp)) {
    console.error("Missing generated flow files. Expected sign-in.json and sign-up.json.")
    process.exit(1)
  }

  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath)

  // Use PowerShell Compress-Archive for Windows compatibility.
  execFileSync(
    "powershell.exe",
    [
      "-NoProfile",
      "-Command",
      `Compress-Archive -Path '${signIn}','${signUp}' -DestinationPath '${zipPath}' -Force`,
    ],
    { stdio: "inherit" }
  )

  console.log(`Created zip bundle:\n- ${zipPath}`)
}

main()

