package online.khataplus.app

import android.app.Application
import online.khataplus.app.data.AppContainer

class KhataPlusApplication : Application() {
    lateinit var container: AppContainer
        private set

    override fun onCreate() {
        super.onCreate()
        container = AppContainer(this)
    }
}
