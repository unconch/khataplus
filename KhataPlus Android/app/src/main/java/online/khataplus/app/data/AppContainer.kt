package online.khataplus.app.data

import android.content.Context
import com.google.gson.Gson
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import online.khataplus.app.BuildConfig
import online.khataplus.app.data.network.AndroidReleaseApi
import online.khataplus.app.data.network.AuthApi
import online.khataplus.app.data.network.PushApi
import online.khataplus.app.data.network.PersistentCookieJar
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class AppContainer(context: Context) {
    val cookieJar = PersistentCookieJar(context)

    private val client = OkHttpClient.Builder()
        .cookieJar(cookieJar)
        .addInterceptor(
            HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BASIC
            }
        )
        .build()

    private val retrofit = Retrofit.Builder()
        .baseUrl(BuildConfig.API_BASE_URL)
        .client(client)
        .addConverterFactory(GsonConverterFactory.create(Gson()))
        .build()

    private val authApi = retrofit.create(AuthApi::class.java)
    private val androidReleaseApi = retrofit.create(AndroidReleaseApi::class.java)
    val pushApi = retrofit.create(PushApi::class.java)

    val authRepository = AuthRepository(authApi, cookieJar)
    val androidUpdateRepository = AndroidUpdateRepository(androidReleaseApi)
    val androidPushRepository = AndroidPushRepository(pushApi)
}
