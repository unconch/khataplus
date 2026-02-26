#!/usr/bin/env node
/**
 * Build Descope import files for dedicated sign-in and sign-up flows
 * from a single exported flow JSON (usually sign-up-or-in).
 *
 * Usage:
 *   node scripts/build-descope-flow-files.mjs path/to/sign-up-or-in.json
 */

import fs from "node:fs"
import path from "node:path"

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8")
  return JSON.parse(raw)
}

function resolvePayload(input) {
  if (input?.flow && Array.isArray(input?.screens)) {
    return { flow: input.flow, screens: input.screens }
  }
  if (input?.data?.flow && Array.isArray(input?.data?.screens)) {
    return { flow: input.data.flow, screens: input.data.screens }
  }
  throw new Error("Unsupported export format. Expected { flow, screens } or { data: { flow, screens } }")
}

function withFlowIdentity(baseFlow, flowId, name, description) {
  const next = { ...baseFlow }

  // Preserve existing flow schema keys while forcing identity fields where present.
  if ("id" in next) next.id = flowId
  if ("flowId" in next) next.flowId = flowId
  if ("name" in next) next.name = name
  if ("description" in next) next.description = description

  // If keys don't exist in exported object, still add common ones.
  if (!("name" in next)) next.name = name
  if (!("description" in next)) next.description = description

  return next
}

function createOutputPayload(base, flowId, name, description) {
  return {
    flow: withFlowIdentity(base.flow, flowId, name, description),
    screens: base.screens,
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true })
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

function main() {
  const inputPath = process.argv[2]
  if (!inputPath) {
    console.error("Missing input file.\nUsage: node scripts/build-descope-flow-files.mjs <exported-flow.json>")
    process.exit(1)
  }

  const absInput = path.resolve(process.cwd(), inputPath)
  if (!fs.existsSync(absInput)) {
    console.error(`Input file not found: ${absInput}`)
    process.exit(1)
  }

  const parsed = readJson(absInput)
  const base = resolvePayload(parsed)

  const outDir = path.resolve(process.cwd(), "descope-import")
  ensureDir(outDir)

  const signInPayload = createOutputPayload(
    base,
    "sign-in",
    "Sign In",
    "Dedicated sign-in flow imported from sign-up-or-in"
  )
  const signUpPayload = createOutputPayload(
    base,
    "sign-up",
    "Sign Up",
    "Dedicated sign-up flow imported from sign-up-or-in"
  )

  const signInPath = path.join(outDir, "sign-in.json")
  const signUpPath = path.join(outDir, "sign-up.json")

  writeJson(signInPath, signInPayload)
  writeJson(signUpPath, signUpPayload)

  console.log(`Created:\n- ${signInPath}\n- ${signUpPath}`)
  console.log("Import each file in Descope Flows using the corresponding flow ID.")
}

main()

