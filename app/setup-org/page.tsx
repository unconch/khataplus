import { redirect } from "next/navigation"

export default function SetupOrgAliasPage() {
  redirect("/setup-organization?reauth=1")
}
