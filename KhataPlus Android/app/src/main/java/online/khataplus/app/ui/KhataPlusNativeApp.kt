package online.khataplus.app.ui

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.foundation.Image
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import online.khataplus.app.data.AppContainer
import online.khataplus.app.data.push.AndroidPushStore
import online.khataplus.app.R

@Composable
fun KhataPlusNativeApp(appContainer: AppContainer) {
    val viewModel: AuthViewModel = viewModel(
        factory = AuthViewModel.factory(
            appContainer.authRepository,
            appContainer.androidUpdateRepository
        )
    )
    val state by viewModel.uiState.collectAsState()
    val pushState by AndroidPushStore.state.collectAsState()
    val context = LocalContext.current
    var notificationCenterOpen by rememberSaveable { mutableStateOf(false) }
    val activeNotification = pushState.activeNotification
    val hasUpdateNotification = activeNotification != null

    LaunchedEffect(Unit) {
        runCatching {
            appContainer.androidPushRepository.registerInstall()
        }
    }

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        when {
            state.checkingSession -> LoadingScreen()
            state.isAuthenticated -> NativeShell(
                state = state,
                onSignOut = viewModel::signOut,
                hasUpdateNotification = hasUpdateNotification,
                onOpenNotifications = { notificationCenterOpen = true }
            )
            else -> AuthScreen(
                state = state,
                viewModel = viewModel
            )
        }
    }

    if (notificationCenterOpen) {
        if (activeNotification != null) {
            UpdateAvailableDialog(
                version = activeNotification.version,
                date = activeNotification.date,
                title = activeNotification.title,
                summary = activeNotification.summary,
                notes = activeNotification.highlights,
                onLater = {
                    AndroidPushStore.dismissActiveNotification()
                    notificationCenterOpen = false
                },
                onUpdateNow = {
                    val url = activeNotification.downloadUrl
                    if (!url.isNullOrBlank()) {
                        context.startActivity(
                            Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        )
                    }
                    AndroidPushStore.dismissActiveNotification()
                    notificationCenterOpen = false
                }
            )
        } else {
            NoNotificationsDialog(
                onDismiss = { notificationCenterOpen = false }
            )
        }
    }
}

@Composable
private fun UpdateAvailableDialog(
    version: String,
    date: String,
    title: String,
    summary: String,
    notes: List<String>,
    onLater: () -> Unit,
    onUpdateNow: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onLater,
        title = {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(title)
                Text(
                    text = "Version $version${if (date.isBlank()) "" else " - $date"}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color(0xFF64748B)
                )
            }
        },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(summary)
                if (notes.isNotEmpty()) {
                    notes.take(3).forEach { note ->
                        Text("- $note", style = MaterialTheme.typography.bodyMedium)
                    }
                }
            }
        },
        confirmButton = {
            Button(onClick = onUpdateNow) {
                Text("Install")
            }
        },
        dismissButton = {
            TextButton(onClick = onLater) {
                Text("Later")
            }
        }
    )
}

@Composable
private fun NotificationCenterButton(
    hasUpdateNotification: Boolean,
    onOpenNotifications: () -> Unit
) {
    OutlinedButton(onClick = onOpenNotifications) {
        Text(if (hasUpdateNotification) "Notifications (1)" else "Notifications")
    }
}

@Composable
private fun NoNotificationsDialog(
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Notifications") },
        text = {
            Text("No new update notifications right now.")
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Done")
            }
        }
    )
}

@Composable
private fun LoadingScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(webBackdrop()),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(18.dp)) {
            BrandBadge()
            CircularProgressIndicator(color = Color(0xFF10B981))
        }
    }
}

@Composable
private fun AuthScreen(
    state: AuthUiState,
    viewModel: AuthViewModel
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(authBackdrop())
    ) {
        Box(modifier = Modifier.fillMaxSize().background(authBackdropGlowTopLeft()))
        Box(modifier = Modifier.fillMaxSize().background(authBackdropGlowBottomRight()))
        Box(modifier = Modifier.fillMaxSize().background(authBackdropWarmWash()))
        BoxWithConstraints(
            modifier = Modifier
                .fillMaxSize()
                .safeDrawingPadding()
                .padding(horizontal = 12.dp, vertical = 12.dp)
        ) {
            val cardWidth = if (maxWidth > 480.dp) 480.dp else maxWidth

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.Center
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 18.dp),
                    contentAlignment = Alignment.TopStart
                ) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        BrandBadge(size = 24.dp)
                        Column(verticalArrangement = Arrangement.spacedBy(1.dp)) {
                            Text("KhataPlus", fontWeight = FontWeight.Black, color = Color(0xFF111827))
                            Text(
                                if (state.mode == AuthMode.LOGIN) "Secure login" else "Create account",
                                color = Color(0xFF64748B)
                            )
                        }
                    }
                }

                Box(
                    modifier = Modifier.fillMaxWidth(),
                    contentAlignment = Alignment.Center
                ) {
                    Card(
                        modifier = Modifier.widthIn(max = cardWidth),
                        shape = RoundedCornerShape(34.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF9F7FF))
                    ) {
                        AuthForm(state = state, viewModel = viewModel)
                    }
                }
            }
        }
    }
}

