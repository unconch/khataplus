import "server-only"

import { getSession } from "./session"

const OTP_AMR_HINTS = ["otp", "sms", "totp", "mfa", "webauthn", "passkey"]

export class StepUpRequiredError extends Error {
    statusCode: number

    constructor(message: string) {
        super(message)
        this.name = "StepUpRequiredError"
        this.statusCode = 428
    }
}

function hasOtpMethod(methods: string[]): boolean {
    return methods.some((method) => OTP_AMR_HINTS.some((hint) => method.includes(hint)))
}

export interface AssertRecentOtpStepUpOptions {
    maxAgeSeconds?: number
    minimumAuthTimeSeconds?: number
}

export function getOrgDeletionStepUpFlowId(): string {
    return (
        process.env.NEXT_PUBLIC_DESCOPE_DELETE_ORG_STEP_UP_FLOW_ID ||
        process.env.NEXT_PUBLIC_DESCOPE_OTP_FLOW_ID ||
        process.env.NEXT_PUBLIC_DESCOPE_SIGN_IN_FLOW_ID ||
        process.env.NEXT_PUBLIC_DESCOPE_FLOW_ID ||
        "sign-up-or-in"
    )
}

export async function assertRecentOtpStepUp(options?: AssertRecentOtpStepUpOptions): Promise<void> {
    const session = await getSession()
    if (!session?.userId) {
        throw new StepUpRequiredError("Unauthorized: No active session")
    }

    const maxAgeSeconds = options?.maxAgeSeconds ?? Number(process.env.ORG_DELETE_STEP_UP_MAX_AGE_SECONDS ?? 900)
    const now = Math.floor(Date.now() / 1000)
    const authTime = session.stepUp?.authTime ?? null
    const methods = session.stepUp?.methods ?? []

    if (!authTime) {
        throw new StepUpRequiredError("Step-up required: complete OTP verification and try again.")
    }

    if (!hasOtpMethod(methods)) {
        throw new StepUpRequiredError("Step-up required: OTP verification was not detected in this session.")
    }

    if (options?.minimumAuthTimeSeconds && authTime < options.minimumAuthTimeSeconds) {
        throw new StepUpRequiredError("Step-up expired: verify again with OTP for this deletion request.")
    }

    if (now - authTime > maxAgeSeconds) {
        throw new StepUpRequiredError("Step-up expired: complete OTP verification again and retry.")
    }
}

