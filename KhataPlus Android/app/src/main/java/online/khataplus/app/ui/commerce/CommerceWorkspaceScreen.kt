package online.khataplus.app.ui.commerce

import android.widget.Toast
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.horizontalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import online.khataplus.app.R
import online.khataplus.app.ui.AuthUiState

private enum class WorkspaceTab(val label: String) {
    Home("HOME"),
    Sales("SALES"),
    Items("ITEMS"),
    Khata("KHATA"),
    Settings("SETTINGS"),
    Reports("REPORTS")
}

private enum class SettingsSection(val label: String) {
    Identity("Identity"),
    Organization("Organization"),
    Team("Team"),
    Governance("Vault & Governance")
}

private data class Stat(val label: String, val value: String, val note: String, val tint: Color)
private data class Activity(val title: String, val detail: String, val amount: String, val tone: Color)

@Composable
fun CommerceWorkspaceScreen(state: AuthUiState, onSignOut: () -> Unit) {
    var activeTab by rememberSaveable { mutableStateOf(WorkspaceTab.Home) }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(
                        listOf(Color(0xFFF2F3F5), Color(0xFFF7F1EA), Color(0xFFEAF5EF))
                    )
                )
                .safeDrawingPadding()
        ) {
            WorkspaceHeader(state = state, onSignOut = onSignOut)
            Box(modifier = Modifier.weight(1f).fillMaxWidth()) {
                when (activeTab) {
                    WorkspaceTab.Home -> HomeDashboard(
                        onOpenReports = { activeTab = WorkspaceTab.Reports },
                        onOpenSales = { activeTab = WorkspaceTab.Sales },
                        onOpenItems = { activeTab = WorkspaceTab.Items },
                        onOpenKhata = { activeTab = WorkspaceTab.Khata }
                    )
                    WorkspaceTab.Sales -> SalesScreen()
                    WorkspaceTab.Items -> ItemsScreen()
                    WorkspaceTab.Khata -> KhataScreen()
                    WorkspaceTab.Settings -> SettingsScreen(state = state, onSignOut = onSignOut)
                    WorkspaceTab.Reports -> ReportsScreen()
                }
            }
            BottomNav(selectedTab = activeTab, onTabSelected = { activeTab = it })
        }
    }
}

@Composable
private fun WorkspaceHeader(state: AuthUiState, onSignOut: () -> Unit) {
    var notificationsOpen by remember { mutableStateOf(false) }
    var profileOpen by remember { mutableStateOf(false) }
    val notifications = remember {
        listOf("New release available", "Daily sales snapshot ready", "Khata reminder due today")
    }

    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                Image(
                    painter = painterResource(R.drawable.ic_launcher_foreground),
                    contentDescription = null,
                    modifier = Modifier.size(30.dp)
                )
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text("KhataPlus", fontWeight = FontWeight.Black)
                    Text(
                        text = state.orgName ?: "Your workspace",
                        color = Color(0xFF64748B),
                        style = MaterialTheme.typography.labelSmall,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Box {
                    OutlinedButton(onClick = { notificationsOpen = true }) { Text("Notifications") }
                    DropdownMenu(expanded = notificationsOpen, onDismissRequest = { notificationsOpen = false }) {
                        notifications.forEach { item ->
                            DropdownMenuItem(text = { Text(item) }, onClick = { notificationsOpen = false })
                        }
                    }
                }
                Box {
                    OutlinedButton(onClick = { profileOpen = true }) { Text("Profile") }
                    DropdownMenu(expanded = profileOpen, onDismissRequest = { profileOpen = false }) {
                        DropdownMenuItem(text = { Text(state.loginEmail.ifBlank { "Account" }) }, onClick = { profileOpen = false })
                        DropdownMenuItem(text = { Text("Logout") }, onClick = { profileOpen = false; onSignOut() })
                    }
                }
            }
        }

        Card(
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.85f))
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(
                    text = state.orgSlug ?: "mobile workspace",
                    color = Color(0xFF6B7280),
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Bold
                )
                Text("Everything is synced and ready.", fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleMedium)
                Text(
                    text = "Use the tabs below to move through sales, stock, khata, and settings.",
                    color = Color(0xFF475569)
                )
            }
        }
    }
}

