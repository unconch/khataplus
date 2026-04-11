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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
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
            .background(Brush.verticalGradient(listOf(Color(0xFF0D1B2A), Color(0xFF114B5F)))),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator(color = Color.White)
    }
}

@Composable
private fun AuthScreen(state: AuthUiState, viewModel: AuthViewModel) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Color(0xFFF5F2EB), Color(0xFFE9F5EF))))
            .safeDrawingPadding()
            .verticalScroll(rememberScrollState())
            .padding(20.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Card(
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                Text("KhataPlus Android", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Black)
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    "Native Android auth MVP using the existing KhataPlus OTP APIs.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(20.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    OutlinedButton(onClick = viewModel::showLogin, modifier = Modifier.weight(1f)) { Text("Sign in") }
                    OutlinedButton(onClick = viewModel::showSignup, modifier = Modifier.weight(1f)) { Text("Sign up") }
                }
                Spacer(modifier = Modifier.height(20.dp))

                if (state.mode == AuthMode.LOGIN) {
                    AuthFields(
                        primaryLabel = if (state.loginPhase == AuthPhase.ENTRY) "Send code" else "Verify and sign in",
                        loading = state.loading,
                        message = if (state.loginPhase == AuthPhase.VERIFY) state.loginMessage else null,
                        error = state.loginError,
                        onPrimary = viewModel::submitLogin
                    ) {
                        OutlinedTextField(
                            value = state.loginEmail,
                            onValueChange = viewModel::updateLoginEmail,
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("Email") },
                            singleLine = true,
                            enabled = state.loginPhase == AuthPhase.ENTRY && !state.loading,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next)
                        )
                        if (state.loginPhase == AuthPhase.VERIFY) {
                            Spacer(modifier = Modifier.height(12.dp))
                            OtpField(state.loginCode, viewModel::updateLoginCode, !state.loading)
                        }
                    }
                } else {
                    AuthFields(
                        primaryLabel = if (state.signupPhase == AuthPhase.ENTRY) "Create account" else "Verify and continue",
                        loading = state.loading,
                        message = if (state.signupPhase == AuthPhase.VERIFY) state.signupMessage else null,
                        error = state.signupError,
                        onPrimary = viewModel::submitSignup
                    ) {
                        OutlinedTextField(
                            value = state.signupName,
                            onValueChange = viewModel::updateSignupName,
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("Full name") },
                            singleLine = true,
                            enabled = state.signupPhase == AuthPhase.ENTRY && !state.loading,
                            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Words, imeAction = ImeAction.Next)
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        OutlinedTextField(
                            value = state.signupEmail,
                            onValueChange = viewModel::updateSignupEmail,
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("Email") },
                            singleLine = true,
                            enabled = state.signupPhase == AuthPhase.ENTRY && !state.loading,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next)
                        )
                        if (state.signupPhase == AuthPhase.VERIFY) {
                            Spacer(modifier = Modifier.height(12.dp))
                            OtpField(state.signupCode, viewModel::updateSignupCode, !state.loading)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AuthFields(
    primaryLabel: String,
    loading: Boolean,
    message: String?,
    error: String?,
    onPrimary: () -> Unit,
    fields: @Composable () -> Unit
) {
    fields()
    if (!message.isNullOrBlank()) {
        Spacer(modifier = Modifier.height(12.dp))
        FeedbackCard(message, false)
    }
    if (!error.isNullOrBlank()) {
        Spacer(modifier = Modifier.height(12.dp))
        FeedbackCard(error, true)
    }
    Spacer(modifier = Modifier.height(16.dp))
    Button(onClick = onPrimary, enabled = !loading, modifier = Modifier.fillMaxWidth()) {
        Text(if (loading) "Please wait..." else primaryLabel)
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
