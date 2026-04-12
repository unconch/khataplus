package online.khataplus.app.ui

import android.widget.Toast

import androidx.compose.foundation.Image
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import online.khataplus.app.R
import online.khataplus.app.data.AppContainer
import online.khataplus.app.ui.commerce.CommerceWorkspaceScreen

@Composable
fun KhataPlusNativeApp(appContainer: AppContainer) {
    val viewModel: AuthViewModel = viewModel(factory = AuthViewModel.factory(appContainer.authRepository))
    val state by viewModel.uiState.collectAsState()

    Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        when {
            state.checkingSession -> LoadingScreen()
            state.isAuthenticated -> CommerceWorkspaceScreen(state, viewModel::signOut)
            else -> AuthScreen(state, viewModel)
        }
    }
}

@Composable
private fun LoadingScreen() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.radialGradient(
                    colors = listOf(Color(0xFF5B50D7), Color(0xFFF2F3F5)),
                    radius = 1200f
                )
            ),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator(color = Color.White)
    }
}

@Composable
private fun AuthScreen(state: AuthUiState, viewModel: AuthViewModel) {
    val context = LocalContext.current
    val loginMode = state.mode == AuthMode.LOGIN
    val title = if (loginMode) "Sign in" else "Sign up"
    val label = if (loginMode) "SECURE LOGIN" else "CREATE ACCOUNT"
    val subtitle = if (loginMode) "Continue to your dashboard" else "Create your account"

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF2F3F5))
            .background(
                Brush.radialGradient(
                    listOf(
                        Color(0xFF5B50D7),
                        Color.Transparent
                    ),
                    radius = 820f,
                    center = androidx.compose.ui.geometry.Offset(110f, 140f)
                )
            )
            .background(
                Brush.radialGradient(
                    listOf(
                        Color(0xFF5B50D7),
                        Color.Transparent
                    ),
                    radius = 820f,
                    center = androidx.compose.ui.geometry.Offset(780f, 1360f)
                )
            )
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState()),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.Center
        ) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(28.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.92f))
            ) {
                Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(18.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                        Image(
                            painter = painterResource(R.drawable.ic_launcher_foreground),
                            contentDescription = null,
                            modifier = Modifier.height(32.dp)
                        )
                        Column(verticalArrangement = Arrangement.spacedBy(1.dp)) {
                            Text("KhataPlus", fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleLarge)
                            Text(
                                text = label,
                                color = Color(0xFF6B7280),
                                style = MaterialTheme.typography.labelSmall,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }

                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                        Text(label, color = Color(0xFF4F46E5), style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Black)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(title, style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Black)
                        Text(subtitle, color = Color(0xFF64748B))
                    }

                    if (loginMode) {
                        AuthField(
                            label = "EMAIL",
                            value = state.loginEmail,
                            onValueChange = viewModel::updateLoginEmail,
                            enabled = state.loginPhase == AuthPhase.ENTRY && !state.loading,
                            placeholder = "you@shop.com",
                            keyboardType = KeyboardType.Email
                        )
                        if (state.loginPhase == AuthPhase.VERIFY) {
                        AuthField(
                            label = "VERIFICATION CODE",
                            value = state.loginCode,
                            onValueChange = { viewModel.updateLoginCode(it.filter(Char::isDigit).take(6)) },
                            enabled = !state.loading,
                            placeholder = "123456",
                            keyboardType = KeyboardType.NumberPassword,
                            capitalization = KeyboardCapitalization.None
                        )
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text(
                                    text = state.loginMaskedEmail ?: state.loginEmail,
                                    color = Color(0xFF64748B),
                                    style = MaterialTheme.typography.labelSmall
                                )
                                OutlinedButton(onClick = viewModel::showLogin) { Text("Change") }
                            }
                        }
                    } else {
                        AuthField(
                            label = "FULL NAME",
                            value = state.signupName,
                            onValueChange = viewModel::updateSignupName,
                            enabled = state.signupPhase == AuthPhase.ENTRY && !state.loading,
                            placeholder = "Your name",
                            keyboardType = KeyboardType.Text,
                            capitalization = KeyboardCapitalization.Words
                        )
                        AuthField(
                            label = "EMAIL",
                            value = state.signupEmail,
                            onValueChange = viewModel::updateSignupEmail,
                            enabled = state.signupPhase == AuthPhase.ENTRY && !state.loading,
                            placeholder = "you@shop.com",
                            keyboardType = KeyboardType.Email
                        )
                        if (state.signupPhase == AuthPhase.VERIFY) {
                            AuthField(
                            label = "VERIFICATION CODE",
                            value = state.signupCode,
                            onValueChange = { viewModel.updateSignupCode(it.filter(Char::isDigit).take(6)) },
                            enabled = !state.loading,
                            placeholder = "123456",
                            keyboardType = KeyboardType.NumberPassword,
                            capitalization = KeyboardCapitalization.None
                            )
                        }
                    }

                    if (!state.loginMessage.isNullOrBlank() && loginMode) {
                        FeedbackCard(state.loginMessage!!, false)
                    }
                    if (!state.signupMessage.isNullOrBlank() && !loginMode) {
                        FeedbackCard(state.signupMessage!!, false)
                    }
                    if (!state.loginError.isNullOrBlank() && loginMode) {
                        FeedbackCard(state.loginError!!, true)
                    }
                    if (!state.signupError.isNullOrBlank() && !loginMode) {
                        FeedbackCard(state.signupError!!, true)
                    }

                    Button(
                        onClick = if (loginMode) viewModel::submitLogin else viewModel::submitSignup,
                        enabled = !state.loading,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            if (state.loading) "Please wait..." else if (loginMode) {
                                if (state.loginPhase == AuthPhase.ENTRY) "Continue" else "Verify and sign in"
                            } else {
                                if (state.signupPhase == AuthPhase.ENTRY) "Continue" else "Verify and continue"
                            }
                        )
                    }

                    if (loginMode && state.loginPhase == AuthPhase.ENTRY) {
                        OutlinedButton(
                            onClick = {
                                Toast.makeText(context, "Passkey is not set up yet.", Toast.LENGTH_SHORT).show()
                            },
                            enabled = !state.loading,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text("Use Passkey")
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = if (loginMode) "New here?" else "Already have an account?",
                            color = Color(0xFF64748B),
                            style = MaterialTheme.typography.labelSmall
                        )
                        OutlinedButton(
                            onClick = if (loginMode) viewModel::showSignup else viewModel::showLogin
                        ) {
                            Text(if (loginMode) "CREATE ACCOUNT" else "SIGN IN")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AuthField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit,
    enabled: Boolean,
    placeholder: String,
    keyboardType: KeyboardType,
    capitalization: KeyboardCapitalization = KeyboardCapitalization.None
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(label, color = Color(0xFF64748B), style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black)
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            enabled = enabled,
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text(placeholder) },
            singleLine = true,
            shape = RoundedCornerShape(20.dp)
        )
    }
}

@Composable
private fun FeedbackCard(message: String, isError: Boolean) {
    Card(
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
