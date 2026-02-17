/**
 * KhataPlus Transactional Mail Engine
 * Uses Resend API via fetch to keep dependencies light.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SENDER_EMAIL = "no-reply@auth.khataplus.online";

export async function sendWelcomeEmail(to: string, userName: string, orgName: string) {
    if (!RESEND_API_KEY) {
        console.error("[Mail] RESEND_API_KEY not found in environment.");
        return { success: false, error: "Configuration missing" };
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; color: white; }
            .content { padding: 40px 30px; color: #334155; }
            .greeting { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 16px; }
            .shop-box { background: #f0fdf4; border: 1px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
            .features { margin: 32px 0; }
            .feature-item { display: flex; align-items: center; margin-bottom: 16px; font-size: 15px; }
            .feature-icon { color: #10b981; font-weight: bold; margin-right: 12px; }
            .button { display: inline-block; background: #0f172a; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 16px; margin-top: 24px; }
            .footer { background: #f1f5f9; padding: 24px; text-align: center; color: #64748b; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin:0; font-size: 32px; letter-spacing: -1px;">KhataPlus</h1>
                <p style="margin:8px 0 0 0; opacity: 0.9; font-weight: 600; text-transform: uppercase; font-size: 12px; letter-spacing: 2px;">Your Digital Ledger</p>
            </div>
            <div class="content">
                <div class="greeting">Welcome, ${userName}!</div>
                <p style="line-height: 1.6; font-size: 16px;">
                    We are excited to help you digitize your business operations with <strong>KhataPlus</strong>. 
                </p>
                
                <div class="shop-box">
                    <p style="margin:0; font-size: 14px; text-transform: uppercase; color: #059669; font-weight: 700; letter-spacing: 1px;">Your Shop is Now Live</p>
                    <h2 style="margin:8px 0 0 0; color: #064e3b; font-size: 28px;">${orgName}</h2>
                </div>

                <div class="features">
                    <div class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span>Manage your <strong>Daily Accounts</strong> and bookkeeping with zero errors.</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span>Generate <strong>GST-Compliant</strong> invoices and bills instantly.</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">✓</span>
                        <span>Monitor your <strong>Stock & Inventory</strong> levels in real-time.</span>
                    </div>
                </div>

                <div style="text-align: center;">
                    <p style="font-size: 14px; color: #64748b;">Click the button below to access your secure dashboard:</p>
                    <a href="https://khataplus.online/dashboard" class="button">Go to Dashboard</a>
                </div>
            </div>
            <div class="footer">
                <p style="margin: 0;">KhataPlus - Empowering Modern Merchants</p>
                <p style="margin: 8px 0 0 0;">&copy; 2026 KhataPlus Online</p>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: `KhataPlus <${SENDER_EMAIL}>`,
                to: [to],
                subject: `Welcome to KhataPlus: ${orgName} is Live!`,
                html: html,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("[Mail] Resend API Error:", data);
            return { success: false, error: data.message };
        }

        console.log("[Mail] Welcome email sent successfully:", data.id);
        return { success: true, id: data.id };
    } catch (error) {
        console.error("[Mail] Network error sending email:", error);
        return { success: false, error: "Internal mail error" };
    }
}

// ============================================================
// ADD THESE TO THE BOTTOM OF lib/mail.ts
// ============================================================

async function sendMail(to: string, subject: string, html: string) {
    if (!RESEND_API_KEY) {
        console.warn("[Mail] RESEND_API_KEY missing — skipping email")
        return { success: false }
    }
    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: `KhataPlus <${SENDER_EMAIL}>`,
                to: [to],
                subject,
                html,
            }),
        })
        const data = await response.json()
        if (!response.ok) {
            console.error("[Mail] Resend error:", data)
            return { success: false, error: data.message }
        }
        return { success: true, id: data.id }
    } catch (e) {
        console.error("[Mail] Network error:", e)
        return { success: false }
    }
}

export async function sendOrgDeletionRequestEmail(
    to: string,
    ownerName: string,
    orgName: string,
    requesterName: string,
    requestId: string
) {
    const approveUrl = `https://khataplus.online/deletion-approval?requestId=${requestId}&action=approve`
    const rejectUrl = `https://khataplus.online/deletion-approval?requestId=${requestId}&action=reject`

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07); }
        .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 36px 24px; text-align: center; color: white; }
        .content { padding: 36px 32px; color: #334155; }
        .warning-box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin: 24px 0; }
        .btn { display: inline-block; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; text-decoration: none; margin: 8px; }
        .btn-reject { background: #0f172a; color: #fff; }
        .btn-approve { background: #dc2626; color: #fff; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
    </style>
    </head>
    <body>
    <div class="container">
        <div class="header">
            <h1 style="margin:0; font-size:28px;">⚠️ Organization Deletion Request</h1>
            <p style="margin:8px 0 0; opacity:0.9; font-size:14px;">Your approval is required</p>
        </div>
        <div class="content">
            <p style="font-size:18px; font-weight:700;">Hi ${ownerName},</p>
            <p style="line-height:1.6; font-size:15px;">
                <strong>${requesterName}</strong> (the creator) has requested to permanently delete the organization:
            </p>
            <div class="warning-box">
                <p style="margin:0; font-size:20px; font-weight:900; color:#991b1b; text-align:center;">${orgName}</p>
                <p style="margin:8px 0 0; font-size:13px; color:#7f1d1d; text-align:center;">
                    This will permanently delete ALL data — inventory, sales, customers, and more.
                </p>
            </div>
            <p style="line-height:1.6; font-size:14px; color:#475569;">
                As a co-owner, <strong>your approval is required</strong>. If even one owner rejects this request, the deletion will be cancelled immediately.
            </p>
            <div style="text-align:center; margin:32px 0;">
                <a href="${rejectUrl}" class="btn btn-reject">🚫 Reject Deletion</a>
                <a href="${approveUrl}" class="btn btn-approve">✓ Approve Deletion</a>
            </div>
            <p style="font-size:12px; color:#94a3b8; text-align:center;">
                This request expires in 7 days. If you do nothing, the deletion will be automatically cancelled.
            </p>
        </div>
        <div class="footer">
            <p style="margin:0;">KhataPlus — Empowering Modern Merchants</p>
            <p style="margin:4px 0 0;">&copy; 2026 KhataPlus Online</p>
        </div>
    </div>
    </body>
    </html>
    `
    return sendMail(to, `⚠️ Action Required: ${orgName} deletion approval`, html)
}

export async function sendOrgDeletionRejectedEmail(
    to: string,
    ownerName: string,
    orgName: string,
    rejectedByName: string
) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.07); }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 36px 24px; text-align: center; color: white; }
        .content { padding: 36px 32px; color: #334155; }
        .info-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 24px 0; text-align:center; }
        .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
    </style>
    </head>
    <body>
    <div class="container">
        <div class="header">
            <h1 style="margin:0; font-size:28px;">✅ Deletion Request Cancelled</h1>
        </div>
        <div class="content">
            <p style="font-size:18px; font-weight:700;">Hi ${ownerName},</p>
            <p style="line-height:1.6;">
                Good news — the deletion request for your organization has been cancelled.
            </p>
            <div class="info-box">
                <p style="margin:0; font-size:20px; font-weight:900; color:#065f46;">${orgName}</p>
                <p style="margin:8px 0 0; font-size:13px; color:#047857;">
                    <strong>${rejectedByName}</strong> rejected the deletion request. Your organization and all its data are safe.
                </p>
            </div>
            <p style="line-height:1.6; font-size:14px; color:#475569;">
                No action is required from you. Your organization continues to operate normally.
            </p>
        </div>
        <div class="footer">
            <p style="margin:0;">KhataPlus — Empowering Modern Merchants</p>
            <p style="margin:4px 0 0;">&copy; 2026 KhataPlus Online</p>
        </div>
    </div>
    </body>
    </html>
    `
    return sendMail(to, `✅ ${orgName} deletion request was rejected — your data is safe`, html)
}
