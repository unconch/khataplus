package online.khataplus.app.ui

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

private enum class ShellTab(val label: String) {
    Home("Home"),
    Sales("Sales"),
    Inventory("Inventory"),
    Khata("Khata"),
    Reports("Reports"),
    More("More")
}

private data class ShellStat(
    val label: String,
    val value: String,
    val subtitle: String,
    val accent: Color
)

private data class ActivityItem(
    val title: String,
    val detail: String,
    val amount: String,
    val tone: Color
)

@Composable
fun NativeShell(
    state: AuthUiState,
    onSignOut: () -> Unit
) {
    var selectedTab by rememberSaveable { mutableStateOf(ShellTab.Home) }
    val shellBg = Brush.verticalGradient(listOf(Color(0xFFF4F1EB), Color(0xFFE6F4EC), Color.White))

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
            val contentHeight = if (maxHeight > 270.dp) maxHeight - 270.dp else 0.dp
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(shellBg)
                    .safeDrawingPadding()
            ) {
                ShellTopBar(state = state, selectedTab = selectedTab, onSignOut = onSignOut)
                Box(modifier = Modifier.fillMaxWidth().height(contentHeight)) {
                    when (selectedTab) {
                        ShellTab.Home -> HomeDashboard(state)
                        ShellTab.Sales -> SalesScreen()
                        ShellTab.Inventory -> InventoryScreen()
                        ShellTab.Khata -> KhataScreen()
                        ShellTab.Reports -> ReportsScreen()
                        ShellTab.More -> MoreScreen(state = state, onSignOut = onSignOut)
                    }
                }
                BottomNav(selectedTab = selectedTab, onTabSelected = { selectedTab = it })
            }
        }
    }
}

@Composable
private fun ShellTopBar(
    state: AuthUiState,
    selectedTab: ShellTab,
    onSignOut: () -> Unit
) {
    Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Color(0xFF0F172A))
                    .padding(horizontal = 14.dp, vertical = 10.dp)
            ) {
                Text(text = "KP", color = Color.White, fontWeight = FontWeight.Black)
            }
            Column(modifier = Modifier.fillMaxWidth(0.72f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    text = "KhataPlus Native",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Black,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = "${state.orgName ?: "Your workspace"} • ${selectedTab.label}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
            OutlinedButton(onClick = onSignOut) { Text("Logout") }
        }

        Card(
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF102A43))
        ) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Android-first operating mode", color = Color.White, fontWeight = FontWeight.Bold)
                Text(
                    "Signed in as ${state.loginEmail.ifBlank { "workspace member" }}. Use the native tabs below to manage sales, stock, khata, and reports.",
                    color = Color(0xFFE2E8F0)
                )
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    Pill(text = "Online")
                    Pill(text = state.orgSlug ?: "org pending")
                }
            }
        }
    }
}

@Composable
private fun BottomNav(
    selectedTab: ShellTab,
    onTabSelected: (ShellTab) -> Unit
) {
    Surface(color = Color.White, tonalElevation = 8.dp) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 12.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            ShellTab.entries.forEach { tab ->
                val isSelected = selectedTab == tab
                Row(
                    modifier = Modifier
                        .clip(RoundedCornerShape(18.dp))
                        .background(if (isSelected) Color(0xFFE8F5EE) else Color(0xFFF8FAFC))
                        .clickable { onTabSelected(tab) }
                        .padding(horizontal = 14.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(if (isSelected) Color(0xFF10B981) else Color(0xFFE5E7EB))
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = tab.label.take(1),
                            color = if (isSelected) Color.White else Color(0xFF0F172A),
                            fontWeight = FontWeight.Black
                        )
                    }
                    Text(
                        text = tab.label,
                        color = if (isSelected) Color(0xFF065F46) else Color(0xFF334155),
                        fontWeight = if (isSelected) FontWeight.Black else FontWeight.Medium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }
    }
}

