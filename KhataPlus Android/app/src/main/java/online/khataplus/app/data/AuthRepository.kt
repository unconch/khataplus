package online.khataplus.app.data

import online.khataplus.app.data.network.AuthApi
import online.khataplus.app.data.network.AuthContextResponse
import online.khataplus.app.data.network.AuthOtpRequest
import online.khataplus.app.data.network.AuthOtpResponse
import online.khataplus.app.data.network.PersistentCookieJar
import retrofit2.Response

class AuthRepository(
    private val authApi: AuthApi,
    private val cookieJar: PersistentCookieJar
) {
    suspend fun sendLoginCode(email: String): Result<AuthOtpResponse> =
        runCatching {
            unwrap(authApi.login(AuthOtpRequest(email = email, code = "", next = "/app/dashboard")))
        }

    suspend fun verifyLoginCode(email: String, code: String): Result<AuthOtpResponse> =
        runCatching {
            unwrap(authApi.login(AuthOtpRequest(email = email, code = code, next = "/app/dashboard")))
        }

    suspend fun sendSignupCode(name: String, email: String): Result<AuthOtpResponse> =
        runCatching {
            unwrap(authApi.register(AuthOtpRequest(name = name, email = email, code = "", next = "/onboarding")))
        }

    suspend fun verifySignupCode(name: String, email: String, code: String): Result<AuthOtpResponse> =
        runCatching {
            unwrap(authApi.register(AuthOtpRequest(name = name, email = email, code = code, next = "/onboarding")))
        }

    suspend fun fetchAuthContext(): Result<AuthContextResponse> =
        runCatching { unwrap(authApi.context()) }

    suspend fun logout(): Result<Unit> =
        runCatching {
            try {
                unwrap(authApi.logout())
            } finally {
                cookieJar.clear()
            }
            Unit
        }

    private fun <T> unwrap(response: Response<T>): T {
        if (response.isSuccessful) {
            return requireNotNull(response.body()) { "Empty server response." }
        }
        throw IllegalStateException("Request failed with HTTP ${response.code()}.")
    }
}
