package online.khataplus.app.ui

import android.content.Context
import android.widget.Toast
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CurrencyRupee
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.foundation.Image
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import online.khataplus.app.BuildConfig
import online.khataplus.app.R

private enum class ShellTab(val label: String) {
    Home("Home"),
    Sales("Sales"),
    Inventory("Inventory"),
    Khata("Khata"),
    Reports("Reports"),
    Settings("Settings")
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
    onSignOut: () -> Unit,
    hasUpdateNotification: Boolean,
    onOpenNotifications: () -> Unit
) {
    val context = LocalContext.current
    var fastLoadEnabled by rememberSaveable { mutableStateOf(isFastLoadEnabled(context)) }
    var selectedTab by rememberSaveable { mutableStateOf(initialShellTab(context)) }
    val shellBg = webBackdrop()

    LaunchedEffect(fastLoadEnabled) {
        if (fastLoadEnabled) {
            selectedTab = ShellTab.Sales
        } else if (selectedTab == ShellTab.Sales && !isFastLoadEnabled(context)) {
            selectedTab = ShellTab.Home
        }
    }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(shellBg)
        ) {
            Box(modifier = Modifier.fillMaxSize().background(backgroundOrbs()))
            Column(modifier = Modifier.fillMaxSize().safeDrawingPadding()) {
                ShellTopBar(
                    state = state,
                    onSignOut = onSignOut,
                    hasUpdateNotification = hasUpdateNotification,
                    onOpenNotifications = onOpenNotifications
                )
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                ) {
                    when (selectedTab) {
                        ShellTab.Home -> HomeDashboard(state, onTabSelected = { selectedTab = it })
                        ShellTab.Sales -> SalesScreen()
                        ShellTab.Inventory -> InventoryScreen()
                        ShellTab.Khata -> KhataScreen()
                        ShellTab.Reports -> ReportsScreen()
                        ShellTab.Settings -> SettingsScreen(
                            state = state,
                            onSignOut = onSignOut,
                            fastLoadEnabled = fastLoadEnabled,
                            onFastLoadChanged = { enabled ->
                                fastLoadEnabled = enabled
                                setFastLoadEnabled(context, enabled)
                            }
                        )
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
    onSignOut: () -> Unit,
    hasUpdateNotification: Boolean,
    onOpenNotifications: () -> Unit
) {
    var profileMenuExpanded by rememberSaveable { mutableStateOf(false) }
    val profileInitial = state.loginEmail.trim().firstOrNull()?.uppercaseChar()?.toString() ?: "K"

    Card(
        modifier = Modifier.padding(horizontal = 16.dp, vertical = 14.dp),
        shape = RoundedCornerShape(32.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.90f))
    ) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                BrandBadge(size = 42.dp)
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        text = "KhataPlus",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Black,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = state.orgName ?: "Your workspace",
                        style = MaterialTheme.typography.bodySmall,
                        color = Color(0xFF475569),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Button(
                    onClick = onOpenNotifications,
                    modifier = Modifier.size(40.dp),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Box {
                        Icon(
                            imageVector = Icons.Filled.Notifications,
                            contentDescription = "Notifications",
                            tint = Color.White
                        )
                        if (hasUpdateNotification) {
                            Box(
                                modifier = Modifier
                                    .align(Alignment.TopEnd)
                                    .size(8.dp)
                                    .clip(CircleShape)
                                    .background(Color(0xFF10B981))
                            )
                        }
                    }
                }
                Box {
                    Button(
                        onClick = { profileMenuExpanded = true },
                        modifier = Modifier.size(40.dp),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text(profileInitial)
                    }
                    DropdownMenu(
                        expanded = profileMenuExpanded,
                        onDismissRequest = { profileMenuExpanded = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Logout") },
                            onClick = {
                                profileMenuExpanded = false
                                onSignOut()
                            }
                        )
                    }
                }
            }
            Card(
                shape = RoundedCornerShape(24.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))
            ) {
                Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Native app shell", color = Color(0xFF0F172A), fontWeight = FontWeight.Black)
                    Text(
                        "Signed in as ${state.loginEmail.ifBlank { "workspace member" }}. The mobile shell uses the same rounded cards, soft gradients, and high-contrast type as the web app.",
                        color = Color(0xFF475569)
                    )
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Pill(text = "Online")
                        Pill(text = state.orgSlug ?: "org pending")
                    }
                }
            }
        }
    }
}