@Composable
private fun HomeDashboard(state: AuthUiState) {
    val context = LocalContext.current
    val showToast: (String) -> Unit = { message ->
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }

    val stats = listOf(
        ShellStat("Today Sales", "₹42,480", "+12% vs yesterday", Color(0xFF10B981)),
        ShellStat("Receivables", "₹18,200", "14 parties waiting", Color(0xFFF59E0B)),
        ShellStat("Low Stock", "09 items", "Reorder today", Color(0xFFEF4444)),
        ShellStat("Collections", "₹23,700", "8 payments logged", Color(0xFF2563EB))
    )
    val activities = listOf(
        ActivityItem("Invoice #A-204", "New cash sale from counter 2", "₹2,180", Color(0xFFE8F5EE)),
        ActivityItem("Khata update", "Sharma Traders paid partial dues", "₹8,000", Color(0xFFFFF7E5)),
        ActivityItem("Stock alert", "Green tea and sugar are below min stock", "Action needed", Color(0xFFFFE4E6))
    )

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 20.dp, vertical = 4.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SummaryRow(
                title = "Good to see you back",
                subtitle = "Everything is synced for ${state.orgName ?: "your workspace"}"
            )
        }
        item {
            BoxWithConstraints {
                val columns = if (maxWidth < 360.dp) 1 else 2
                StatGrid(
                    stats = stats,
                    columns = columns,
                    itemWidth = gridItemWidth(maxWidth, columns)
                )
            }
        }
        item {
            SectionCard(title = "Quick actions", subtitle = "Common tasks on one tap") {
                BoxWithConstraints {
                    val columns = if (maxWidth < 360.dp) 1 else 3
                    AdaptiveActionGrid(
                        labels = listOf("New Sale", "Add Stock", "Add Khata"),
                        columns = columns,
                        itemWidth = gridItemWidth(maxWidth, columns),
                        onAction = { label -> showToast("$label is a placeholder action for now") }
                    )
                }
            }
        }
        item {
            SectionCard(title = "Recent activity", subtitle = "Latest business movement") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    activities.forEach { item ->
                        ActivityRow(item = item, onClick = { showToast("Open ${item.title}") })
                    }
                }
            }
        }
    }
}

@Composable
private fun SalesScreen() {
    val context = LocalContext.current
    val showToast: (String) -> Unit = { message ->
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }

    val cart = listOf(
        "Fresh Milk x 4" to "₹240",
        "Sugar 1kg x 2" to "₹110",
        "Basmati rice x 1" to "₹620"
    )
    val products = listOf("Milk", "Tea", "Rice", "Sugar", "Biscuits", "Oil", "Flour", "Soap")

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionCard("Point of sale", "Fast checkout for the counter") {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    BoxWithConstraints {
                        val columns = if (maxWidth < 360.dp) 1 else 3
                        AdaptiveChipGrid(
                            chips = listOf(
                                "Cash" to "₹1,320",
                                "Card" to "₹860",
                                "UPI" to "₹2,440"
                            ),
                            columns = columns,
                            itemWidth = gridItemWidth(maxWidth, columns)
                        )
                    }
                    Text(
                        "Search products, tap to add, and keep the checkout flow quick for Android devices.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
        item {
            SectionCard("Popular items", "Tap an item to stage a sale") {
                BoxWithConstraints {
                    val columns = if (maxWidth < 360.dp) 1 else 2
                    ResponsiveProductGrid(
                        products = products,
                        columns = columns,
                        itemWidth = gridItemWidth(maxWidth, columns),
                        onProductClick = { product -> showToast("Added $product to the cart") }
                    )
                }
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    "Products are live placeholders for now, but each tap behaves like a real add-to-cart action.",
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        item {
            SectionCard("Cart", "Ready to bill") {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    cart.forEach { (name, price) ->
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(name)
                            Text(price, fontWeight = FontWeight.Bold)
                        }
                    }
                    HorizontalDivider()
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Total")
                        Text("₹970", fontWeight = FontWeight.Black)
                    }
                    Button(
                        onClick = { showToast("Complete Sale is a placeholder action for now") },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Complete Sale")
                    }
                }
            }
        }
    }
}

@Composable
private fun InventoryScreen() {
    val items = listOf(
        "Milk" to "24 left",
        "Tea" to "31 left",
        "Rice" to "12 left",
        "Sugar" to "06 left",
        "Oil" to "15 left"
    )

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionCard("Inventory", "Stock health at a glance") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    BoxWithConstraints {
                        val columns = if (maxWidth < 360.dp) 1 else 3
                        AdaptiveChipGrid(
                            chips = listOf(
                                "Total SKUs" to "184",
                                "Low stock" to "09",
                                "New items" to "17"
                            ),
                            columns = columns,
                            itemWidth = gridItemWidth(maxWidth, columns)
                        )
                    }
                    Text(
                        "Keep the stockroom tight with quick restock cues and visible thresholds for Android use.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
        item {
            SectionCard("Low stock list", "Needs attention") {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    items.forEach { (name, count) ->
                        StockRow(name = name, count = count)
                    }
                }
            }
        }
    }
}

