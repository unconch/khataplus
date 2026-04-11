package online.khataplus.app.data.network

import retrofit2.Response
import retrofit2.http.GET

interface AndroidReleaseApi {
    @GET("api/android-release")
    suspend fun latestRelease(): Response<AndroidReleaseManifest>
}

data class AndroidReleaseManifest(
    val latestRelease: AndroidReleaseEntry,
    val releases: List<AndroidReleaseEntry> = emptyList()
)

data class AndroidReleaseEntry(
    val version: String,
    val date: String,
    val summary: String,
    val accent: String = "",
    val notes: List<String> = emptyList(),
    val downloadUrl: String,
    val releaseUrl: String
)