@Composable
private fun BrandBadge(size: androidx.compose.ui.unit.Dp = 40.dp) {
    Image(
        painter = painterResource(R.drawable.ic_launcher_foreground),
        contentDescription = "KhataPlus logo",
        modifier = Modifier.size(size)
    )
}

@Composable
private fun BottomNav(
    selectedTab: ShellTab,
    onTabSelected: (ShellTab) -> Unit
) {
    Surface(
        modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
        color = Color.White.copy(alpha = 0.86f),
        shape = RoundedCornerShape(28.dp),
        tonalElevation = 0.dp,
        shadowElevation = 12.dp
    ) {
        BoxWithConstraints {
            val navItems = listOf(ShellTab.Home, ShellTab.Sales, ShellTab.Inventory, ShellTab.Khata, ShellTab.Settings)
            val itemWidth = maxWidth / navItems.size
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 10.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                navItems.forEach { tab ->
                    val isSelected = selectedTab == tab
                    val icon = when (tab) {
                        ShellTab.Home -> Icons.Filled.Dashboard
                        ShellTab.Sales -> Icons.Filled.CurrencyRupee
                        ShellTab.Inventory -> Icons.Filled.Inventory2
                        ShellTab.Khata -> Icons.Filled.People
                        ShellTab.Settings -> Icons.Filled.Settings
                        ShellTab.Reports -> Icons.Filled.Dashboard
                    }
                    Column(
                        modifier = Modifier
                            .width(itemWidth)
                            .clip(RoundedCornerShape(18.dp))
                            .background(if (isSelected) Color(0xFFE8F5EE) else Color(0xFFF8FAFC))
                            .clickable { onTabSelected(tab) }
                            .padding(horizontal = 8.dp, vertical = 10.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(30.dp)
                                .clip(CircleShape)
                                .background(if (isSelected) Color(0xFF10B981) else Color(0xFFE5E7EB)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = icon,
                                contentDescription = tab.label,
                                tint = if (isSelected) Color.White else Color(0xFF334155),
                                modifier = Modifier.size(16.dp)
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
}

@Composable
private fun HomeDashboard(state: AuthUiState, onTabSelected: (ShellTab) -> Unit) {
    val context = LocalContext.current
    val showToast: (String) -> Unit = { message ->
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }
    var timeRange by rememberSaveable { mutableStateOf("month") }
    var searchOpen by rememberSaveable { mutableStateOf(false) }
    var newMenuExpanded by rememberSaveable { mutableStateOf(false) }
    var searchQuery by rememberSaveable { mutableStateOf("") }

    val stats = listOf(
        ShellStat("Product Range", "184", "Active SKUs", Color(0xFF64748B)),
        ShellStat("Stock Alerts", "09", "Need attention", Color(0xFFF59E0B)),
        ShellStat("Receivables", "₹18,200", "Cash coming in", Color(0xFF10B981)),
        ShellStat("Net Profit", "₹42,480", "+12% vs yesterday", Color(0xFF2563EB))
    )
    val activities = listOf(
        ActivityItem("Invoice #A-204", "New cash sale from counter 2", "₹2,180", Color(0xFFE8F5EE)),
        ActivityItem("Khata update", "Sharma Traders paid partial dues", "₹8,000", Color(0xFFFFF7E5)),
        ActivityItem("Stock alert", "Green tea and sugar are below min stock", "Action needed", Color(0xFFFFE4E6)),
        ActivityItem("Purchase entry", "Oil and rice received from supplier", "₹5,420", Color(0xFFE0F2FE))
    )
    val chartBars = when (timeRange) {
        "today" -> listOf(18, 34, 24, 45, 58, 36, 72, 80, 66)
        "week" -> listOf(28, 44, 38, 62, 71, 58, 83, 68, 54, 75, 65, 48)
        else -> listOf(40, 70, 45, 90, 65, 80, 55, 95, 40, 60, 85, 30, 75, 50, 90, 60, 40, 70, 50)
    }

    if (searchOpen) {
        AlertDialog(
            onDismissRequest = { searchOpen = false },
            title = { Text("Search") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Search customers, items, sales") },
                        singleLine = true
                    )
                    Text(
                        "The PWA search opens a quick lookup. This native screen follows the same flow.",
                        color = Color(0xFF64748B)
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = { searchOpen = false }) {
                    Text("Done")
                }
            }
        )
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 20.dp, vertical = 4.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                OutlinedButton(
                    onClick = { searchOpen = true },
                    modifier = Modifier.weight(1f).height(48.dp),
                    shape = RoundedCornerShape(18.dp)
                ) {
                    Icon(Icons.Filled.Search, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Search")
                }
                Box(modifier = Modifier.weight(1f)) {
                    Button(
                        onClick = { newMenuExpanded = true },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(18.dp)
                    ) {
                        Icon(Icons.Filled.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("New")
                    }
                    DropdownMenu(
                        expanded = newMenuExpanded,
                        onDismissRequest = { newMenuExpanded = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Record Sale") },
                            onClick = {
                                newMenuExpanded = false
                                onTabSelected(ShellTab.Sales)
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Stock In") },
                            onClick = {
                                newMenuExpanded = false
                                onTabSelected(ShellTab.Inventory)
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Khata Entry") },
                            onClick = {
                                newMenuExpanded = false
                                onTabSelected(ShellTab.Khata)
                            }
                        )
                    }
                }
            }
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
            SectionCard(title = "Financial Velocity", subtitle = "Revenue and profit generation stream") {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                        listOf("today" to "Today", "week" to "This Week", "month" to "This Month").forEach { (key, label) ->
                            Pill(
                                text = label,
                                selected = timeRange == key,
                                modifier = Modifier.weight(1f),
                                onClick = { timeRange = key }
                            )
                        }
                    }
                    BoxWithConstraints(modifier = Modifier.fillMaxWidth()) {
                        if (maxWidth < 840.dp) {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                MobileInsightCard(label = "Revenue", value = "₹2.8L", tone = "blue", modifier = Modifier.fillMaxWidth())
                                MobileInsightCard(label = "Profit", value = "₹42,480", tone = "emerald", modifier = Modifier.fillMaxWidth())
                                MobileInsightCard(label = "Stock Alerts", value = "09", tone = "orange", modifier = Modifier.fillMaxWidth())
                            }
                        } else {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(170.dp)
                                    .clip(RoundedCornerShape(22.dp))
                                    .background(Color(0xFFF8FAFC))
                                    .padding(16.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxSize(),
                                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                                    verticalAlignment = Alignment.Bottom
                                ) {
                                    chartBars.forEach { value ->
                                        Box(
                                            modifier = Modifier
                                                .weight(1f)
                                                .height((value * 1.2f).dp)
                                                .clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp))
                                                .background(Brush.verticalGradient(listOf(Color(0xFF10B981), Color(0xFF0EA5E9))))
                                        )
                                    }
                                }
                            }
                        }
                    }
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
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
                PortalGridCard("Analytics", "Financial Pulse", Color(0xFF8B5CF6), Modifier.weight(1f)) {
                    onTabSelected(ShellTab.Reports)
                }
                PortalGridCard("Reports", "Business Files", Color(0xFF3B82F6), Modifier.weight(1f)) {
                    onTabSelected(ShellTab.Reports)
                }
                PortalGridCard("Migration", "Import Hub", Color(0xFFF59E0B), Modifier.weight(1f)) {
                    onTabSelected(ShellTab.Settings)
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
private fun SettingsScreen(
    state: AuthUiState,
    onSignOut: () -> Unit,
    fastLoadEnabled: Boolean,
    onFastLoadChanged: (Boolean) -> Unit
) {
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
                    FastLoadRow(
                        enabled = fastLoadEnabled,
                        onCheckedChange = onFastLoadChanged
                    )
                }
            }
        }
        item {
            SectionCard("Vault & governance", "Build and policy details") {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    SettingsRow("App version", BuildConfig.VERSION_NAME)
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
private fun FastLoadRow(
    enabled: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 14.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.fillMaxWidth(0.78f)) {
                Text("FastLoad", fontWeight = FontWeight.Black, color = Color(0xFF0F172A))
                Text(
                    "Open the app directly on Sales for faster checkout startup.",
                    color = Color(0xFF64748B)
                )
            }
            Switch(checked = enabled, onCheckedChange = onCheckedChange)
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
        shape = RoundedCornerShape(32.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.90f))
    ) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black, color = Color(0xFF0F172A))
                Text(subtitle, color = Color(0xFF475569))
            }
            content()
        }
    }
}

