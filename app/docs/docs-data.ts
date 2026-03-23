import type { LucideIcon } from "lucide-react"
import {
    Rocket,
    ReceiptText,
    BookText,
    Package,
    BarChart3,
    Users,
    Database,
    CreditCard,
    Wrench,
} from "lucide-react"

export type DocGroupId =
    | "start-here"
    | "daily-billing"
    | "khata-payments"
    | "inventory"
    | "gst-reports"
    | "teams-staff"
    | "admin-data"
    | "plans"
    | "fix-problems"

export type QuickAction = {
    label: string
    href: string
}

export type ClickGuideStep = {
    href: string
    page: string
    button: string
    note: string
}

export type DocArticle = {
    slug: string
    group: DocGroupId
    title: string
    purpose: string
    readTime: string
    lastUpdated: string
    icon: LucideIcon
    quickActions: QuickAction[]
    clickGuide: ClickGuideStep[]
    whenToUse: string[]
    steps: string[]
    example: string
    commonMistakes: string[]
    tip?: string
    warning?: string
    copyExample?: string
}

export const GROUP_LABELS: Record<DocGroupId, string> = {
    "start-here": "Start Here",
    "daily-billing": "Create & Track Sales",
    "khata-payments": "Manage Customer Dues",
    inventory: "Inventory",
    "gst-reports": "GST & Reports",
    "teams-staff": "Teams & Staff",
    "admin-data": "Admin & Data",
    plans: "Plans",
    "fix-problems": "Fix Issues",
}

export const GROUP_ORDER: DocGroupId[] = [
    "start-here",
    "daily-billing",
    "khata-payments",
    "inventory",
    "gst-reports",
    "teams-staff",
    "admin-data",
    "plans",
    "fix-problems",
]

