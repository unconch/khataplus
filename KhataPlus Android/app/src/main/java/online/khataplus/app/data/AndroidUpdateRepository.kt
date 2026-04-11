package online.khataplus.app.data

import online.khataplus.app.data.network.AndroidReleaseApi
import online.khataplus.app.data.network.AndroidReleaseEntry
import retrofit2.Response

class AndroidUpdateRepository(
    private val updateApi: AndroidReleaseApi
) {
    suspend fun fetchLatestRelease(): Result<AndroidReleaseEntry> =
        runCatching {
            unwrap(updateApi.latestRelease()).latestRelease
        }

    private fun <T> unwrap(response: Response<T>): T {
        if (response.isSuccessful) {
            return requireNotNull(response.body()) { "Empty server response." }
        }
        throw IllegalStateException("Request failed with HTTP ${response.code()}.")
    }
}
