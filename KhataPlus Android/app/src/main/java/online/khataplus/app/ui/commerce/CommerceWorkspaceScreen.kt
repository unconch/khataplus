package online.khataplus.app.ui.commerce

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import online.khataplus.app.ui.AuthUiState
import online.khataplus.app.ui.theme.KhataGold
import online.khataplus.app.ui.theme.KhataGreen
import online.khataplus.app.ui.theme.KhataInk
import online.khataplus.app.ui.theme.KhataPaper
import online.khataplus.app.ui.theme.KhataSky
import online.khataplus.app.ui.theme.KhataTeal

@Composable
fun CommerceWorkspaceScreen(state: AuthUiState, onSignOut: () -> Unit) {
    var activeTab by remember { mutableStateOf(CommerceTab.SALES) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xFFC9EFDD),
                        Color(0xFFDEEFFF),
                        Color(0xFFD3E7FB)
                    )
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .safeDrawingPadding()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            WorkspaceHeroCard(
                state = state,
                activeTab = activeTab,
                onTabSelected = { activeTab = it },
                onSignOut = onSignOut
            )
            when (activeTab) {
                CommerceTab.SALES -> SalesScreen()
                CommerceTab.INVENTORY -> InventoryScreen()
                CommerceTab.POS -> PosScreen()
            }
        }
    }
}

@Composable
private fun WorkspaceHeroCard(
    state: AuthUiState,
    activeTab: CommerceTab,
    onTabSelected: (CommerceTab) -> Unit,
    onSignOut: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(32.dp))
            .background(Color.White.copy(alpha = 0.90f))
            .padding(20.dp)
    ) {
        Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.weight(1f)) {
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(999.dp))
                            .background(Color(0xFF0F172A))
                            .padding(horizontal = 14.dp, vertical = 10.dp)
                    ) {
                        Text(text = "KP", color = Color.White, fontWeight = FontWeight.Black)
                    }
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(
                            text = "KhataPlus native workspace",
                            style = MaterialTheme.typography.titleLarge,
                            color = Color(0xFF0F172A),
                            fontWeight = FontWeight.Black
                        )
                        Text(
                            text = "Sales, inventory, and POS in one focused Android shell.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                OutlinedButton(onClick = onSignOut) {
                    Text("Logout")
                }
            }

            Card(
                shape = RoundedCornerShape(22.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        text = state.orgName ?: "Workspace ready",
                        style = MaterialTheme.typography.titleMedium,
                        color = Color(0xFF0F172A),
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = state.orgSlug?.let { "@$it" } ?: "Connected to your current org",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        SmallPill("Cashier", Color(0xFF10B981))
                        SmallPill("Inventory", Color(0xFFF59E0B))
                        SmallPill("Quick POS", Color(0xFF3B82F6))
                    }
                }
            }

            TabStrip(activeTab = activeTab, onTabSelected = onTabSelected)
        }
    }
}

