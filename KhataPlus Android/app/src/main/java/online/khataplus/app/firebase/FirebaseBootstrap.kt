package online.khataplus.app.firebase

import android.content.Context
import android.util.Log
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging

object FirebaseBootstrap {
    private const val TAG = "FirebaseBootstrap"

    fun initialize(context: Context) {
        if (FirebaseApp.getApps(context).isNotEmpty()) return

        val app = FirebaseApp.initializeApp(context.applicationContext)
        if (app == null) {
            Log.w(TAG, "Firebase config missing. Place google-services.json in app/ so FCM can initialize.")
            return
        }

        FirebaseMessaging.getInstance().isAutoInitEnabled = true
    }
}