export const DOC_ARTICLES: DocArticle[] = [
    {
        slug: "quick-start-5-minute-guide",
        group: "start-here",
        title: "Quick Start 5-Minute Guide",
        purpose: "Set up and complete one full sale-to-payment cycle in minutes.",
        readTime: "5 min",
        lastUpdated: "February 28, 2026",
        icon: Rocket,
        quickActions: [
            { label: "Open Setup", href: "/setup-organization" },
            { label: "Open Dashboard", href: "/dashboard" },
        ],
        clickGuide: [
            { href: "/setup-organization", page: "Setup Organization", button: "Save Business Profile", note: "Create your workspace and finish the first setup step." },
            { href: "/dashboard/inventory", page: "Inventory", button: "Add Item", note: "Create your first product with stock, GST, and HSN." },
            { href: "/dashboard/sales", page: "Sales", button: "New Invoice", note: "Run one test sale and confirm the invoice flow." },
        ],
        whenToUse: [
            "You are using KhataPlus for the first time.",
            "You want to train a new staff member quickly.",
        ],
        steps: [
            "Create your business profile and save slug.",
            "Add one product with stock, GST %, and HSN.",
            "Add one customer.",
            "Create one invoice for that customer.",
            "Record one payment and verify due balance.",
            "Open reports and confirm sale appears.",
        ],
        example: "Sell item for Rs 1,200. Receive Rs 700 now. Pending due should show Rs 500.",
        commonMistakes: [
            "Skipping product GST setup before invoicing.",
            "Entering payment as a fresh sale.",
            "Not checking reports after first transaction.",
        ],
    },
    {
        slug: "create-first-invoice",
        group: "daily-billing",
        title: "Create Your First Invoice",
        purpose: "Create accurate invoices, track payments, and keep dues clear from the first bill.",
        readTime: "6 min",
        lastUpdated: "February 28, 2026",
        icon: ReceiptText,
        quickActions: [
            { label: "Go to Sales", href: "/dashboard/sales" },
            { label: "Open Customers", href: "/dashboard/customers" },
        ],
        clickGuide: [
            { href: "/dashboard/sales", page: "Sales", button: "Add Customer", note: "Start the bill by selecting or creating the customer." },
            { href: "/dashboard/sales", page: "Sales", button: "Add Item", note: "Add products, quantity, GST, and verify totals." },
            { href: "/dashboard/sales", page: "Sales", button: "Save Invoice", note: "Finish the invoice and generate the bill cleanly." },
        ],
        whenToUse: [
            "You are billing a walk-in or repeat customer.",
            "You need to issue GST-compliant invoice.",
        ],
        steps: [
            "Open Sales and add customer.",
            "Add product line items and quantity.",
            "Confirm GST % and total amount.",
            "Choose payment mode: Cash, UPI, or Credit.",
            "Save invoice and share receipt/invoice.",
        ],
        example: "Invoice total Rs 5,000. Payment mode credit. Customer due should become Rs 5,000.",
        commonMistakes: [
            "Using wrong payment mode for credit sale.",
            "Saving invoice with missing HSN/GST values.",
            "Editing old invoice without reconciling stock.",
        ],
        warning: "Wrong GST % at product level can break report accuracy.",
    },
    {
        slug: "record-customer-payment",
        group: "khata-payments",
        title: "Record Customer Payment",
        purpose: "Record payments against dues clearly without changing past invoice values.",
        readTime: "5 min",
        lastUpdated: "February 28, 2026",
        icon: BookText,
        quickActions: [
            { label: "Open Ledger", href: "/dashboard/khata" },
            { label: "Open Customers", href: "/dashboard/customers" },
        ],
        clickGuide: [
            { href: "/dashboard/khata", page: "Khata", button: "Open Customer Ledger", note: "Go to the customer with the pending due." },
            { href: "/dashboard/khata", page: "Khata", button: "Record Payment", note: "Open the payment flow from that ledger." },
            { href: "/dashboard/khata", page: "Khata", button: "Save Payment", note: "Confirm amount and update the running balance." },
        ],
        whenToUse: [
            "Customer pays full or partial pending amount.",
            "You need to correct due balance.",
        ],
        steps: [
            "Open customer ledger entry.",
            "Select Record Payment.",
            "Enter amount received and note/reference.",
            "Save and verify updated running balance.",
        ],
        example: "Customer due is Rs 5,000. Payment of Rs 2,000 recorded. New due should be Rs 3,000.",
        commonMistakes: [
            "Posting payment as new sale.",
            "Adjusting balance without note.",
            "Not verifying running balance after save.",
        ],
        tip: "Rule: Credit increases due, payment decreases due.",
    },
    {
        slug: "manage-stock-daily",
        group: "inventory",
        title: "Manage Stock Daily",
        purpose: "Keep stock counts accurate while billing, adjusting, and reviewing low-stock items.",
        readTime: "6 min",
        lastUpdated: "February 28, 2026",
        icon: Package,
        quickActions: [
            { label: "Open Inventory", href: "/dashboard/inventory" },
            { label: "Open Sales", href: "/dashboard/sales" },
        ],
        clickGuide: [
            { href: "/dashboard/inventory", page: "Inventory", button: "Add Item", note: "Create a product with opening stock and GST details." },
            { href: "/dashboard/inventory", page: "Inventory", button: "Adjust Stock", note: "Correct mismatch when physical and system stock differ." },
            { href: "/dashboard/inventory", page: "Inventory", button: "Save Update", note: "Store the new stock level with a reason note." },
        ],
        whenToUse: [
            "Stock count does not match physical stock.",
            "You are adding a new product to catalog.",
        ],
        steps: [
            "Create product with SKU, HSN, GST %, and opening stock.",
            "Check stock auto-reduction after one sample sale.",
            "Use adjustment entry if physical count differs.",
            "Add reason note for every manual adjustment.",
            "Review low-stock list before closing day.",
        ],
        example: "System stock 25, physical stock 22. Adjust -3 with note: 'damaged items'.",
        commonMistakes: [
            "Manual stock change without reason note.",
            "Duplicate sale entries causing extra stock drop.",
            "No daily low-stock review.",
        ],
    },
    {
        slug: "fix-gst-mismatch",
        group: "gst-reports",
        title: "Fix GST Mismatch",
        purpose: "Fix GST data issues before filing so exports and returns stay clean.",
        readTime: "7 min",
        lastUpdated: "February 28, 2026",
        icon: BarChart3,
        quickActions: [
            { label: "Open GST Reports", href: "/dashboard/reports/gst" },
            { label: "Open Product List", href: "/dashboard/inventory" },
        ],
        clickGuide: [
            { href: "/dashboard/inventory", page: "Inventory", button: "Edit Item", note: "Fix HSN or GST percentage on the affected product." },
            { href: "/dashboard/reports/gst", page: "GST Reports", button: "Re-run Report", note: "Refresh totals after correcting source tax values." },
            { href: "/dashboard/reports/gst", page: "GST Reports", button: "Export GSTR-1", note: "Download a fresh GST output only after verification." },
        ],
        whenToUse: [
            "Report tax totals do not match expected values.",
            "GSTR-1 export fails or looks incorrect.",
        ],
        steps: [
            "Check product HSN and GST % fields.",
            "Correct wrong invoice item tax values.",
            "Re-run GST report and verify totals.",
            "Download fresh GSTR-1 JSON file.",
        ],
        example: "Item billed at 5% instead of 12%. Correct product GST and regenerate report.",
        commonMistakes: [
            "Exporting GSTR-1 before correcting source values.",
            "Ignoring missing HSN codes.",
            "Using old exported file after data fixes.",
        ],
        warning: "Do not file GST with stale export files.",
        copyExample: "{ \"gstin\": \"18ABCDE1234F1Z5\", \"invoice_no\": \"INV-1024\", \"taxable_value\": 10000 }",
    },
    {
        slug: "manage-team-access",
        group: "teams-staff",
        title: "Manage Team Access",
        purpose: "Assign correct roles so staff can work without risky permissions.",
        readTime: "5 min",
        lastUpdated: "February 28, 2026",
        icon: Users,
        quickActions: [
            { label: "Open Team Settings", href: "/dashboard/settings" },
            { label: "Open Admin", href: "/dashboard/admin" },
        ],
        clickGuide: [
            { href: "/dashboard/admin", page: "Admin", button: "Invite Member", note: "Add the staff member you want to give access to." },
            { href: "/dashboard/settings", page: "Settings", button: "Change Role", note: "Assign the correct permission level for their work." },
            { href: "/dashboard/admin", page: "Admin", button: "Save Access", note: "Confirm the role and test the allowed workflow." },
        ],
        whenToUse: [
            "Adding or removing staff access.",
            "A user cannot access required page.",
        ],
        steps: [
            "Invite member and assign role.",
            "Confirm role mapping after invite accepted.",
            "Test required workflow access for that role.",
            "Update role if task scope changes.",
        ],
        example: "Staff can enter sales. Owner/Admin should handle billing/critical settings.",
        commonMistakes: [
            "Giving broad role for one temporary task.",
            "Not rechecking access after role change.",
            "Assuming old session reflects new permissions instantly.",
        ],
    },
    {
        slug: "import-old-data",
        group: "admin-data",
        title: "Import Old Data",
        purpose: "Move data from old software without breaking reports.",
        readTime: "6 min",
        lastUpdated: "February 28, 2026",
        icon: Database,
        quickActions: [
            { label: "Open Migration", href: "/dashboard/migration" },
            { label: "Download Sample CSV", href: "/dashboard/migration" },
        ],
        clickGuide: [
            { href: "/dashboard/migration", page: "Migration", button: "Download Template", note: "Start with the expected import format before mapping columns." },
            { href: "/dashboard/migration", page: "Migration", button: "Upload CSV", note: "Load the file and inspect preview errors first." },
            { href: "/dashboard/migration", page: "Migration", button: "Run Import", note: "Import only after the preview is fully clean." },
        ],
        whenToUse: [
            "Switching from old billing/ledger software.",
            "Bulk loading inventory or customer data.",
        ],
        steps: [
            "Download the expected CSV template.",
            "Match source columns to required headers.",
            "Upload and review preview errors.",
            "Fix all red errors and re-upload.",
            "Run import and validate totals in reports.",
        ],
        example: "If opening stock was 100 in old system, verify same stock after import.",
        commonMistakes: [
            "Changing template header names.",
            "Mixing number and text values in amount columns.",
            "Skipping post-import validation.",
        ],
        tip: "Import one sample file first before full historical data.",
    },
    {
        slug: "understand-plans",
        group: "plans",
        title: "Understand Plans",
        purpose: "Choose the right plan and avoid business interruption on trial expiry.",
        readTime: "4 min",
        lastUpdated: "February 28, 2026",
        icon: CreditCard,
        quickActions: [
            { label: "Open Pricing", href: "/pricing" },
            { label: "Open Billing Settings", href: "/dashboard/settings" },
        ],
        clickGuide: [
            { href: "/pricing", page: "Pricing", button: "Compare Plans", note: "Review feature limits and pick the plan that fits your team." },
            { href: "/pricing", page: "Pricing", button: "Start 14-day trial", note: "Begin the upgrade flow from the public pricing page." },
            { href: "/dashboard/settings", page: "Settings", button: "Verify Billing Status", note: "Confirm the new plan is active after payment." },
        ],
        whenToUse: [
            "Trial is nearing expiry.",
            "You need advanced features or add-ons.",
        ],
        steps: [
            "Review current plan and feature limits.",
            "Compare Starter, Pro, and other available options.",
            "Upgrade from billing settings.",
            "Verify subscription status after payment.",
        ],
        example: "If team size grows from 1 to 5, move to plan with role and reporting support.",
        commonMistakes: [
            "Waiting until trial expiry day to upgrade.",
            "Assuming all add-ons are included by default.",
        ],
    },
    {
        slug: "fix-common-problems",
        group: "fix-problems",
        title: "Fix Issues Fast",
        purpose: "Resolve common billing, GST, import, and sync problems quickly.",
        readTime: "8 min",
        lastUpdated: "February 28, 2026",
        icon: Wrench,
        quickActions: [
            { label: "Open Reports", href: "/dashboard/reports" },
            { label: "Open Migration", href: "/dashboard/migration" },
        ],
        clickGuide: [
            { href: "/dashboard/reports", page: "Reports", button: "Open Affected Report", note: "Start with the screen where the mismatch is visible." },
            { href: "/dashboard/migration", page: "Migration", button: "Review Import Errors", note: "Check whether the source data caused the problem." },
            { href: "/dashboard/reports", page: "Reports", button: "Refresh Output", note: "Rebuild the result only after fixing the root cause." },
        ],
        whenToUse: [
            "Numbers do not match expected values.",
            "Data import or sync is failing.",
        ],
        steps: [
            "Identify exact issue type: ledger, gst, stock, import, or sync.",
            "Check source entries for wrong type/value.",
            "Fix source entry first, then regenerate output/report.",
            "Validate with one known transaction end-to-end.",
        ],
        example: "GSTR-1 missing fields: fill missing GST values, then regenerate JSON.",
        commonMistakes: [
            "Trying multiple fixes without verifying one root cause.",
            "Regenerating export without fixing source data.",
            "Ignoring sync completion before checking totals.",
        ],
        warning: "Do not continue bulk entry until mismatch root cause is identified.",
    },
]

export const DOC_BY_SLUG = DOC_ARTICLES.reduce<Record<string, DocArticle>>((acc, article) => {
    acc[article.slug] = article
    return acc
}, {})

export const DOC_HOME_ORDER = [
    "quick-start-5-minute-guide",
    "create-first-invoice",
    "record-customer-payment",
    "manage-stock-daily",
    "fix-gst-mismatch",
    "manage-team-access",
    "import-old-data",
    "understand-plans",
    "fix-common-problems",
]
