package online.khataplus.app.data.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface AuthApi {
    @POST("api/auth/login")
    suspend fun login(@Body request: AuthOtpRequest): Response<AuthOtpResponse>

    @POST("api/auth/register")
    suspend fun register(@Body request: AuthOtpRequest): Response<AuthOtpResponse>

    @GET("api/auth/context")
    suspend fun context(): Response<AuthContextResponse>

    @POST("api/auth/logout")
    suspend fun logout(@Body request: LogoutRequest = LogoutRequest()): Response<Unit>
}
