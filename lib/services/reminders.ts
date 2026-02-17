import { sql } from "../db";
import { getCustomers } from "../data/customers";
import { WhatsAppMessages } from "../whatsapp";
import type { Customer } from "../types";

export interface ReminderDraft {
    customerId: string;
    customerName: string;
    phone: string;
    balance: number;
    message: string;
    lastSentAt?: string;
}

/**
 * Scans for customers with outstanding balances and prepares reminder drafts.
 */
export async function getPendingReminders(orgId: string): Promise<ReminderDraft[]> {
    const customers = await getCustomers(orgId);

    // Filter for customers who owe money
    const debtors = customers.filter(c => (c.balance || 0) > 0);

    // Get shop name for organization
    const orgResult = await sql`SELECT name FROM organizations WHERE id = ${orgId}`;
    const shopName = orgResult[0]?.name || "Our Shop";

    return debtors.map(customer => ({
        customerId: customer.id,
        customerName: customer.name,
        phone: customer.phone,
        balance: customer.balance || 0,
        message: WhatsAppMessages.ledgerSummary(
            customer.name,
            shopName,
            customer.balance || 0
        ),
        lastSentAt: (customer as any).last_reminder_sent_at
    }));
}

/**
 * Marks a reminder as sent in the database.
 */
export async function markReminderSent(customerId: string, orgId: string) {
    await sql`
        UPDATE customers 
        SET 
            last_reminder_sent_at = CURRENT_TIMESTAMP,
            total_overdue_reminders = total_overdue_reminders + 1
        WHERE id = ${customerId} AND org_id = ${orgId}
    `;
}

/**
 * Automated worker logic (to be triggered by cron or manual action)
 */
export async function processAutoReminders(orgId: string) {
    const orgSettings = await sql`SELECT whatsapp_addon_active FROM organizations WHERE id = ${orgId}`;
    if (!orgSettings[0]?.whatsapp_addon_active) {
        console.log(`[Reminders] Auto-reminders skipped for org ${orgId}: Add-on not active.`);
        return;
    }

    const drafts = await getPendingReminders(orgId);

    // Filter out those sent recently (e.g., within 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const eligibleDrafts = drafts.filter(draft => {
        if (!draft.lastSentAt) return true;
        return new Date(draft.lastSentAt) < threeDaysAgo;
    });

    console.log(`[Reminders] Found ${eligibleDrafts.length} eligible customers for automated reminders.`);

    // In a real automated setup with an API provider, we'd loop and send here.
    // For the current WA.me integration, we just log them/prepare them for a "Bulk Send" UI trigger.
    return eligibleDrafts;
}
