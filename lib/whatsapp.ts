/**
 * Formats a phone number for WhatsApp wa.me links.
 * Ensures the number has the country code (defaulting to 91 for Bharat).
 * Removes any non-numeric characters.
 */
export function formatWhatsAppPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, "")

    // If it starts with 0, remove it (common in some formats)
    const withoutZero = cleaned.startsWith("0") ? cleaned.slice(1) : cleaned

    // If it's a 10-digit number, prepend 91
    if (withoutZero.length === 10) {
        return `91${withoutZero}`
    }

    return withoutZero
}

/**
 * Generates a WhatsApp wa.me link with safe message encoding.
 */
export function getWhatsAppUrl(phone: string, text: string): string {
    const formattedPhone = formatWhatsAppPhone(phone)
    const encodedText = encodeURIComponent(text)
    return `https://wa.me/${formattedPhone}?text=${encodedText}`
}

/**
 * Standard templates for common messages
 */
export const WhatsAppMessages = {
    ledgerSummary: (customerName: string, shopName: string, balance: number) => {
        const status = balance >= 0 ? "Pending Payment" : "Advance Paid"
        return `*Balance Summary for ${customerName}*\n` +
            `From: *${shopName}*\n\n` +
            `Total Balance: *₹${Math.abs(balance).toLocaleString()}*\n` +
            `Status: *${status}*\n\n` +
            `_Managed via KhataPlus - Your Digital Shop Assistant_\n` +
            `https://khataplus.online?ref=led_shr`
    },
    invoiceShare: (customerName: string | undefined, shopName: string, amount: number, invoiceId?: string) => {
        const idText = invoiceId ? ` (Inv #${invoiceId})` : ""
        return `*Invoice from ${shopName}*${idText}\n` +
            `Hi ${customerName || "Customer"},\n` +
            `Your payment of *₹${amount.toLocaleString()}* has been received. Thank you!\n\n` +
            `_Sent via KhataPlus_\n` +
            `https://khataplus.online?ref=inv_shr`
    },
    orderRequest: (shopName: string) => {
        return `Hi *${shopName}*,\n` +
            `I'm interested in ordering from your shop. Can you please share your latest catalogue?\n\n` +
            `_Found via KhataPlus_`
    }
}
