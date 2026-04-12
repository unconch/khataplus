package online.khataplus.app.ui

import androidx.compose.runtime.Composable
import online.khataplus.app.ui.commerce.CommerceWorkspaceScreen

@Composable
fun NativeShell(
    state: AuthUiState,
    onSignOut: () -> Unit
) {
    CommerceWorkspaceScreen(state = state, onSignOut = onSignOut)
}
