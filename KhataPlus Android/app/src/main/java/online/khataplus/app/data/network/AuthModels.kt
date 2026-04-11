package online.khataplus.app.data.network

data class AuthOtpRequest(
    val name: String? = null,
    val email: String,
    val code: String,
    val next: String
)

data class AuthOtpResponse(
    val ok: Boolean? = null,
    val phase: String? = null,
    val maskedEmail: String? = null,
    val next: String? = null,
    val orgSlug: String? = null,
    val error: String? = null
)

data class AuthContextResponse(
    val isAuthenticated: Boolean = false,
    val isGuest: Boolean = false,
    val orgSlug: String? = null,
    val orgName: String? = null
)
