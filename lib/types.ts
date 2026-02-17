export interface Profile {
  id: string
  email: string
  name?: string
  role: "owner" | "manager" | "staff"
  status: "pending" | "approved" | "disabled" | "active"

  biometric_required: boolean
  referral_code?: string
  referred_by?: string
  phone?: string
  organization_id?: string
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: string
  sku: string
  name: string
  buy_price: number
  sell_price?: number // New: Selling price / MRP
  gst_percentage: number
  stock: number
  hsn_code?: string
  min_stock?: number // Minimum stock threshold for alerts
  org_id?: string
  created_at: string
  updated_at: string
}

export interface Sale {
  id: string
  inventory_id: string
  user_id: string
  quantity: number
  sale_price: number
  total_amount: number
  gst_amount: number
  profit: number
  payment_method: "Cash" | "UPI" | "Credit"
  batch_id?: string
  sale_date: string
  created_at: string
  inventory?: InventoryItem
  customer_gstin?: string
  hsn_code?: string
  org_id?: string
  // New GST Fields
  taxable_amount?: number
  igst_amount?: number
  cgst_amount?: number
  sgst_amount?: number
  gst_rate?: number
  place_of_supply?: string
  // V2 Fields
  customer_name?: string
  customer_phone?: string
  payment_link?: string
  payment_status?: "pending" | "paid" | "failed"
}

export interface DailySummary {
  date: string
  total_sales: number
  total_gst: number
  total_profit: number
  transaction_count: number
}

export interface SystemSettings {
  id: string
  allow_staff_inventory: boolean
  allow_staff_sales: boolean
  allow_staff_reports: boolean
  allow_staff_reports_entry_only: boolean
  allow_staff_analytics: boolean
  allow_staff_add_inventory: boolean
  gst_enabled: boolean
  gst_inclusive: boolean
  updated_at: string
}

export interface AuditLog {
  id: string
  org_id?: string
  user_id: string
  user_email: string
  user_name?: string // Added for joined queries
  action: string
  entity_type: string
  entity_id?: string
  details?: Record<string, any>
  created_at: string
}

export interface DailyReport {
  id: string
  report_date: string
  total_sale_gross: number
  total_cost: number
  expenses: number
  cash_sale: number
  online_sale: number
  online_cost: number
  expense_breakdown?: { category: string; amount: number }[]
  org_id?: string
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  category: string
  amount: number
  description?: string
  expense_date: string
  created_by?: string
  created_at: string
}

export interface ExpenseCategory {
  id?: string
  name: string
  created_at?: string
}

export interface Customer {
  id: string
  name: string
  phone: string
  address?: string
  balance?: number
  org_id?: string
  created_at: string
  updated_at: string
}

export interface KhataTransaction {
  id: string
  customer_id: string
  type: "credit" | "payment"
  amount: number
  sale_id?: string
  note?: string
  created_by?: string
  created_at: string
  customer?: Customer
}

export interface Organization {
  id: string
  name: string
  slug: string
  gstin?: string
  address?: string
  phone?: string
  logo_url?: string
  settings?: {
    gst_enabled: boolean
    gst_inclusive: boolean
    allow_staff_inventory: boolean
    allow_staff_sales: boolean
    allow_staff_reports: boolean
    allow_staff_reports_entry_only: boolean
    allow_staff_analytics: boolean
    allow_staff_add_inventory: boolean
  }
  created_by: string
  created_at: string
  updated_at: string
  upi_id?: string

  // 2026 Monetization fields
  plan_type: 'free' | 'starter' | 'pro' | 'legacy'
  subscription_status: 'active' | 'past_due' | 'canceled' | 'trial'
  trial_ends_at?: string
  whatsapp_addon_active?: boolean
  gst_addon_active?: boolean
  inventory_pro_active?: boolean
  vernacular_pack_active?: boolean
  ai_forecast_active?: boolean
  auto_reminders_enabled?: boolean
  pioneer_status?: boolean
  pioneer_joined_at?: string
  pioneer_certificate_id?: string
}

export interface OrganizationMember {
  id: string
  org_id: string
  user_id: string
  role: "owner" | "manager" | "staff"
  created_at: string
  user?: Profile
  organization?: Organization
}

export interface OrganizationInvite {
  id: string
  org_id: string
  email: string
  role: string
  token: string
  expires_at: string
  accepted_at?: string
  created_at: string
}

export interface Supplier {
  id: string
  name: string
  phone: string | null
  address: string | null
  gstin: string | null
  org_id: string
  created_at: string
  updated_at: string
  balance?: number
}

export interface SupplierTransaction {
  id: string
  supplier_id: string
  type: "purchase" | "payment"
  amount: number
  note: string | null
  invoice_no?: string | null
  created_by: string | null
  org_id: string
  created_at: string
  supplier?: Partial<Supplier>
}

export interface SystemAlert {
  id: string
  message: string
  metadata?: Record<string, unknown>
  created_at: string
}
