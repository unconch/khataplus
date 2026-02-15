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