@Composable
private fun AuthForm(
    state: AuthUiState,
    viewModel: AuthViewModel
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 18.dp, vertical = 18.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Text(
                text = "SECURE LOGIN",
                color = Color(0xFF4F46E5),
                fontWeight = FontWeight.Black,
                style = MaterialTheme.typography.labelLarge.copy(letterSpacing = 3.4.sp)
            )
            Text(
                text = if (state.mode == AuthMode.LOGIN) "Sign in" else "Create account",
                style = MaterialTheme.typography.displaySmall,
                fontWeight = FontWeight.Black,
                color = Color(0xFF111827)
            )
            Text(
                text = if (state.mode == AuthMode.LOGIN) "Continue to your dashboard" else "Join your workspace",
                style = MaterialTheme.typography.bodyLarge,
                color = Color(0xFF64748B)
            )
        }

        Card(
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.90f))
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 18.dp, vertical = 18.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (state.mode == AuthMode.LOGIN) {
                    LoginCardFields(state = state, viewModel = viewModel)
                } else {
                    SignupCardFields(state = state, viewModel = viewModel)
                }
            }
        }
    }
}


@Composable
private fun LoginCardFields(
    state: AuthUiState,
    viewModel: AuthViewModel
) {
    val context = LocalContext.current
    Text(
        text = "EMAIL",
        color = Color(0xFF64748B),
        fontWeight = FontWeight.Black,
        style = MaterialTheme.typography.labelLarge.copy(letterSpacing = 2.8.sp)
    )
    OutlinedTextField(
        value = state.loginEmail,
        onValueChange = viewModel::updateLoginEmail,
        modifier = Modifier.fillMaxWidth(),
        placeholder = { Text("you@shop.com") },
        singleLine = true,
        enabled = state.loginPhase == AuthPhase.ENTRY && !state.loading,
        shape = RoundedCornerShape(22.dp),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next)
    )
    if (state.loginPhase == AuthPhase.VERIFY) {
        Text(
            text = state.loginMaskedEmail?.let { "Code sent to $it" } ?: "Enter the verification code",
            color = Color(0xFF475569),
            fontWeight = FontWeight.Medium
        )
        OtpField(state.loginCode, viewModel::updateLoginCode, !state.loading)
    }
    if (!state.loginMessage.isNullOrBlank() && state.loginPhase == AuthPhase.VERIFY) {
        FeedbackCard(state.loginMessage!!, false)
    }
    if (!state.loginError.isNullOrBlank()) {
        FeedbackCard(state.loginError!!, true)
    }
    Button(
        onClick = viewModel::submitLogin,
        enabled = !state.loading,
        modifier = Modifier.fillMaxWidth().height(56.dp),
        shape = RoundedCornerShape(18.dp)
    ) {
        Text(if (state.loading) "Please wait..." else if (state.loginPhase == AuthPhase.ENTRY) "Continue" else "Continue")
    }
    OutlinedButton(
        onClick = { Toast.makeText(context, "Passkey sign-in is not enabled on Android yet.", Toast.LENGTH_SHORT).show() },
        enabled = !state.loading,
        modifier = Modifier.fillMaxWidth().height(56.dp),
        shape = RoundedCornerShape(18.dp)
    ) {
        Text("Use Passkey")
    }
    if (state.loginPhase == AuthPhase.VERIFY) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
            OutlinedButton(
                onClick = viewModel::resendLoginCode,
                enabled = !state.loading,
                modifier = Modifier.weight(1f).height(48.dp),
                shape = RoundedCornerShape(18.dp)
            ) { Text("Resend") }
            OutlinedButton(
                onClick = viewModel::changeLoginContact,
                enabled = !state.loading,
                modifier = Modifier.weight(1f).height(48.dp),
                shape = RoundedCornerShape(18.dp)
            ) { Text("Change") }
        }
    }
    HorizontalDivider(color = Color(0xFFE5E7EB))
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text("New here?", color = Color(0xFF64748B))
        OutlinedButton(
            onClick = viewModel::showSignup,
            enabled = !state.loading,
            shape = RoundedCornerShape(12.dp)
        ) { Text("Create account") }
    }
}