@Composable
private fun KhataScreen() {
    val ledger = listOf(
        "Sharma Traders" to "₹18,200 due",
        "Brahmaputra Store" to "₹4,500 due",
        "Gupta Mart" to "₹1,180 due"
    )

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionCard("Khata", "Balances and collections") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                BoxWithConstraints {
                    val columns = if (maxWidth < 360.dp) 1 else 2
                    AdaptiveChipGrid(
                        chips = listOf(
                            "To collect" to "₹23,880",
                            "To pay" to "₹7,400"
                        ),
                        columns = columns,
                        itemWidth = gridItemWidth(maxWidth, columns)
                    )
                }
                    Text(
                        "Track receivables and keep the ledger moving from the phone.",
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
        item {
            SectionCard("Party balances", "Most active accounts") {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    ledger.forEach { (name, value) ->
                        LedgerRow(name = name, value = value)
                    }
                }
            }
        }
    }
}

@Composable
private fun ReportsScreen() {
    val reportItems = listOf(
        "Revenue" to "₹2.8L",
        "Margin" to "18.4%",
        "Returns" to "3.2%",
        "GST ready" to "Yes"
    )
    var selectedPeriod by rememberSaveable { mutableStateOf("Today") }
    val context = LocalContext.current
    val showToast: (String) -> Unit = { message ->
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionCard("Reports", "Daily, weekly, monthly") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                BoxWithConstraints {
                    val columns = if (maxWidth < 360.dp) 2 else 4
                    AdaptivePillGrid(
                        labels = listOf("Today", "7D", "30D", "FY"),
                        columns = columns,
                        itemWidth = gridItemWidth(maxWidth, columns),
                        selectedLabel = selectedPeriod,
                        onSelect = {
                            selectedPeriod = it
                                showToast("Showing $it summary")
                            }
                        )
                    }
                    reportItems.forEach { (label, value) ->
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(label)
                            Text(value, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
        item {
            SectionCard("Trend", "Simple native summary") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    BarLine("Sales", 0.92f, Color(0xFF10B981))
                    BarLine("Collections", 0.74f, Color(0xFF2563EB))
                    BarLine("Expenses", 0.51f, Color(0xFFF59E0B))
                }
            }
        }
    }
}

@Composable
private fun MoreScreen(state: AuthUiState, onSignOut: () -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionCard("Profile", "App and workspace settings") {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    SettingsRow("Workspace", state.orgName ?: "Pending")
                    SettingsRow("Slug", state.orgSlug ?: "pending")
                    SettingsRow("Session", "Native cookie-backed auth")
                }
            }
        }
        item {
            SectionCard("Preferences", "Tune the app") {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    PreferenceRow("Compact layout", "Better for small Android screens")
                    PreferenceRow("Dark accent", "Keeps the native look close to the brand")
                    PreferenceRow("Sync on launch", "Refreshes the auth context when the app opens")
                }
            }
        }
        item {
            SectionCard("Sign out", "End this session on the device") {
                Button(onClick = onSignOut, modifier = Modifier.fillMaxWidth()) {
                    Text("Logout")
                }
            }
        }
    }
}

@Composable
private fun SectionCard(
    title: String,
    subtitle: String,
    content: @Composable () -> Unit
) {
    Card(
        shape = RoundedCornerShape(26.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
                Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            content()
        }
    }
}

@Composable
private fun SummaryRow(title: String, subtitle: String) {
    Card(
        shape = RoundedCornerShape(26.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
    ) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(title, color = Color.White, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
            Text(subtitle, color = Color(0xFFE2E8F0))
        }
    }
}

@Composable
private fun StatGrid(
    stats: List<ShellStat>,
    columns: Int,
    itemWidth: Dp
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        stats.chunked(columns).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                row.forEach { stat ->
                    Card(
                        modifier = Modifier.width(itemWidth),
                        shape = RoundedCornerShape(22.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(stat.accent.copy(alpha = 0.15f))
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) {
                                Text(stat.label, color = stat.accent, fontWeight = FontWeight.Bold)
                            }
                            Text(stat.value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
                            Text(stat.subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
                if (row.size < columns) {
                    repeat(columns - row.size) { Spacer(modifier = Modifier.width(itemWidth)) }
                }
            }
        }
    }
}

@Composable
private fun AdaptiveActionGrid(
    labels: List<String>,
    columns: Int,
    itemWidth: Dp,
    onAction: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        labels.chunked(columns).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                row.forEach { label ->
                    QuickAction(
                        label = label,
                        modifier = Modifier.width(itemWidth),
                        onClick = { onAction(label) }
                    )
                }
                if (row.size < columns) {
                    repeat(columns - row.size) { Spacer(modifier = Modifier.width(itemWidth)) }
                }
            }
        }
    }
}