@Composable
private fun SummaryRow(title: String, subtitle: String) {
    Card(
        shape = RoundedCornerShape(32.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.90f))
    ) {
        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(title, color = Color(0xFF0F172A), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
            Text(subtitle, color = Color(0xFF475569))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Pill(text = "Native")
                Pill(text = "Synced")
                Pill(text = "Ready")
            }
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
                        shape = RoundedCornerShape(24.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.92f))
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
                            Text(stat.value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black, color = Color(0xFF0F172A))
                            Text(stat.subtitle, color = Color(0xFF475569))
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
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.90f))
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
                    .background(Brush.linearGradient(listOf(Color(0xFF10B981), Color(0xFF0EA5E9))))
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(label.take(1), color = Color.White, fontWeight = FontWeight.Black)
            }
            Text(
                label,
                color = Color(0xFF0F172A),
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
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.90f))
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(product, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
            Text("In stock", color = Color(0xFF475569))
        }
    }
}

@Composable
private fun ActivityRow(item: ActivityItem, onClick: () -> Unit) {
    Card(
        modifier = Modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.90f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.fillMaxWidth(0.78f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(item.title, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
                Text(item.detail, color = Color(0xFF475569))
            }
            Text(item.amount, fontWeight = FontWeight.Black, color = Color(0xFF0F172A))
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
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.90f))
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(label, color = Color(0xFF64748B), fontWeight = FontWeight.Bold)
            Text(value, fontWeight = FontWeight.Black, color = Color(0xFF0F172A))
        }
    }
}