@Composable
private fun TabStrip(
    activeTab: CommerceTab,
    onTabSelected: (CommerceTab) -> Unit
) {
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
        CommerceTab.entries.forEach { tab ->
            val selected = tab == activeTab
            Surface(
                modifier = Modifier
                    .weight(1f)
                    .clickable { onTabSelected(tab) },
                color = if (selected) Color.White else Color(0xFFF8FAFC),
                shape = RoundedCornerShape(18.dp),
                tonalElevation = 0.dp
            ) {
                Column(
                    modifier = Modifier.padding(vertical = 12.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = tab.label,
                        color = if (selected) KhataInk else Color(0xFF334155),
                        fontWeight = FontWeight.SemiBold
                    )
                    Text(
                        text = when (tab) {
                            CommerceTab.SALES -> "Invoices"
                            CommerceTab.INVENTORY -> "Stock"
                            CommerceTab.POS -> "Counter"
                        },
                        color = if (selected) KhataInk.copy(alpha = 0.7f) else Color(0xFF64748B),
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }
        }
    }
}

@Composable
private fun SmallPill(label: String, accent: Color) {
    Surface(
        color = accent.copy(alpha = 0.14f),
        contentColor = accent,
        shape = RoundedCornerShape(999.dp)
    ) {
        Text(
            text = label,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
            style = MaterialTheme.typography.labelSmall,
            fontWeight = FontWeight.SemiBold,
            color = accent
        )
    }
}

@Composable
private fun StatusPill(label: String, accent: Color, textColor: Color) {
    Surface(
        color = accent,
        shape = RoundedCornerShape(999.dp)
    ) {
        Text(
            text = label,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
            color = textColor,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun SectionTitle(title: String, subtitle: String) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(text = title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
        Text(
            text = subtitle,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun MetricGrid(metrics: List<SummaryMetric>) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        metrics.chunked(2).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                row.forEach { metric ->
                    MetricCard(metric = metric, modifier = Modifier.weight(1f))
                }
                if (row.size == 1) {
                    Spacer(modifier = Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun MetricCard(metric: SummaryMetric, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Surface(
                color = metric.accent.copy(alpha = 0.14f),
                shape = RoundedCornerShape(999.dp)
            ) {
                Text(
                    text = metric.label,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                    style = MaterialTheme.typography.labelSmall,
                    color = metric.accent,
                    fontWeight = FontWeight.Bold
                )
            }
            Text(text = metric.value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
            Text(
                text = metric.note,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun ActionRow(actions: List<WorkspaceQuickAction>) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        actions.chunked(3).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                row.forEach { action ->
                    ActionCard(action = action, modifier = Modifier.weight(1f))
                }
                if (row.size < 3) {
                    repeat(3 - row.size) {
                        Spacer(modifier = Modifier.weight(1f))
                    }
                }
            }
        }
    }
}

@Composable
private fun ActionCard(action: WorkspaceQuickAction, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Surface(
                color = action.accent.copy(alpha = 0.12f),
                shape = RoundedCornerShape(14.dp)
            ) {
                Box(
                    modifier = Modifier
                        .padding(10.dp)
                        .size(width = 28.dp, height = 6.dp)
                        .background(action.accent, RoundedCornerShape(8.dp))
                )
            }
            Text(text = action.title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
            Text(
                text = action.subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun SalesScreen() {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        SectionTitle("Sales dashboard", "Track orders, cash flow, and the latest bill activity.")
        MetricGrid(salesMetrics)
        Card(shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Fast actions", fontWeight = FontWeight.Bold)
                        Text(
                            "Start a sale or share the invoice in one tap.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    StatusPill(label = "Open till 9 PM", accent = KhataTeal.copy(alpha = 0.14f), textColor = KhataTeal)
                }
                ActionRow(salesQuickActions)
            }
        }
        Card(shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Recent invoices", fontWeight = FontWeight.Bold)
                    Text(
                        "Latest activity from the counter and online payments.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                recentSales.forEach { sale ->
                    SaleRow(sale = sale)
                }
            }
        }
    }
}

@Composable
private fun SaleRow(sale: SalesActivity) {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = KhataPaper)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(text = sale.customer, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    text = sale.subtitle,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(text = sale.amount, fontWeight = FontWeight.Black)
                StatusPill(label = sale.status, accent = sale.accent.copy(alpha = 0.16f), textColor = sale.accent)
            }
        }
    }
}

@Composable
fun InventoryScreen() {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        SectionTitle("Inventory control", "Keep fast movers healthy and catch low stock before it blocks a sale.")
        MetricGrid(inventoryMetrics)
        Card(shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Stock health", fontWeight = FontWeight.Bold)
                    Text(
                        "Use these actions to receive stock or fix counts after a physical check.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                ActionRow(inventoryQuickActions)
            }
        }
        Card(shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Items to watch", fontWeight = FontWeight.Bold)
                    Text(
                        "A compact list of SKU levels with reorder hints.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                inventoryItems.forEach { item ->
                    InventoryRow(item = item)
                }
            }
        }
    }
}

@Composable
private fun InventoryRow(item: InventoryItem) {
    val coverage = (item.stock.toFloat() / item.reorderPoint.toFloat()).coerceIn(0f, 1.2f)
    val tone = when {
        item.stock <= item.reorderPoint / 2 -> Color(0xFFFB7185)
        item.stock <= item.reorderPoint -> Color(0xFFF59E0B)
        else -> item.accent
    }
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = KhataPaper)
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(text = item.name, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                    Text(
                        text = item.sku,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Column(horizontalAlignment = Alignment.End, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(text = "${item.stock} ${item.unit}", fontWeight = FontWeight.Black)
                    StatusPill(
                        label = if (item.stock <= item.reorderPoint) "Reorder soon" else "Healthy",
                        accent = tone.copy(alpha = 0.16f),
                        textColor = tone
                    )
                }
            }
            LinearProgressIndicator(
                progress = { coverage },
                modifier = Modifier.fillMaxWidth(),
                color = tone,
                trackColor = Color.White
            )
            Text(
                text = "Reorder point ${item.reorderPoint} ${item.unit}",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
fun PosScreen() {
    var query by remember { mutableStateOf("") }
    var paymentMethod by remember { mutableStateOf(paymentMethods.first()) }
    val cart = remember { mutableStateListOf<CartLine>() }

    val filteredProducts = remember(query) {
        if (query.isBlank()) {
            posProducts
        } else {
            posProducts.filter {
                it.name.contains(query, ignoreCase = true) || it.category.contains(query, ignoreCase = true)
            }
        }
    }

    fun addToCart(product: PosProduct) {
        val index = cart.indexOfFirst { it.name == product.name }
        if (index >= 0) {
            val current = cart[index]
            cart[index] = current.copy(quantity = current.quantity + 1)
        } else {
            cart.add(CartLine(product.name, product.price, 1))
        }
    }

    val subtotal = cart.sumOf { it.price * it.quantity }
    val tax = subtotal * 0.18
    val total = subtotal + tax

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        SectionTitle("POS counter", "Search fast, build a cart, and keep checkout friction low.")
        Card(shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Live counter", fontWeight = FontWeight.Bold)
                    Text(
                        "A lightweight cashier view for quick item selection and payment capture.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                ActionRow(posQuickActions)
                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Search items or categories") },
                    singleLine = true
                )
            }
        }

        Card(shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("Quick add", fontWeight = FontWeight.Bold)
                        Text(
                            "Tap a product to push it into the cart.",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    StatusPill(label = "3 tap checkout", accent = KhataSky.copy(alpha = 0.16f), textColor = KhataSky)
                }
                filteredProducts.chunked(2).forEach { row ->
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                        row.forEach { product ->
                            ProductCard(product = product, onAdd = { addToCart(product) }, modifier = Modifier.weight(1f))
                        }
                        if (row.size == 1) {
                            Spacer(modifier = Modifier.weight(1f))
                        }
                    }
                }
            }
        }

        Card(shape = RoundedCornerShape(24.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text("Cart summary", fontWeight = FontWeight.Bold)
                        Text(
                            "${cart.size} lines ready for checkout",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    StatusPill(label = paymentMethod, accent = KhataGreen.copy(alpha = 0.16f), textColor = KhataGreen)
                }

                if (cart.isEmpty()) {
                    EmptyStateCard(
                        title = "Add a product to start",
                        subtitle = "The cart will appear here once you tap a quick-add item."
                    )
                } else {
                    cart.forEach { line ->
                        CartRow(line = line)
                    }
                    Spacer(modifier = Modifier.height(4.dp))
                    TotalsCard(subtotal = subtotal, tax = tax, total = total)
                }

                Text("Payment method", fontWeight = FontWeight.Bold)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                    paymentMethods.forEach { method ->
                        val selected = paymentMethod == method
                        Surface(
                            color = if (selected) KhataGreen.copy(alpha = 0.12f) else KhataPaper,
                            shape = RoundedCornerShape(999.dp),
                            modifier = Modifier.clickable { paymentMethod = method }
                        ) {
                            Text(
                                text = method,
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                                color = if (selected) KhataGreen else KhataInk,
                                fontWeight = FontWeight.SemiBold
                            )
                        }
                    }
                }

                Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                    OutlinedButton(onClick = { cart.clear() }, modifier = Modifier.weight(1f)) {
                        Text("Clear cart")
                    }
                    Button(onClick = { /* Native shell action placeholder */ }, modifier = Modifier.weight(1f)) {
                        Text("Charge now")
                    }
                }
            }
        }
    }
}

