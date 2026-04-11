package online.khataplus.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import online.khataplus.app.data.AuthRepository

enum class AuthMode { LOGIN, SIGNUP, HOME }
enum class AuthPhase { ENTRY, VERIFY }

data class AuthUiState(
    val checkingSession: Boolean = true,
    val loading: Boolean = false,
    val isAuthenticated: Boolean = false,
    val mode: AuthMode = AuthMode.LOGIN,
    val loginPhase: AuthPhase = AuthPhase.ENTRY,
    val signupPhase: AuthPhase = AuthPhase.ENTRY,
    val loginEmail: String = "",
    val loginCode: String = "",
    val loginMaskedEmail: String? = null,
    val loginMessage: String? = null,
    val loginError: String? = null,
    val signupName: String = "",
    val signupEmail: String = "",
    val signupCode: String = "",
    val signupMaskedEmail: String? = null,
    val signupMessage: String? = null,
    val signupError: String? = null,
    val orgName: String? = null,
    val orgSlug: String? = null
)

class AuthViewModel(
    private val repository: AuthRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    init {
        refreshSession()
    }

    fun showLogin() = _uiState.update { it.copy(mode = AuthMode.LOGIN) }

    fun showSignup() = _uiState.update { it.copy(mode = AuthMode.SIGNUP) }

    fun updateLoginEmail(value: String) = _uiState.update {
        it.copy(loginEmail = value, loginError = null, loginMessage = null)
    }

    fun updateLoginCode(value: String) = _uiState.update {
        it.copy(loginCode = value, loginError = null)
    }

    fun updateSignupName(value: String) = _uiState.update {
        it.copy(signupName = value, signupError = null, signupMessage = null)
    }

    fun updateSignupEmail(value: String) = _uiState.update {
        it.copy(signupEmail = value, signupError = null, signupMessage = null)
    }

    fun updateSignupCode(value: String) = _uiState.update {
        it.copy(signupCode = value, signupError = null)
    }

    fun refreshSession() {
        viewModelScope.launch {
            syncSession()
        }
    }

    fun signOut() {
        viewModelScope.launch {
            repository.logout()
                .onSuccess {
                    _uiState.update { it.loggedOutState() }
                }
                .onFailure {
                    _uiState.update { it.loggedOutState() }
                }
        }
    }

    fun submitLogin() {
        val state = uiState.value
        if (state.loginPhase == AuthPhase.ENTRY) {
            sendLoginCode()
        } else {
            verifyLoginCode()
        }
    }

    fun submitSignup() {
        val state = uiState.value
        if (state.signupPhase == AuthPhase.ENTRY) {
            sendSignupCode()
        } else {
            verifySignupCode()
        }
    }

    private fun sendLoginCode() {
        val email = uiState.value.loginEmail.trim().lowercase()
        if (email.isBlank()) {
            _uiState.update { it.copy(loginError = "Enter your email to continue.") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(loading = true, loginError = null, loginMessage = "Sending sign-in code...") }
            repository.sendLoginCode(email)
                .onSuccess { response ->
                    _uiState.update {
                        it.copy(
                            loading = false,
                            loginPhase = AuthPhase.VERIFY,
                            loginMaskedEmail = response.maskedEmail ?: email,
                            loginMessage = "Code sent to ${response.maskedEmail ?: email}"
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(loading = false, loginError = error.message ?: "Could not send sign-in code.", loginMessage = null)
                    }
                }
        }
    }

    private fun verifyLoginCode() {
        val state = uiState.value
        val email = state.loginEmail.trim().lowercase()
        val code = state.loginCode.trim()
        if (code.isBlank()) {
            _uiState.update { it.copy(loginError = "Enter the verification code.") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(loading = true, loginError = null, loginMessage = "Signing you in...") }
            repository.verifyLoginCode(email, code)
                .onSuccess {
                    val authenticated = syncSession()
                    _uiState.update { current ->
                        if (authenticated) {
                            current.copy(
                                loading = false,
                                mode = AuthMode.HOME,
                                loginPhase = AuthPhase.ENTRY,
                                loginCode = "",
                                loginMaskedEmail = null,
                                loginMessage = "Signed in successfully.",
                                loginError = null,
                                signupPhase = AuthPhase.ENTRY,
                                signupCode = "",
                                signupMaskedEmail = null,
                                signupMessage = null,
                                signupError = null
                            )
                        } else {
                            current.copy(
                                loading = false,
                                loginMessage = null,
                                loginError = "Session could not be confirmed."
                            )
                        }
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(loading = false, loginError = error.message ?: "Could not verify sign-in code.")
                    }
                }
        }
    }

    private fun sendSignupCode() {
        val state = uiState.value
        val name = state.signupName.trim()
        val email = state.signupEmail.trim().lowercase()
        if (name.isBlank() || email.isBlank()) {
            _uiState.update { it.copy(signupError = "Name and email are required.") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(loading = true, signupError = null, signupMessage = "Sending signup code...") }
            repository.sendSignupCode(name, email)
                .onSuccess { response ->
                    _uiState.update {
                        it.copy(
                            loading = false,
                            signupPhase = AuthPhase.VERIFY,
                            signupMaskedEmail = response.maskedEmail ?: email,
                            signupMessage = "Code sent to ${response.maskedEmail ?: email}"
                        )
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(loading = false, signupError = error.message ?: "Could not start signup.", signupMessage = null)
                    }
                }
        }
    }

    private fun verifySignupCode() {
        val state = uiState.value
        val name = state.signupName.trim()
        val email = state.signupEmail.trim().lowercase()
        val code = state.signupCode.trim()
        if (code.isBlank()) {
            _uiState.update { it.copy(signupError = "Enter the verification code.") }
            return
        }

        viewModelScope.launch {
            _uiState.update { it.copy(loading = true, signupError = null, signupMessage = "Creating your account...") }
            repository.verifySignupCode(name, email, code)
                .onSuccess {
                    val authenticated = syncSession()
                    _uiState.update { current ->
                        if (authenticated) {
                            current.copy(
                                loading = false,
                                mode = AuthMode.HOME,
                                signupPhase = AuthPhase.ENTRY,
                                signupCode = "",
                                signupMaskedEmail = null,
                                signupMessage = "Account ready.",
                                signupError = null,
                                loginPhase = AuthPhase.ENTRY,
                                loginCode = "",
                                loginMaskedEmail = null,
                                loginMessage = null,
                                loginError = null
                            )
                        } else {
                            current.copy(
                                loading = false,
                                signupMessage = null,
                                signupError = "Session could not be confirmed."
                            )
                        }
                    }
                }
                .onFailure { error ->
                    _uiState.update {
                        it.copy(loading = false, signupError = error.message ?: "Could not verify signup code.")
                    }
            }
        }
    }

    private suspend fun syncSession(): Boolean {
        return repository.fetchAuthContext()
            .onSuccess { auth ->
                _uiState.update { current ->
                    if (auth.isAuthenticated) {
                        current.copy(
                            checkingSession = false,
                            loading = false,
                            isAuthenticated = true,
                            mode = AuthMode.HOME,
                            loginPhase = AuthPhase.ENTRY,
                            signupPhase = AuthPhase.ENTRY,
                            loginMaskedEmail = null,
                            signupMaskedEmail = null,
                            orgName = auth.orgName,
                            orgSlug = auth.orgSlug
                        )
                    } else {
                        current.loggedOutState()
                    }
                }
            }
            .onFailure {
                _uiState.update { it.loggedOutState() }
            }
            .fold(
                onSuccess = { _uiState.value.isAuthenticated },
                onFailure = { false }
            )
    }

    companion object {
        fun factory(repository: AuthRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return AuthViewModel(repository) as T
                }
            }
    }
}

private fun AuthUiState.loggedOutState(): AuthUiState =
    copy(
        checkingSession = false,
        loading = false,
        isAuthenticated = false,
        mode = AuthMode.LOGIN,
        loginPhase = AuthPhase.ENTRY,
        signupPhase = AuthPhase.ENTRY,
        loginEmail = "",
        loginCode = "",
        loginMaskedEmail = null,
        loginMessage = null,
        loginError = null,
        signupName = "",
        signupEmail = "",
        signupCode = "",
        signupMaskedEmail = null,
        signupMessage = null,
        signupError = null,
        orgName = null,
        orgSlug = null
    )