@Composable
private fun AdaptiveChipGrid(
    chips: List<Pair<String, String>>,
    columns: Int,
    itemWidth: Dp
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        chips.chunked(columns).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                row.forEach { (label, value) ->
                    InfoChip(
                        label = label,
                        value = value,
                        modifier = Modifier.width(itemWidth)
                    )
                }
                if (row.size < columns) {
                    repeat(columns - row.size) { Spacer(modifier = Modifier.width(itemWidth)) }
                }
            }
        }
    }
}

@Composable
private fun AdaptivePillGrid(
    labels: List<String>,
    columns: Int,
    itemWidth: Dp,
    selectedLabel: String,
    onSelect: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        labels.chunked(columns).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                row.forEach { label ->
                    Pill(
                        text = label,
                        selected = selectedLabel == label,
                        modifier = Modifier.width(itemWidth),
                        onClick = { onSelect(label) }
                    )
                }
                if (row.size < columns) {
                    repeat(columns - row.size) { Spacer(modifier = Modifier.width(itemWidth)) }
                }
            }
        }
    }
}

@Composable
private fun ResponsiveProductGrid(
    products: List<String>,
    columns: Int,
    itemWidth: Dp,
    onProductClick: (String) -> Unit
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        products.chunked(columns).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                row.forEach { product ->
                    ProductCard(
                        product = product,
                        modifier = Modifier.width(itemWidth),
                        onClick = { onProductClick(product) }
                    )
                }
                if (row.size < columns) {
                    repeat(columns - row.size) { Spacer(modifier = Modifier.width(itemWidth)) }
                }
            }
        }
    }
}

private fun gridItemWidth(totalWidth: Dp, columns: Int, spacing: Dp = 10.dp): Dp {
    return if (columns <= 1) {
        totalWidth
    } else {
        (totalWidth - spacing * (columns - 1)) / columns
    }
}

@Composable
private fun QuickAction(
    label: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFE8F5EE))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(Color(0xFF10B981))
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(label.take(1), color = Color.White, fontWeight = FontWeight.Black)
            }
            Text(
                label,
                color = Color(0xFF065F46),
                fontWeight = FontWeight.Bold,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }
    }
}

@Composable
private fun ProductCard(
    product: String,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(product, fontWeight = FontWeight.Bold)
            Text("In stock", color = Color(0xFF6B7280))
        }
    }
}

@Composable
private fun ActivityRow(item: ActivityItem, onClick: () -> Unit) {
    Card(
        modifier = Modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = item.tone)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.fillMaxWidth(0.78f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(item.title, fontWeight = FontWeight.Bold)
                Text(item.detail, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            Text(item.amount, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun InfoChip(
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(label, color = Color(0xFF64748B), fontWeight = FontWeight.Bold)
            Text(value, fontWeight = FontWeight.Black)
        }
    }
}

@Composable
private fun Pill(
    text: String,
    selected: Boolean = false,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null
) {
    val baseModifier = modifier
        .clip(RoundedCornerShape(999.dp))
        .background(if (selected) Color(0xFFE8F5EE) else Color(0xFFF1F5F9))

    val finalModifier = if (onClick != null) {
        baseModifier.clickable(onClick = onClick)
    } else {
        baseModifier
    }

    Box(modifier = finalModifier.padding(horizontal = 12.dp, vertical = 8.dp)) {
        Text(
            text,
            color = if (selected) Color(0xFF065F46) else Color(0xFF0F172A),
            fontWeight = FontWeight.Bold,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis
        )
    }
}

@Composable
private fun StockRow(name: String, count: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(name, fontWeight = FontWeight.Medium)
        Text(count, color = Color(0xFFDC2626), fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun LedgerRow(name: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(name, fontWeight = FontWeight.Medium)
        Text(value, color = Color(0xFF0F172A), fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun SettingsRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = Color(0xFF64748B))
        Text(value, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun PreferenceRow(label: String, detail: String) {
    var enabled by rememberSaveable { mutableStateOf(true) }
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.fillMaxWidth(0.80f)) {
            Text(label, fontWeight = FontWeight.Bold)
            Text(detail, color = Color(0xFF64748B))
        }
        Switch(checked = enabled, onCheckedChange = { enabled = it })
    }
}

@Composable
private fun BarLine(label: String, fraction: Float, color: Color) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, fontWeight = FontWeight.Bold)
            Text("${(fraction * 100).toInt()}%", color = color, fontWeight = FontWeight.Black)
        }
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(10.dp)
                .clip(RoundedCornerShape(999.dp))
                .background(color.copy(alpha = 0.12f))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth(fraction)
                    .height(10.dp)
                    .clip(RoundedCornerShape(999.dp))
                    .background(color)
            )
        }
    }
}

