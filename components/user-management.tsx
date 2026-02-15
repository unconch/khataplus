"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { Profile } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UsersIcon, ShieldCheckIcon, UserIcon, ShieldIcon } from "lucide-react"
import { updateUserRole, updateProfileBiometricStatus } from "@/lib/data/profiles"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Switch } from "@/components/ui/switch"

interface UserManagementProps {
  users: Profile[]
  currentUserId: string
}

export function UserManagement({ users, currentUserId }: UserManagementProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [optimisticBiometrics, setOptimisticBiometrics] = useState<Record<string, boolean>>({})
  const router = useRouter()


  const handleRoleChange = async (userId: string, newRole: Profile["role"]) => {
    setLoadingId(userId)
    try {
      await updateUserRole(userId, newRole)
      toast.success(`Role updated to ${newRole}`)
      router.refresh()
    } catch (error) {
      toast.error("Failed to update role")
    } finally {
      setLoadingId(null)
    }
  }

  const handleBiometricChange = async (userId: string, required: boolean) => {
    // Optimistic update
    setOptimisticBiometrics(prev => ({ ...prev, [userId]: required }))
    setLoadingId(userId)

    try {
      await updateProfileBiometricStatus(userId, required, currentUserId)
      toast.success(`Biometric lock ${required ? 'enabled' : 'disabled'}`)
      router.refresh()
    } catch (error) {
      // Revert on failure
      setOptimisticBiometrics(prev => {
        const next = { ...prev }
        delete next[userId]
        return next
      })
      toast.error("Failed to update biometric status")
    } finally {
      setLoadingId(null)
    }
  }


  if (users.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <UsersIcon className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">No users found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {users.map((user) => {
        const isCurrentUser = user.id === currentUserId
        return (
          <Card key={user.id}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-foreground truncate text-lg">{user.name || "Unknown User"}</p>
                    {isCurrentUser && <Badge variant="secondary" className="text-[10px]">You</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground truncate font-mono bg-muted/50 px-2 py-0.5 rounded-md inline-block max-w-full">{user.email}</p>

                  <Badge variant="outline" className="text-xs capitalize">{user.role}</Badge>
                </div>
              </div>

              <div className="flex flex-col gap-3 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-dashed border-border/50">
                {!isCurrentUser ? (
                  <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
                    {/* Status buttons removed */}

                    <Select
                      defaultValue={user.role}
                      onValueChange={(value) => handleRoleChange(user.id, value as any)}
                      disabled={loadingId === user.id}
                    >
                      <SelectTrigger size="sm" className="w-[110px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="sm:text-right">
                    <Badge variant="secondary" className="opacity-50">Cannot Edit Self</Badge>
                  </div>
                )}

                <div className="flex items-center justify-between sm:justify-end gap-3 bg-muted/30 p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ShieldIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Biometric Lock</span>
                  </div>
                  <Switch
                    checked={optimisticBiometrics[user.id] ?? (user.biometric_required || false)}
                    onCheckedChange={(checked) => handleBiometricChange(user.id, checked)}
                    disabled={loadingId === user.id}
                    className="scale-75 origin-right"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div >
  )
}
