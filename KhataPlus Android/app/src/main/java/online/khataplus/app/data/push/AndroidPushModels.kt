package online.khataplus.app.data.push

data class AndroidReleaseNotification(
    val id: String,
    val version: String,
    val date: String,
    val title: String,
    val summary: String,
    val highlights: List<String>,
    val downloadUrl: String?
)

data class AndroidPushState(
    val installationId: String = "",
    val activeNotification: AndroidReleaseNotification? = null,
    val lastTokenUploadAt: Long? = null
)

data class AndroidPushRegistrationRequest(
    val installationId: String,
    val fcmToken: String,
    val deviceModel: String? = null,
    val appVersion: String? = null
)

data class AndroidPushRegistrationResponse(
    val ok: Boolean = true,
    val installationId: String? = null
)

data class AndroidPushBroadcastRequest(
    val id: String,
    val version: String,
    val date: String? = null,
    val title: String,
    val summary: String,
    val highlights: List<String> = emptyList(),
    val downloadUrl: String? = null
)