@Composable
private fun ProductCard(
    product: PosProduct,
    onAdd: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.clickable { onAdd() },
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = KhataPaper)
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Surface(
                color = product.accent.copy(alpha = 0.12f),
                shape = RoundedCornerShape(14.dp)
            ) {
                Text(
                    text = product.category,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 5.dp),
                    color = product.accent,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold
                )
            }
            Text(text = product.name, fontWeight = FontWeight.Bold)
            Text(
                text = money(product.price),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Black
            )
            Text(
                text = "Tap to add",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun CartRow(line: CartLine) {
    Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = KhataPaper)) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(text = line.name, fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text(
                    text = "${line.quantity} x ${money(line.price)}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Text(text = money(line.price * line.quantity), fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun TotalsCard(subtotal: Double, tax: Double, total: Double) {
    Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            AmountRow(label = "Subtotal", value = money(subtotal))
            AmountRow(label = "Tax", value = money(tax))
            AmountRow(label = "Total", value = money(total), bold = true)
        }
    }
}

@Composable
private fun AmountRow(label: String, value: String, bold: Boolean = false) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(text = label, fontWeight = if (bold) FontWeight.Bold else FontWeight.Medium)
        Text(text = value, fontWeight = if (bold) FontWeight.Black else FontWeight.SemiBold)
    }
}

@Composable
private fun EmptyStateCard(title: String, subtitle: String) {
    Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = KhataPaper)) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Text(title, fontWeight = FontWeight.Bold)
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

private fun money(value: Double): String = String.format(java.util.Locale("en", "IN"), "₹%,.0f", value)