@Composable
private fun SignupCardFields(
    state: AuthUiState,
    viewModel: AuthViewModel
) {
    Text(
        text = "FULL NAME",
        color = Color(0xFF64748B),
        fontWeight = FontWeight.Black,
        style = MaterialTheme.typography.labelLarge.copy(letterSpacing = 2.8.sp)
    )
    OutlinedTextField(
        value = state.signupName,
        onValueChange = viewModel::updateSignupName,
        modifier = Modifier.fillMaxWidth(),
        placeholder = { Text("Your name") },
        singleLine = true,
        enabled = state.signupPhase == AuthPhase.ENTRY && !state.loading,
        shape = RoundedCornerShape(22.dp),
        keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words, imeAction = ImeAction.Next)
    )
    Text(
        text = "EMAIL",
        color = Color(0xFF64748B),
        fontWeight = FontWeight.Black,
        style = MaterialTheme.typography.labelLarge.copy(letterSpacing = 2.8.sp)
    )
    OutlinedTextField(
        value = state.signupEmail,
        onValueChange = viewModel::updateSignupEmail,
        modifier = Modifier.fillMaxWidth(),
        placeholder = { Text("you@shop.com") },
        singleLine = true,
        enabled = state.signupPhase == AuthPhase.ENTRY && !state.loading,
        shape = RoundedCornerShape(22.dp),
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next)
    )
    if (state.signupPhase == AuthPhase.VERIFY) {
        Text(
            text = state.signupMaskedEmail?.let { "Code sent to $it" } ?: "Enter the verification code",
            color = Color(0xFF475569),
            fontWeight = FontWeight.Medium
        )
        OtpField(state.signupCode, viewModel::updateSignupCode, !state.loading)
    }
    if (!state.signupMessage.isNullOrBlank() && state.signupPhase == AuthPhase.VERIFY) {
        FeedbackCard(state.signupMessage!!, false)
    }
    if (!state.signupError.isNullOrBlank()) {
        FeedbackCard(state.signupError!!, true)
    }
    Button(
        onClick = viewModel::submitSignup,
        enabled = !state.loading,
        modifier = Modifier.fillMaxWidth().height(56.dp),
        shape = RoundedCornerShape(18.dp)
    ) {
        Text(if (state.loading) "Please wait..." else if (state.signupPhase == AuthPhase.ENTRY) "Create account" else "Continue")
    }
    if (state.signupPhase == AuthPhase.VERIFY) {
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
            OutlinedButton(
                onClick = viewModel::resendSignupCode,
                enabled = !state.loading,
                modifier = Modifier.weight(1f).height(48.dp),
                shape = RoundedCornerShape(18.dp)
            ) { Text("Resend") }
            OutlinedButton(
                onClick = viewModel::changeSignupContact,
                enabled = !state.loading,
                modifier = Modifier.weight(1f).height(48.dp),
                shape = RoundedCornerShape(18.dp)
            ) { Text("Change") }
        }
    }
    HorizontalDivider(color = Color(0xFFE5E7EB))
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Text("Already here?", color = Color(0xFF64748B))
        OutlinedButton(
            onClick = viewModel::showLogin,
            enabled = !state.loading,
            shape = RoundedCornerShape(12.dp)
        ) { Text("Sign in") }
    }
}

@Composable
private fun OtpField(value: String, onValueChange: (String) -> Unit, enabled: Boolean) {
    OutlinedTextField(
        value = value,
        onValueChange = { onValueChange(it.filter(Char::isDigit).take(6)) },
        modifier = Modifier.fillMaxWidth(),
        label = { Text("Verification code") },
        singleLine = true,
        enabled = enabled,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword, imeAction = ImeAction.Done)
    )
}

@Composable
private fun FeedbackCard(message: String, isError: Boolean) {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = if (isError) Color(0xFFFFE7E7) else Color(0xFFE7F8ED)
        )
    ) {
        Text(
            text = message,
            modifier = Modifier.padding(12.dp),
            color = if (isError) Color(0xFF9F1239) else Color(0xFF166534)
        )
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

private fun webBackdrop() = Brush.verticalGradient(listOf(Color(0xFFC9EFDD), Color(0xFFDEEFFF), Color(0xFFD3E7FB)))

private fun authBackdrop() = Brush.linearGradient(
    colors = listOf(
        Color(0xFFF7F0E7),
        Color(0xFFF4F1F7),
        Color(0xFFEDE5FB)
    ),
    start = Offset.Zero,
    end = Offset.Infinite
)

private fun authBackdropGlowTopLeft() = Brush.radialGradient(
    colors = listOf(Color(0xCC6F46F3), Color(0x806D4AF0), Color.Transparent),
    center = Offset(0.12f, 0.18f),
    radius = 980f
)

private fun authBackdropGlowBottomRight() = Brush.radialGradient(
    colors = listOf(Color(0xAA7B61F4), Color(0x558B6CF6), Color.Transparent),
    center = Offset(0.90f, 0.92f),
    radius = 900f
)

private fun authBackdropWarmWash() = Brush.radialGradient(
    colors = listOf(Color(0x66FFF5D7), Color(0x44FFF3E8), Color.Transparent),
    center = Offset(0.72f, 0.20f),
    radius = 760f
)
