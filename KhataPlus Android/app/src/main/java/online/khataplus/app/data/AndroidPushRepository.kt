package online.khataplus.app.data

import android.os.Build
import com.google.firebase.messaging.FirebaseMessaging
import kotlinx.coroutines.tasks.await
import online.khataplus.app.BuildConfig
import online.khataplus.app.data.network.PushApi
import online.khataplus.app.data.push.AndroidPushRegistrationRequest
import online.khataplus.app.data.push.AndroidPushStore

class AndroidPushRepository(
    private val pushApi: PushApi
) {
    suspend fun registerInstall(tokenOverride: String? = null): Result<Unit> = runCatching {
        val token = tokenOverride?.trim().orEmpty().ifBlank {
            FirebaseMessaging.getInstance().token.await()
        }
        val response = pushApi.register(
            AndroidPushRegistrationRequest(
                installationId = AndroidPushStore.installationId(),
                fcmToken = token,
                deviceModel = "${Build.MANUFACTURER} ${Build.MODEL}".trim(),
                appVersion = BuildConfig.VERSION_NAME
            )
        )
        if (!response.isSuccessful) {
            throw IllegalStateException("FCM registration failed with HTTP ${response.code()}.")
        }
        AndroidPushStore.markTokenUploaded()
        Unit
    }
}
