package online.khataplus.app

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.core.content.ContextCompat
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private var biometricPromptInFlight = false

    private val biometricPrompt by lazy {
        BiometricPrompt(
            this,
            ContextCompat.getMainExecutor(this),
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    biometricPromptInFlight = false
                    val cookieManager = CookieManager.getInstance()
                    cookieManager.setCookie(
                        BuildConfig.API_BASE_URL,
                        "biometric_verified=true; Max-Age=3600; Path=/; Secure; SameSite=Strict"
                    )
                    cookieManager.flush()
                    dispatchBiometricResult(success = true, message = null)
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    biometricPromptInFlight = false
                    dispatchBiometricResult(success = false, message = errString.toString())
                }

                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    dispatchBiometricResult(success = false, message = "Fingerprint did not match.")
                }
            }
        )
    }

    private val biometricPromptInfo by lazy {
        BiometricPrompt.PromptInfo.Builder()
            .setTitle("Verify identity")
            .setSubtitle("Use fingerprint or device unlock to continue in KhataPlus")
            .setAllowedAuthenticators(
                BiometricManager.Authenticators.BIOMETRIC_STRONG or
                    BiometricManager.Authenticators.DEVICE_CREDENTIAL
            )
            .build()
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }

        webView = WebView(this).apply {
            layoutParams = android.view.ViewGroup.LayoutParams(
                android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                android.view.ViewGroup.LayoutParams.MATCH_PARENT
            )

            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.databaseEnabled = true
            settings.loadsImagesAutomatically = true
            settings.mediaPlaybackRequiresUserGesture = false
            settings.cacheMode = WebSettings.LOAD_DEFAULT
            settings.useWideViewPort = true
            settings.loadWithOverviewMode = true
            settings.displayZoomControls = false
            settings.builtInZoomControls = false
            settings.setSupportZoom(false)
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE

            CookieManager.getInstance().setAcceptCookie(true)
            CookieManager.getInstance().setAcceptThirdPartyCookies(this, true)
            addJavascriptInterface(BiometricBridge(), "KhataPlusBiometric")

            webChromeClient = WebChromeClient()
            webViewClient = KhataPlusWebViewClient()
            ViewCompat.setOnApplyWindowInsetsListener(this) { view, insets ->
                val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
                view.setPadding(0, bars.top, 0, bars.bottom)
                insets
            }

            if (savedInstanceState == null) {
                loadUrl(BuildConfig.PWA_LAUNCH_URL)
            }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    finish()
                }
            }
        })

        setContentView(webView)
    }

    private fun isNativeBiometricAvailable(): Boolean {
        return when (
            BiometricManager.from(this).canAuthenticate(
                BiometricManager.Authenticators.BIOMETRIC_STRONG or
                    BiometricManager.Authenticators.DEVICE_CREDENTIAL
            )
        ) {
            BiometricManager.BIOMETRIC_SUCCESS -> true
            else -> false
        }
    }

    private fun promptForBiometricVerification() {
        if (biometricPromptInFlight) return
        if (!isNativeBiometricAvailable()) {
            dispatchBiometricResult(success = false, message = "Fingerprint is not available on this device.")
            return
        }
        biometricPromptInFlight = true
        biometricPrompt.authenticate(biometricPromptInfo)
    }

    private fun dispatchBiometricResult(success: Boolean, message: String?) {
        val payload = JSONObject().apply {
            put("success", success)
            put("message", message ?: JSONObject.NULL)
        }.toString()

        webView.post {
            webView.evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('kp-native-biometric-result', { detail: $payload }));",
                null
            )
        }
    }

    override fun onResume() {
        super.onResume()
        WindowInsetsControllerCompat(window, window.decorView).hide(WindowInsetsCompat.Type.systemBars())
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onRestoreInstanceState(savedInstanceState: Bundle) {
        super.onRestoreInstanceState(savedInstanceState)
        webView.restoreState(savedInstanceState)
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    private inner class BiometricBridge {
        @JavascriptInterface
        fun isAvailable(): Boolean = isNativeBiometricAvailable()

        @JavascriptInterface
        fun verifyIdentity() {
            runOnUiThread { promptForBiometricVerification() }
        }
    }

    private class KhataPlusWebViewClient : WebViewClient() {
        override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
            val url = request.url
            val host = url.host.orEmpty()
            return if (host.endsWith("khataplus.online")) {
                false
            } else {
                view.context.startActivity(Intent(Intent.ACTION_VIEW, url))
                true
            }
        }

        override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
            val uri = Uri.parse(url)
            return if (uri.host.orEmpty().endsWith("khataplus.online")) {
                false
            } else {
                view.context.startActivity(Intent(Intent.ACTION_VIEW, uri))
                true
            }
        }
    }
}
