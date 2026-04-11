package online.khataplus.app.data

class AndroidPushRepository {
    suspend fun registerInstall(tokenOverride: String? = null): Result<Unit> = Result.success(Unit)
}