@Composable
private fun BottomNav(selectedTab: WorkspaceTab, onTabSelected: (WorkspaceTab) -> Unit) {
    val tabs = listOf(WorkspaceTab.Home, WorkspaceTab.Sales, WorkspaceTab.Items, WorkspaceTab.Khata, WorkspaceTab.Settings)
    Surface(color = Color.White.copy(alpha = 0.98f), tonalElevation = 8.dp) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 8.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            tabs.forEach { tab ->
                val selected = tab == selectedTab
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(18.dp))
                        .background(if (selected) Color(0xFFE8F5EE) else Color(0xFFF8FAFC))
                        .clickable { onTabSelected(tab) }
                        .padding(vertical = 10.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(if (selected) Color(0xFF10B981) else Color(0xFFE5E7EB))
                            .padding(horizontal = 8.dp, vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(tab.label.take(1), color = if (selected) Color.White else Color(0xFF0F172A), fontWeight = FontWeight.Black)
                    }
                    Text(
                        text = tab.label,
                        color = if (selected) Color(0xFF065F46) else Color(0xFF334155),
                        fontWeight = if (selected) FontWeight.Black else FontWeight.Medium,
                        style = MaterialTheme.typography.labelSmall
                    )
                }
            }
        }
    }
}

@Composable
private fun HomeDashboard(
    onOpenReports: () -> Unit,
    onOpenSales: () -> Unit,
    onOpenItems: () -> Unit,
    onOpenKhata: () -> Unit
) {
    val context = LocalContext.current
    val toast: (String) -> Unit = { Toast.makeText(context, it, Toast.LENGTH_SHORT).show() }
    var newMenuOpen by remember { mutableStateOf(false) }
    var range by rememberSaveable { mutableStateOf("Today") }

    val stats = listOf(
        Stat("Product Range", "184", "+7 this week", Color(0xFF10B981)),
        Stat("Stock Alerts", "09", "Reorder now", Color(0xFFF59E0B)),
        Stat("Receivables", "₹18,200", "14 parties waiting", Color(0xFF2563EB)),
        Stat("Net Profit", "₹42,480", "+12% vs yesterday", Color(0xFF8B5CF6))
    )
    val activities = listOf(
        Activity("Invoice #A-204", "New cash sale from counter 2", "₹2,180", Color(0xFFE8F5EE)),
        Activity("Khata update", "Sharma Traders paid partial dues", "₹8,000", Color(0xFFFFF7E5)),
        Activity("Stock alert", "Green tea and sugar are below min stock", "Action needed", Color(0xFFFFE4E6))
    )

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp, vertical = 4.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                Button(onClick = { toast("Search is ready") }, modifier = Modifier.weight(1f)) { Text("Search") }
                Box(modifier = Modifier.weight(1f)) {
                    Button(onClick = { newMenuOpen = true }, modifier = Modifier.fillMaxWidth()) { Text("New") }
                    DropdownMenu(expanded = newMenuOpen, onDismissRequest = { newMenuOpen = false }) {
                        DropdownMenuItem(text = { Text("Record Sale") }, onClick = { newMenuOpen = false; onOpenSales() })
                        DropdownMenuItem(text = { Text("Add Stock") }, onClick = { newMenuOpen = false; onOpenItems() })
                        DropdownMenuItem(text = { Text("Khata Entry") }, onClick = { newMenuOpen = false; onOpenKhata() })
                    }
                }
            }
        }
        item { StatGrid(stats) }
        item {
            SectionCard("Financial Velocity", "Revenue and profit generation stream") {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    ChipRow(listOf("Today", "This Week", "This Month"), range) { range = it }
                    InsightGrid(
                        listOf("Revenue" to "₹2.8L", "Profit" to "₹42,480", "Stock Alerts" to "09"),
                        columns = 3
                    )
                }
            }
        }
        item {
            SectionCard("Global Activity Stream", "Latest business movement") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    activities.forEach { ActivityRow(it) { toast("Open ${it.title}") } }
                }
            }
        }
        item {
            PortalGrid(
                listOf(
                    PortalItem("Analytics", "Financial Pulse", Color(0xFF8B5CF6)) { toast("Analytics opened") },
                    PortalItem("Reports", "Business Files", Color(0xFF2563EB), onOpenReports),
                    PortalItem("Migration", "Import Hub", Color(0xFFF59E0B)) { toast("Migration opened") }
                )
            )
        }
    }
}

@Composable
private fun SalesScreen() {
    val context = LocalContext.current
    val toast: (String) -> Unit = { Toast.makeText(context, it, Toast.LENGTH_SHORT).show() }
    val products = listOf("Milk", "Tea", "Rice", "Sugar", "Biscuits", "Oil", "Flour", "Soap")
    val cart = listOf("Fresh Milk x 4" to "₹240", "Sugar 1kg x 2" to "₹110", "Basmati rice x 1" to "₹620")

    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp, vertical = 4.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionCard("Point of sale", "Fast checkout for the counter") {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    ChipRow(listOf("Cash ₹1,320", "Card ₹860", "UPI ₹2,440"), "Cash ₹1,320") { toast(it) }
                    Text("Search products, tap to add, and keep the checkout flow quick for Android devices.", color = Color(0xFF475569))
                }
            }
        }
        item {
            SectionCard("Popular items", "Tap an item to stage a sale") {
                GridCards(products, "In stock") { toast("Added $it to the cart") }
                Spacer(modifier = Modifier.height(2.dp))
                Text("Products are live placeholders for now, but each tap behaves like a real add-to-cart action.", color = Color(0xFF475569))
            }
        }
        item {
            SectionCard("Cart", "Ready to bill") {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    cart.forEach { (name, price) -> Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text(name); Text(price, fontWeight = FontWeight.Bold) } }
                    Text("────────────────────────────────", color = Color(0xFFE2E8F0))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) { Text("Total"); Text("₹970", fontWeight = FontWeight.Black) }
                    Button(onClick = { toast("Complete Sale is a placeholder action for now") }, modifier = Modifier.fillMaxWidth()) { Text("Complete Sale") }
                }
            }
        }
    }
}

