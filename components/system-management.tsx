"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { updateSystemSettings } from "@/lib/data/organizations"
import { SystemSettings } from "@/lib/types"
import { toast } from "sonner"

interface SystemManagementProps {
    initialSettings: SystemSettings
}

export function SystemManagement({ initialSettings }: SystemManagementProps) {
    const [settings, setSettings] = useState(initialSettings)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleToggle = async (key: keyof Omit<SystemSettings, "id" | "updated_at">) => {
        setIsLoading(true)
        const newValue = !settings[key]

        try {
            await updateSystemSettings({ [key]: newValue })
            setSettings(prev => ({ ...prev, [key]: newValue }))
            toast.success("Settings updated successfully")
            router.refresh()
        } catch (error) {
            toast.error("Failed to update settings")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Staff Access Control</CardTitle>
                    <CardDescription>
                        Configure which tabs and features are visible to users with the "staff" role.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="inventory-access" className="flex flex-col space-y-1">
                            <span>Inventory Tab</span>
                            <span className="font-normal text-xs text-muted-foreground">
                                Allow staff to view the inventory list.
                            </span>
                        </Label>
                        <Switch
                            id="inventory-access"
                            checked={settings.allow_staff_inventory}
                            onCheckedChange={() => handleToggle("allow_staff_inventory")}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="sales-access" className="flex flex-col space-y-1">
                            <span>Sales Tab</span>
                            <span className="font-normal text-xs text-muted-foreground">
                                Allow staff to view and record sales.
                            </span>
                        </Label>
                        <Switch
                            id="sales-access"
                            checked={settings.allow_staff_sales}
                            onCheckedChange={() => handleToggle("allow_staff_sales")}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="reports-access" className="flex flex-col space-y-1">
                            <span>Reports Tab</span>
                            <span className="font-normal text-xs text-muted-foreground">
                                Allow staff to view daily reports.
                            </span>
                        </Label>
                        <Switch
                            id="reports-access"
                            checked={settings.allow_staff_reports}
                            onCheckedChange={() => handleToggle("allow_staff_reports")}
                            disabled={isLoading}
                        />
                    </div>
                    {settings.allow_staff_reports && (
                        <div className="flex items-center justify-between space-x-2 pl-6 py-2 border-l-2 border-primary/20 animate-in slide-in-from-left-2 transition-all">
                            <Label htmlFor="reports-entry-only" className="flex flex-col space-y-1">
                                <span className="text-sm font-bold">Entry Mode Only</span>
                                <span className="font-normal text-[10px] text-muted-foreground uppercase tracking-tight">
                                    Staff can only submit new reports, not view history.
                                </span>
                            </Label>
                            <Switch
                                id="reports-entry-only"
                                checked={settings.allow_staff_reports_entry_only}
                                onCheckedChange={() => handleToggle("allow_staff_reports_entry_only")}
                                disabled={isLoading}
                            />
                        </div>
                    )}
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="accounting-access" className="flex flex-col space-y-1">
                            <span>Analytics Tab</span>
                            <span className="font-normal text-xs text-muted-foreground">
                                Allow staff to view financial summaries.
                            </span>
                        </Label>
                        <Switch
                            id="accounting-access"
                            checked={settings.allow_staff_analytics}
                            onCheckedChange={() => handleToggle("allow_staff_analytics")}
                            disabled={isLoading}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2 border-t pt-4">
                        <Label htmlFor="add-inventory-access" className="flex flex-col space-y-1">
                            <span>Add Inventory Privilege</span>
                            <span className="font-normal text-xs text-muted-foreground">
                                Allow staff to add new items (requires Inventory Tab to be visible).
                            </span>
                        </Label>
                        <Switch
                            id="add-inventory-access"
                            checked={settings.allow_staff_add_inventory}
                            onCheckedChange={() => handleToggle("allow_staff_add_inventory")}
                            disabled={isLoading || !settings.allow_staff_inventory}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>GST Calculation Mode</CardTitle>
                    <CardDescription>
                        Determine how GST is calculated during sales recording.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="gst-enabled" className="flex flex-col space-y-1">
                            <span>Enable GST Calculations</span>
                            <span className="font-normal text-xs text-muted-foreground">
                                Global switch to turn GST on or off for all sales and transactions.
                            </span>
                        </Label>
                        <Switch
                            id="gst-enabled"
                            checked={settings.gst_enabled}
                            onCheckedChange={() => handleToggle("gst_enabled")}
                            disabled={isLoading}
                        />
                    </div>
                    {settings.gst_enabled && (
                        <div className="flex items-center justify-between space-x-2 animate-in fade-in slide-in-from-top-2">
                            <Label htmlFor="gst-mode" className="flex flex-col space-y-1">
                                <span>Inclusive GST</span>
                                <span className="font-normal text-xs text-muted-foreground">
                                    When enabled, the Sales Price entered is considered inclusive of GST.
                                </span>
                            </Label>
                            <Switch
                                id="gst-mode"
                                checked={settings.gst_inclusive}
                                onCheckedChange={() => handleToggle("gst_inclusive")}
                                disabled={isLoading}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
