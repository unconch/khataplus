package online.khataplus.app

import android.app.Application
import online.khataplus.app.data.AppContainer
import online.khataplus.app.data.push.AndroidPushStore
import online.khataplus.app.firebase.FirebaseBootstrap

class KhataPlusApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        AndroidPushStore.init(this)
        FirebaseBootstrap.initialize(this)
        container = AppContainer(this)
    }
}
