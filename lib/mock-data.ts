import { InventoryItem, Sale, Customer, DailyReport, SystemSettings } from "./types";

export let MOCK_SETTINGS: SystemSettings = {
    id: 'demo-org',
    allow_staff_inventory: true,
    allow_staff_sales: true,
    allow_staff_reports: true,
    allow_staff_reports_entry_only: false,
    allow_staff_analytics: true,
    allow_staff_add_inventory: false,
    gst_enabled: true,
    gst_inclusive: true,
    updated_at: new Date().toISOString()
};

export let MOCK_INVENTORY: InventoryItem[] = [
    { id: "1", sku: "M-CASE-001", name: "iPhone 15 Case - Transparent", buy_price: 150, gst_percentage: 18, stock: 45, org_id: "demo-org", created_at: new Date().toISOString(), updated_at: "" },
    { id: "2", sku: "CHG-20W", name: "20W USB-C Power Adapter", buy_price: 450, gst_percentage: 18, stock: 12, org_id: "demo-org", created_at: new Date().toISOString(), updated_at: "" },
    { id: "3", sku: "SCR-GLS-001", name: "Tempered Glass Screen Protector", buy_price: 50, gst_percentage: 18, stock: 100, org_id: "demo-org", created_at: new Date().toISOString(), updated_at: "" },
    { id: "4", sku: "CBL-USBC", name: "USB-C to USB-C Cable (1m)", buy_price: 120, gst_percentage: 18, stock: 30, org_id: "demo-org", created_at: new Date().toISOString(), updated_at: "" },
    { id: "5", sku: "AIRPODS-PRO", name: "Wireless Earbuds Pro", buy_price: 1200, gst_percentage: 18, stock: 5, org_id: "demo-org", created_at: new Date().toISOString(), updated_at: "" },
];

export let MOCK_CUSTOMERS: Customer[] = [
    { id: "c1", name: "Rahul Sharma", phone: "9876543210", address: "Sector 4, Noida", balance: 500, org_id: "demo-org", created_at: "", updated_at: "" },
    { id: "c2", name: "Priya Verma", phone: "9988776655", address: "Indirapuram, Ghaziabad", balance: 0, org_id: "demo-org", created_at: "", updated_at: "" },
    { id: "c3", name: "Amit Singh", phone: "8877665544", address: "Connaught Place, Delhi", balance: 1200, org_id: "demo-org", created_at: "", updated_at: "" },
];

export let MOCK_SALES: (Sale & { inventory?: InventoryItem })[] = [
    {
        id: "s1",
        inventory_id: "1",
        user_id: "demo-user",
        org_id: "demo-org",
        quantity: 2,
        sale_price: 500,
        total_amount: 1000,
        gst_amount: 152,
        profit: 700,
        payment_method: "UPI",
        sale_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        inventory: MOCK_INVENTORY[0]
    },
    {
        id: "s2",
        inventory_id: "2",
        user_id: "demo-user",
        org_id: "demo-org",
        quantity: 1,
        sale_price: 800,
        total_amount: 800,
        gst_amount: 122,
        profit: 350,
        payment_method: "Cash",
        sale_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        inventory: MOCK_INVENTORY[1]
    }
];

export let MOCK_REPORTS: DailyReport[] = [
    {
        id: "r1",
        report_date: new Date().toISOString().split('T')[0],
        total_sale_gross: 1800,
        total_cost: 750,
        expenses: 0,
        cash_sale: 800,
        online_sale: 1000,
        online_cost: 0,
        expense_breakdown: [],
        org_id: "demo-org",
        created_at: "",
        updated_at: ""
    }
];
