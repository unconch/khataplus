package online.khataplus.app.data.network

import android.content.Context
import androidx.core.content.edit
import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import org.json.JSONArray
import org.json.JSONObject

class PersistentCookieJar(context: Context) : CookieJar {
    private val prefs = context.getSharedPreferences("kp_native_cookies", Context.MODE_PRIVATE)

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        val host = url.host
        val current = load(host).associateBy { "${it.name}|${it.domain}|${it.path}" }.toMutableMap()
        cookies.forEach { cookie ->
            current["${cookie.name}|${cookie.domain}|${cookie.path}"] = cookie
        }
        val payload = JSONArray()
        current.values.forEach { cookie ->
            payload.put(
                JSONObject()
                    .put("name", cookie.name)
                    .put("value", cookie.value)
                    .put("domain", cookie.domain)
                    .put("path", cookie.path)
                    .put("expiresAt", cookie.expiresAt)
                    .put("secure", cookie.secure)
                    .put("httpOnly", cookie.httpOnly)
                    .put("hostOnly", cookie.hostOnly)
            )
        }
        prefs.edit { putString(host, payload.toString()) }
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        return load(url.host).filterNot { it.expiresAt < System.currentTimeMillis() }
    }

    fun clear() {
        prefs.edit { clear() }
    }

    private fun load(host: String): List<Cookie> {
        val raw = prefs.getString(host, null) ?: return emptyList()
        val json = JSONArray(raw)
        val cookies = mutableListOf<Cookie>()
        for (index in 0 until json.length()) {
            val item = json.getJSONObject(index)
            val builder = Cookie.Builder()
                .name(item.getString("name"))
                .value(item.getString("value"))
                .path(item.getString("path"))
                .expiresAt(item.getLong("expiresAt"))

            if (item.optBoolean("hostOnly")) {
                builder.hostOnlyDomain(item.getString("domain"))
            } else {
                builder.domain(item.getString("domain"))
            }
            if (item.optBoolean("secure")) builder.secure()
            if (item.optBoolean("httpOnly")) builder.httpOnly()
            cookies += builder.build()
        }
        return cookies
    }
}