@Composable
private fun MobileInsightCard(
    label: String,
    value: String,
    tone: String,
    modifier: Modifier = Modifier
) {
    val accent = when (tone) {
        "emerald" -> Color(0xFF10B981)
        "blue" -> Color(0xFF2563EB)
        else -> Color(0xFF0F172A)
    }
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.92f))
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(label, color = Color(0xFF64748B), fontWeight = FontWeight.Bold)
            Text(value, color = accent, fontWeight = FontWeight.Black)
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
        .background(if (selected) Color(0xFFE8F5EE) else Color(0xFFF8FAFC))

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
private fun PortalGridCard(
    title: String,
    subtitle: String,
    accent: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.92f))
    ) {
        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Box(
                modifier = Modifier
                    .clip(CircleShape)
                    .background(accent.copy(alpha = 0.14f))
                    .padding(horizontal = 10.dp, vertical = 6.dp)
            ) {
                Text(title, color = accent, fontWeight = FontWeight.Black)
            }
            Text(subtitle, color = Color(0xFF0F172A), fontWeight = FontWeight.Bold)
            Text("Open", color = Color(0xFF64748B))
        }
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
            Text(label, fontWeight = FontWeight.Bold, color = Color(0xFF0F172A))
            Text(detail, color = Color(0xFF64748B))
        }
        Switch(checked = enabled, onCheckedChange = { enabled = it })
    }
}

private fun isFastLoadEnabled(context: Context): Boolean {
    return context.getSharedPreferences("khataplus_android_shell", Context.MODE_PRIVATE)
        .getBoolean("fastload_enabled", false)
}

private fun setFastLoadEnabled(context: Context, enabled: Boolean) {
    context.getSharedPreferences("khataplus_android_shell", Context.MODE_PRIVATE)
        .edit()
        .putBoolean("fastload_enabled", enabled)
        .apply()
}

private fun initialShellTab(context: Context): ShellTab {
    return if (isFastLoadEnabled(context)) ShellTab.Sales else ShellTab.Home
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

private fun webBackdrop() = Brush.verticalGradient(
    listOf(Color(0xFFC9EFDD), Color(0xFFDEEFFF), Color(0xFFD3E7FB))
)

private fun backgroundOrbs() = Brush.radialGradient(
    colors = listOf(Color(0x3310B981), Color.Transparent),
    center = Offset(0.2f, 0.2f),
    radius = 900f
)

