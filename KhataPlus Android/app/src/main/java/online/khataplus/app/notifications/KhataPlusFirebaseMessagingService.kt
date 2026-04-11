package online.khataplus.app.notifications

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import online.khataplus.app.MainActivity
import online.khataplus.app.R
import online.khataplus.app.data.AppContainer
import online.khataplus.app.data.push.AndroidPushStore
import online.khataplus.app.data.push.AndroidReleaseNotification
import org.json.JSONArray
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class KhataPlusFirebaseMessagingService : FirebaseMessagingService() {
    override fun onCreate() {
        super.onCreate()
        AndroidPushStore.init(applicationContext)
    }

    override fun onNewToken(token: String) {
        super.onNewToken(token)
        AndroidPushStore.init(applicationContext)
        CoroutineScope(Dispatchers.IO).launch {
            runCatching {
                AppContainer(applicationContext).androidPushRepository.registerInstall(token)
            }
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        super.onMessageReceived(message)
        val payload = message.data.toNotificationPayload() ?: return
        AndroidPushStore.storeNotification(payload)
        showSystemNotification(payload)
    }

    private fun Map<String, String>.toNotificationPayload(): AndroidReleaseNotification? {
        val id = get("id")?.trim().orEmpty()
            .ifBlank { "${get("version")?.trim().orEmpty()}-${get("date")?.trim().orEmpty()}" }
        val version = get("version")?.trim().orEmpty()
        val date = get("date")?.trim().orEmpty()
        val title = get("title")?.trim().orEmpty().ifBlank { "Update available" }
        val summary = get("summary")?.trim().orEmpty().ifBlank { "A new KhataPlus Android release is ready." }
        val downloadUrl = get("downloadUrl")?.trim()?.takeIf { it.isNotBlank() }
        val highlights = runCatching {
            JSONArray(get("highlights") ?: "[]").let { arr ->
                buildList {
                    for (index in 0 until arr.length()) {
                        val value = arr.optString(index).trim()
                        if (value.isNotBlank()) add(value)
                    }
                }
            }
        }.getOrDefault(emptyList())

        if (version.isBlank()) return null
        return AndroidReleaseNotification(
            id = id.ifBlank { "release-$version" },
            version = version,
            date = date,
            title = title,
            summary = summary,
            highlights = highlights,
            downloadUrl = downloadUrl
        )
    }

    private fun showSystemNotification(payload: AndroidReleaseNotification) {
        if (Build.VERSION.SDK_INT >= 33) {
            val granted = ContextCompat.checkSelfPermission(this, android.Manifest.permission.POST_NOTIFICATIONS) ==
                PackageManager.PERMISSION_GRANTED
            if (!granted) return
        }

        ensureChannel()

        val openIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra(EXTRA_OPEN_UPDATE_CENTER, true)
        }

        val pendingIntent = PendingIntent.getActivity(
            this,
            payload.id.hashCode(),
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val body = buildString {
            append(payload.summary)
            if (payload.highlights.isNotEmpty()) {
                append(" ")
                append(payload.highlights.first())
            }
        }

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(payload.title)
            .setContentText(body)
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText(body)
            )
            .setColor(Color.parseColor("#10B981"))
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        NotificationManagerCompat.from(this).notify(payload.id.hashCode(), notification)
    }

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val manager = getSystemService(NotificationManager::class.java) ?: return
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return

        val channel = NotificationChannel(
            CHANNEL_ID,
            "KhataPlus updates",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "Important app update alerts"
        }
        manager.createNotificationChannel(channel)
    }

    companion object {
        const val CHANNEL_ID = "khataplus_updates"
        const val EXTRA_OPEN_UPDATE_CENTER = "open_update_center"
    }
}