@Composable
private fun ItemsScreen() {
    val rows = listOf("Milk" to "24 left", "Tea" to "31 left", "Rice" to "12 left", "Sugar" to "06 left", "Oil" to "15 left")
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp, vertical = 4.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionCard("Inventory", "Stock health at a glance") {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    InsightGrid(listOf("Total SKUs" to "184", "Low stock" to "09", "New items" to "17"), columns = 3)
                    Text("Keep the stockroom tight with quick restock cues and visible thresholds for Android use.", color = Color(0xFF475569))
                }
            }
        }
        item {
            SectionCard("Low stock list", "Needs attention") {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    rows.forEach { StockRow(it.first, it.second) }
                }
            }
        }
    }
}

@Composable
private fun KhataScreen() {
    val ledger = listOf("Sharma Traders" to "₹18,200 due", "Brahmaputra Store" to "₹4,500 due", "Gupta Mart" to "₹1,180 due")
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp, vertical = 4.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionCard("Khata", "Balances and collections") {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    InsightGrid(listOf("To collect" to "₹23,880", "To pay" to "₹7,400"), columns = 2)
                    Text("Track receivables and keep the ledger moving from the phone.", color = Color(0xFF475569))
                }
            }
        }
        item {
            SectionCard("Party balances", "Most active accounts") {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    ledger.forEach { LedgerRow(it.first, it.second) }
                }
            }
        }
    }
}

@Composable
private fun ReportsScreen() {
    var selected by rememberSaveable { mutableStateOf("Today") }
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp, vertical = 4.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            SectionCard("Reports", "Daily, weekly, monthly") {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    ChipRow(listOf("Today", "7D", "30D", "FY"), selected) { selected = it }
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        StatLine("Revenue", "₹2.8L")
                        StatLine("Margin", "18.4%")
                        StatLine("Returns", "3.2%")
                        StatLine("GST ready", "Yes")
                    }
                }
            }
        }
        item {
            SectionCard("Trend", "Simple native summary") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    ProgressRow("Sales", 0.92f, Color(0xFF10B981))
                    ProgressRow("Collections", 0.74f, Color(0xFF2563EB))
                    ProgressRow("Expenses", 0.51f, Color(0xFFF59E0B))
                }
            }
        }
    }
}

@Composable
private fun SettingsScreen(state: AuthUiState, onSignOut: () -> Unit) {
    var selected by rememberSaveable { mutableStateOf(SettingsSection.Identity) }
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 16.dp, vertical = 4.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item { ChipRow(SettingsSection.entries.map { it.label }, selected.label) { selected = SettingsSection.entries.first { section -> section.label == it } } }
        item {
            when (selected) {
                SettingsSection.Identity -> SectionCard("Personal Identity", "Calibrate your individual profile and secure signature.") {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        StatLine("Name", state.loginEmail.ifBlank { "Workspace member" })
                        StatLine("Email", state.loginEmail.ifBlank { "not set" })
                        StatLine("Role", "Admin")
                    }
                }
                SettingsSection.Organization -> SectionCard("Organization", "Manage legal entity and operational boundaries.") {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        StatLine("Workspace", state.orgName ?: "Pending")
                        StatLine("Slug", state.orgSlug ?: "pending")
                        StatLine("Session", "Native cookie-backed auth")
                    }
                }
                SettingsSection.Team -> SectionCard("Team Management", "Govern organizational hierarchy and staff access.") {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        StatLine("Owner", "You")
                        StatLine("Managers", "2")
                        StatLine("Staff", "6")
                        Button(onClick = { }, modifier = Modifier.fillMaxWidth()) { Text("Invite teammate") }
                    }
                }
                SettingsSection.Governance -> SectionCard("Vault & Governance", "Administer biometric access and session streams.") {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        StatLine("Security", "Device session active")
                        StatLine("Sync", "Enabled")
                        StatLine("Last refresh", "Just now")
                        Button(onClick = onSignOut, modifier = Modifier.fillMaxWidth()) { Text("Logout") }
                    }
                }
            }
        }
    }
}

