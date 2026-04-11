package online.khataplus.app.data.network

data class LogoutRequest(
    val returnTo: String = "/auth/login"
)
