package online.khataplus.app.data.push

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

object AndroidPushStore {
    private const val PREFS_NAME = "khataplus_android_push"
    private const val KEY_INSTALLATION_ID = "installation_id"
    private const val KEY_ACTIVE_NOTIFICATION = "active_notification"
    private const val KEY_DISMISSED_IDS = "dismissed_release_ids"

    private lateinit var prefs: SharedPreferences
    private val _state = MutableStateFlow(AndroidPushState())
    val state: StateFlow<AndroidPushState> = _state.asStateFlow()

    fun init(context: Context) {
        if (this::prefs.isInitialized) return
        prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val installationId = ensureInstallationId()
        _state.value = AndroidPushState(
            installationId = installationId,
            activeNotification = readActiveNotification(),
            lastTokenUploadAt = prefs.getLong("last_token_upload_at", 0L).takeIf { it > 0L }
        )
    }

    fun installationId(): String {
        check(this::prefs.isInitialized) { "AndroidPushStore not initialized." }
        return ensureInstallationId()
    }

    fun markTokenUploaded() {
        updateState { current ->
            val now = System.currentTimeMillis()
            prefs.edit().putLong("last_token_upload_at", now).apply()
            current.copy(lastTokenUploadAt = now)
        }
    }

    fun storeNotification(notification: AndroidReleaseNotification) {
        updateState { current ->
            val dismissedIds = readDismissedIds()
            if (dismissedIds.contains(notification.id)) {
                current.copy(activeNotification = null)
            } else {
                persistNotification(notification)
                current.copy(activeNotification = notification)
            }
        }
    }

    fun dismissActiveNotification() {
        updateState { current ->
            val active = current.activeNotification ?: return@updateState current
            val dismissedIds = readDismissedIds().toMutableSet()
            dismissedIds.add(active.id)
            prefs.edit()
                .putStringSet(KEY_DISMISSED_IDS, dismissedIds)
                .remove(KEY_ACTIVE_NOTIFICATION)
                .apply()
            current.copy(activeNotification = null)
        }
    }

    fun clearAllNotifications() {
        updateState { current ->
            prefs.edit().remove(KEY_ACTIVE_NOTIFICATION).apply()
            current.copy(activeNotification = null)
        }
    }

    private fun updateState(update: (AndroidPushState) -> AndroidPushState) {
        _state.value = update(_state.value)
    }

    private fun ensureInstallationId(): String {
        val existing = prefs.getString(KEY_INSTALLATION_ID, null)?.trim().orEmpty()
        if (existing.isNotEmpty()) return existing
        val generated = UUID.randomUUID().toString()
        prefs.edit().putString(KEY_INSTALLATION_ID, generated).apply()
        return generated
    }

    private fun readDismissedIds(): Set<String> =
        prefs.getStringSet(KEY_DISMISSED_IDS, emptySet())?.map { it.trim() }?.filter { it.isNotBlank() }?.toSet()
            ?: emptySet()

    private fun persistNotification(notification: AndroidReleaseNotification) {
        val json = JSONObject().apply {
            put("id", notification.id)
            put("version", notification.version)
            put("date", notification.date)
            put("title", notification.title)
            put("summary", notification.summary)
            put("downloadUrl", notification.downloadUrl)
            put("highlights", JSONArray(notification.highlights))
        }
        prefs.edit().putString(KEY_ACTIVE_NOTIFICATION, json.toString()).apply()
    }

    private fun readActiveNotification(): AndroidReleaseNotification? {
        val raw = prefs.getString(KEY_ACTIVE_NOTIFICATION, null) ?: return null
        return runCatching {
            val json = JSONObject(raw)
            AndroidReleaseNotification(
                id = json.optString("id"),
                version = json.optString("version"),
                date = json.optString("date"),
                title = json.optString("title"),
                summary = json.optString("summary"),
                highlights = buildList {
                    val arr = json.optJSONArray("highlights") ?: return@buildList
                    for (index in 0 until arr.length()) {
                        val value = arr.optString(index).trim()
                        if (value.isNotBlank()) add(value)
                    }
                },
                downloadUrl = json.optString("downloadUrl").takeIf { it.isNotBlank() }
            )
        }.getOrNull()?.takeIf { it.id.isNotBlank() && it.version.isNotBlank() }
    }
}