@Composable
private fun SectionCard(title: String, subtitle: String, content: @Composable () -> Unit) {
    Card(shape = RoundedCornerShape(26.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Black)
                Text(subtitle, color = Color(0xFF475569))
            }
            content()
        }
    }
}

@Composable
private fun StatGrid(stats: List<Stat>) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        stats.chunked(2).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                row.forEach { stat ->
                    Card(modifier = Modifier.weight(1f), shape = RoundedCornerShape(22.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Box(
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(stat.tint.copy(alpha = 0.15f))
                                    .padding(horizontal = 10.dp, vertical = 6.dp)
                            ) { Text(stat.label, color = stat.tint, fontWeight = FontWeight.Bold) }
                            Text(stat.value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Black)
                            Text(stat.note, color = Color(0xFF475569))
                        }
                    }
                }
                if (row.size == 1) repeat(1) { Spacer(modifier = Modifier.weight(1f)) }
            }
        }
    }
}

@Composable
private fun ChipRow(items: List<String>, selected: String, onSelected: (String) -> Unit) {
    Row(modifier = Modifier.fillMaxWidth().horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        items.forEach { item ->
            val active = selected == item
            Box(
                modifier = Modifier
                    .clip(RoundedCornerShape(999.dp))
                    .background(if (active) Color(0xFFE8F5EE) else Color(0xFFF1F5F9))
                    .clickable { onSelected(item) }
                    .padding(horizontal = 14.dp, vertical = 8.dp)
            ) {
                Text(item, color = if (active) Color(0xFF065F46) else Color(0xFF0F172A), fontWeight = FontWeight.Bold, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
    }
}

@Composable
private fun InsightGrid(items: List<Pair<String, String>>, columns: Int) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        items.chunked(columns).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                row.forEach { (label, value) ->
                    Card(modifier = Modifier.weight(1f), shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(label, color = Color(0xFF64748B), fontWeight = FontWeight.Bold)
                            Text(value, fontWeight = FontWeight.Black)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun PortalGrid(items: List<PortalItem>) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        items.chunked(2).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                row.forEach { item ->
                    Card(
                        modifier = Modifier.weight(1f).clickable { item.onClick() },
                        shape = RoundedCornerShape(22.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White)
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Box(
                                modifier = Modifier
                                    .clip(RoundedCornerShape(14.dp))
                                    .background(item.color.copy(alpha = 0.12f))
                                    .padding(horizontal = 12.dp, vertical = 8.dp)
                            ) { Text(item.title, color = item.color, fontWeight = FontWeight.Black) }
                            Text(item.subtitle, color = Color(0xFF475569))
                        }
                    }
                }
                if (row.size == 1) repeat(1) { Spacer(modifier = Modifier.weight(1f)) }
            }
        }
    }
}

@Composable
private fun GridCards(items: List<String>, subtitle: String, onClick: (String) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        items.chunked(2).forEach { row ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                row.forEach { item ->
                    Card(
                        modifier = Modifier.weight(1f).clickable { onClick(item) },
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF8FAFC))
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(item, fontWeight = FontWeight.Bold)
                            Text(subtitle, color = Color(0xFF64748B))
                        }
                    }
                }
                if (row.size == 1) repeat(1) { Spacer(modifier = Modifier.weight(1f)) }
            }
        }
    }
}

private data class PortalItem(val title: String, val subtitle: String, val color: Color, val onClick: () -> Unit)

@Composable
private fun ActivityRow(item: Activity, onClick: () -> Unit) {
    Card(modifier = Modifier.clickable(onClick = onClick), shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = item.tone)) {
        Row(modifier = Modifier.fillMaxWidth().padding(14.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(item.title, fontWeight = FontWeight.Bold)
                Text(item.detail, color = Color(0xFF475569))
            }
            Text(item.amount, fontWeight = FontWeight.Black)
        }
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
private fun StatLine(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = Color(0xFF64748B))
        Text(value, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun ProgressRow(label: String, fraction: Float, color: Color) {
    Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, fontWeight = FontWeight.Bold)
            Text("${(fraction * 100).toInt()}%", color = color, fontWeight = FontWeight.Black)
        }
        Box(modifier = Modifier.fillMaxWidth().height(10.dp).clip(RoundedCornerShape(999.dp)).background(color.copy(alpha = 0.12f))) {
            Box(modifier = Modifier.fillMaxWidth(fraction).height(10.dp).clip(RoundedCornerShape(999.dp)).background(color))
        }
    }
}

private fun gridItemWidth(totalWidth: Dp, columns: Int, spacing: Dp = 10.dp): Dp {
    return if (columns <= 1) totalWidth else (totalWidth - spacing * (columns - 1)) / columns
}
