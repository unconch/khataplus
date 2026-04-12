package online.khataplus.app.data.network

import online.khataplus.app.data.push.AndroidPushBroadcastRequest
import online.khataplus.app.data.push.AndroidPushRegistrationRequest
import online.khataplus.app.data.push.AndroidPushRegistrationResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface PushApi {
    @POST("api/android/push/register")
    suspend fun register(@Body request: AndroidPushRegistrationRequest): Response<AndroidPushRegistrationResponse>

    @POST("api/android/push/send")
    suspend fun send(@Body request: AndroidPushBroadcastRequest): Response<Unit>
}
