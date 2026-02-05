import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MailIcon } from "lucide-react"
import Link from "next/link"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <Card className="border-border/50 text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <MailIcon className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-semibold">Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent you a confirmation link. Please check your email to verify your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              After verifying, you can{" "}
              <Link href="/auth/login" className="text-primary underline-offset-4 hover:underline">
                sign in here
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
