package online.khataplus.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import online.khataplus.app.ui.KhataPlusNativeApp
import online.khataplus.app.ui.theme.KhataPlusTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            KhataPlusTheme {
                KhataPlusNativeApp(
                    appContainer = (application as KhataPlusApplication).container
                )
            }
        }
    }
}
