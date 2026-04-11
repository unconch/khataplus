package online.khataplus.app.ui

import androidx.compose.foundation.background
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
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.sp
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import online.khataplus.app.data.AppContainer

@Composable
fun KhataPlusNativeApp(appContainer: AppContainer) {
    val viewModel: AuthViewModel = viewModel(factory = AuthViewModel.factory(appContainer.authRepository))
    val state by viewModel.uiState.collectAsState()

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        when {
            state.checkingSession -> LoadingScreen()
            state.isAuthenticated -> NativeShell(state, viewModel::signOut)
            else -> AuthScreen(state, viewModel)
        }
    }
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
private fun AuthScreen(state: AuthUiState, viewModel: AuthViewModel) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(authBackdrop())
    ) {
        Box(modifier = Modifier.fillMaxSize().background(authBackdropGlowTopLeft()))
        Box(modifier = Modifier.fillMaxSize().background(authBackdropGlowBottomRight()))
        Box(modifier = Modifier.fillMaxSize().background(authBackdropWarmWash()))
        Column(
            modifier = Modifier
                .fillMaxSize()
                .safeDrawingPadding()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp, vertical = 28.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier.fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Card(
                    modifier = Modifier.widthIn(max = 560.dp),
                    shape = RoundedCornerShape(34.dp),
                    colors = CardDefaults.cardColors(containerColor = Color(0xFFF9F7FF))
                ) {
                    Column(
                        modifier = Modifier.padding(horizontal = 22.dp, vertical = 28.dp),
                        verticalArrangement = Arrangement.spacedBy(18.dp)
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
                                style = MaterialTheme.typography.labelLarge.copy(
                                    letterSpacing = 3.4.sp
                                )
                            )
                            Text(
                                text = if (state.mode == AuthMode.LOGIN) "Sign in" else "Create account",
                                style = MaterialTheme.typography.displaySmall,
                                fontWeight = FontWeight.Black,
                                color = Color(0xFF171923)
                            )
                            Text(
                                text = if (state.mode == AuthMode.LOGIN) "Continue to your dashboard" else "Join your dashboard",
                                style = MaterialTheme.typography.bodyLarge,
                                color = Color(0xFF64748B)
                            )
                        }

                        Card(
                            shape = RoundedCornerShape(28.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.84f))
                        ) {
                            Column(
                                modifier = Modifier.padding(horizontal = 18.dp, vertical = 20.dp),
                                verticalArrangement = Arrangement.spacedBy(16.dp)
                            ) {
                                if (state.mode == AuthMode.LOGIN) {
                                    LoginCardFields(
                                        state = state,
                                        viewModel = viewModel
                                    )
                                } else {
                                    SignupCardFields(
                                        state = state,
                                        viewModel = viewModel
                                    )
                                }
                            }
                        }
                    }
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
        onClick = { /* passkey placeholder on native */ },
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
    Box(
        modifier = Modifier
            .size(size)
            .clip(RoundedCornerShape(26.dp))
            .background(
                Brush.linearGradient(listOf(Color(0xFF10B981), Color(0xFF0EA5E9)))
            )
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(size * 0.10f)
                .clip(RoundedCornerShape(22.dp))
                .background(Color.White.copy(alpha = 0.92f))
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(22.dp))
                    .background(Color.Transparent)
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(start = size * 0.16f, top = size * 0.15f, end = size * 0.58f, bottom = size * 0.15f)
                    .clip(RoundedCornerShape(0.dp))
                    .background(Color(0xFF0F172A).copy(alpha = 0.14f))
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(start = size * 0.40f, top = size * 0.15f, end = size * 0.12f, bottom = size * 0.15f)
                    .background(Color.White)
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(start = size * 0.38f, top = size * 0.28f, end = size * 0.20f, bottom = size * 0.52f)
                    .background(Color(0xFFCBD5E1), RoundedCornerShape(999.dp))
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(start = size * 0.38f, top = size * 0.46f, end = size * 0.31f, bottom = size * 0.34f)
                    .background(Color(0xFFCBD5E1), RoundedCornerShape(999.dp))
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(start = size * 0.38f, top = size * 0.64f, end = size * 0.24f, bottom = size * 0.16f)
                    .background(Color(0xFFCBD5E1), RoundedCornerShape(999.dp))
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(start = size * 0.44f, top = size * 0.44f, end = size * 0.20f, bottom = size * 0.36f)
                    .background(Color(0xFF10B981), RoundedCornerShape(999.dp))
            )
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(start = size * 0.58f, top = size * 0.29f, end = size * 0.30f, bottom = size * 0.49f)
                    .background(Color(0xFF10B981), RoundedCornerShape(999.dp))
            )
        }
    }
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
