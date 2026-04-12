package online.khataplus.app.ui.commerce

import androidx.compose.ui.graphics.Color

enum class CommerceTab(val label: String) {
    SALES("Sales"),
    INVENTORY("Inventory"),
    POS("POS")
}

data class SummaryMetric(
    val label: String,
    val value: String,
    val note: String,
    val accent: Color
)

data class SalesActivity(
    val customer: String,
    val subtitle: String,
    val amount: String,
    val status: String,
    val accent: Color
)

data class InventoryItem(
    val name: String,
    val sku: String,
    val stock: Int,
    val reorderPoint: Int,
    val unit: String,
    val accent: Color
)

data class PosProduct(
    val name: String,
    val category: String,
    val price: Double,
    val accent: Color
)

data class CartLine(
    val name: String,
    val price: Double,
    val quantity: Int
)

data class WorkspaceQuickAction(
    val title: String,
    val subtitle: String,
    val accent: Color
)

val salesMetrics = listOf(
    SummaryMetric("Today", "\u20B91.84L", "28 invoices closed", Color(0xFF10B981)),
    SummaryMetric("Pending", "\u20B942.6K", "13 unpaid bills", Color(0xFFF59E0B)),
    SummaryMetric("Refunds", "\u20B92.1K", "2 recent adjustments", Color(0xFFFB7185)),
    SummaryMetric("Repeat buyers", "76%", "Up from last week", Color(0xFF3B82F6))
)

val recentSales = listOf(
    SalesActivity("Neha Traders", "12 items, cash sale", "\u20B924,800", "Paid", Color(0xFF10B981)),
    SalesActivity("Aman Retail", "3 cartons, partial due", "\u20B98,450", "Due today", Color(0xFFF59E0B)),
    SalesActivity("City Mart", "POS invoice, card", "\u20B915,920", "Captured", Color(0xFF3B82F6)),
    SalesActivity("Shree Distributors", "Return adjusted", "\u20B94,500", "Refunded", Color(0xFFFB7185))
)

val salesQuickActions = listOf(
    WorkspaceQuickAction("New sale", "Open a fresh checkout", Color(0xFF10B981)),
    WorkspaceQuickAction("Share invoice", "Send bill link", Color(0xFF3B82F6)),
    WorkspaceQuickAction("Add customer", "Save a buyer", Color(0xFFF59E0B))
)

val inventoryMetrics = listOf(
    SummaryMetric("On hand", "1,248", "Across 34 SKUs", Color(0xFF0F766E)),
    SummaryMetric("Low stock", "6", "Needs reorder soon", Color(0xFFFB7185)),
    SummaryMetric("In transit", "18", "Expected tomorrow", Color(0xFF3B82F6)),
    SummaryMetric("Fast movers", "11", "Top sellers today", Color(0xFFF59E0B))
)

val inventoryItems = listOf(
    InventoryItem("Organic Rice", "SKU-201", 14, 20, "bags", Color(0xFF10B981)),
    InventoryItem("Cooking Oil", "SKU-208", 8, 18, "bottles", Color(0xFFFB7185)),
    InventoryItem("Notebook A5", "SKU-311", 62, 40, "packs", Color(0xFF3B82F6)),
    InventoryItem("Detergent Bar", "SKU-415", 27, 25, "cartons", Color(0xFFF59E0B)),
    InventoryItem("Tea Blend", "SKU-517", 11, 16, "boxes", Color(0xFF8B5CF6))
)

val inventoryQuickActions = listOf(
    WorkspaceQuickAction("Receive stock", "Log a fresh inward", Color(0xFF0F766E)),
    WorkspaceQuickAction("Adjust counts", "Correct stock on hand", Color(0xFF3B82F6)),
    WorkspaceQuickAction("Export report", "Share inventory summary", Color(0xFFF59E0B))
)

val posProducts = listOf(
    PosProduct("A5 Notebook", "Stationery", 120.0, Color(0xFF3B82F6)),
    PosProduct("Cooking Oil", "Groceries", 165.0, Color(0xFFF59E0B)),
    PosProduct("Tea Pack", "Groceries", 95.0, Color(0xFF10B981)),
    PosProduct("Laundry Soap", "Household", 78.0, Color(0xFFFB7185)),
    PosProduct("Pulse Snack", "Fast moving", 54.0, Color(0xFF8B5CF6)),
    PosProduct("Rice Bag", "Groceries", 760.0, Color(0xFF0F766E))
)

val posQuickActions = listOf(
    WorkspaceQuickAction("Scan item", "Use barcode or search", Color(0xFF3B82F6)),
    WorkspaceQuickAction("Hold order", "Pause the cart", Color(0xFFF59E0B)),
    WorkspaceQuickAction("Split payment", "Handle mixed tender", Color(0xFF10B981))
)

val paymentMethods = listOf("Cash", "UPI", "Card")
