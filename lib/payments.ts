/**
 * Utility for generating UPI payment links and QR codes.
 */

export interface UPIConfig {
    pa: string; // Payee VPA
    pn: string; // Payee Name
    am?: string; // Amount
    tn?: string; // Transaction Note
    tr?: string; // Transaction Reference (Order ID)
    cu?: string; // Currency (default INR)
}

/**
 * Generates a standard UPI deep link.
 */
export function getUPILink(config: UPIConfig): string {
    const { pa, pn, am, tn, tr, cu = 'INR' } = config;
    let url = `upi://pay?pa=${encodeURIComponent(pa)}&pn=${encodeURIComponent(pn)}&cu=${cu}`;
    if (am) url += `&am=${am}`;
    if (tn) url += `&tn=${encodeURIComponent(tn)}`;
    if (tr) url += `&tr=${encodeURIComponent(tr)}`;
    return url;
}

/**
 * Generates a QR Code URL using a public API (e.g. qrcode.show or similar).
 * Note: In production, use a local server-side generator.
 */
export function getQRCodeUrl(data: string, size: number = 256): string {
    const encodedData = encodeURIComponent(data);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedData}`;
}

/**
 * Formats a shop's payment info for a customer message.
 */
export function getPaymentInstructions(shopName: string, amount: number, orderId: string): string {
    return `*Payment Request from ${shopName}*\n` +
        `Amount: *₹${amount.toLocaleString()}*\n` +
        `Order Ref: #${orderId}\n\n` +
        `You can pay via UPI using the link below:\n` +
        `_Scan QR on invoice or click to pay_`;
}
