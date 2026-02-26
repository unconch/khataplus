import { AlertCircle, CheckCircle, Info, Megaphone, X } from "lucide-react";

export async function SystemAnnouncement() {
    try {
        const { getProductionSql } = await import("@/lib/db");
        const db = getProductionSql();

        const tableExists = await db`
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'system_announcements'
            ) as exists
        ` as any[];

        if (!tableExists?.[0]?.exists) return null;

        // Fetch most recent active announcement
        const announcements = await db`
            SELECT * FROM system_announcements 
            WHERE is_active = true 
            ORDER BY created_at DESC 
            LIMIT 1
        ` as any[];

        if (!announcements || announcements.length === 0) return null;

        const ann = announcements[0];

        const styles: Record<string, string> = {
            info: "bg-blue-600 text-white",
            warning: "bg-amber-500 text-white",
            success: "bg-emerald-600 text-white",
            urgent: "bg-red-600 text-white animate-pulse",
        };

        const icons: Record<string, any> = {
            info: <Info className="w-4 h-4" />,
            warning: <AlertCircle className="w-4 h-4" />,
            success: <CheckCircle className="w-4 h-4" />,
            urgent: <Megaphone className="w-4 h-4" />,
        };

        return (
            <div className={`w-full py-2 px-4 flex items-center justify-center gap-3 text-sm font-medium z-[100] relative shadow-md ${styles[ann.type] || styles.info}`}>
                <span className="flex-shrink-0">
                    {icons[ann.type] || icons.info}
                </span>
                <p className="text-center">{ann.message}</p>
            </div>
        );
    } catch (error) {
        // Table probably doesn't exist or DB error
        return null;
    }
}
