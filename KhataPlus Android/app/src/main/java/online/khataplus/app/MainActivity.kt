package online.khataplus.app

import android.net.Uri
import com.google.androidbrowserhelper.trusted.LauncherActivity

class MainActivity : LauncherActivity() {
    override fun getLaunchingUrl(): Uri {
        return Uri.parse(BuildConfig.PWA_LAUNCH_URL)
    }
}
