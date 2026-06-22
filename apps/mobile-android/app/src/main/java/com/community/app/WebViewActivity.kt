package com.community.app

import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity

class WebViewActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_DEEP_LINK = "deep_link_url"
    }

    private lateinit var webView: WebView

    inner class CommunityBridge {
        @JavascriptInterface
        fun getAccessToken(): String {
            val prefs = getSharedPreferences(MainActivity.PREFS, MODE_PRIVATE)
            return prefs.getString(MainActivity.KEY_ACCESS_TOKEN, "") ?: ""
        }

        @JavascriptInterface
        fun getRefreshToken(): String {
            val prefs = getSharedPreferences(MainActivity.PREFS, MODE_PRIVATE)
            return prefs.getString(MainActivity.KEY_REFRESH_TOKEN, "") ?: ""
        }

        @JavascriptInterface
        fun updateTokens(accessToken: String, refreshToken: String) {
            getSharedPreferences(MainActivity.PREFS, MODE_PRIVATE).edit()
                .putString(MainActivity.KEY_ACCESS_TOKEN, accessToken)
                .putString(MainActivity.KEY_REFRESH_TOKEN, refreshToken)
                .apply()
        }

        @JavascriptInterface
        fun logout() {
            getSharedPreferences(MainActivity.PREFS, MODE_PRIVATE).edit()
                .remove(MainActivity.KEY_ACCESS_TOKEN)
                .remove(MainActivity.KEY_REFRESH_TOKEN)
                .remove(MainActivity.KEY_USER_JSON)
                .remove(MainActivity.KEY_USER_ROLE)
                .remove(MainActivity.KEY_LAST_URL)
                .apply()
            runOnUiThread {
                webView.evaluateJavascript(
                    "document.cookie='auth-session=;path=/;expires=Thu,01 Jan 1970 00:00:01 GMT';" +
                    "document.cookie='user-role=;path=/;expires=Thu,01 Jan 1970 00:00:01 GMT';" +
                    "localStorage.removeItem('community-auth');", null
                )
                finish()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_webview)

        webView = findViewById(R.id.webView)
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            loadWithOverviewMode = true
            useWideViewPort = true
        }
        webView.addJavascriptInterface(CommunityBridge(), "CommunityApp")

        val prefs = getSharedPreferences(MainActivity.PREFS, MODE_PRIVATE)
        val accessToken = prefs.getString(MainActivity.KEY_ACCESS_TOKEN, "") ?: ""

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest) = false

            override fun onPageFinished(view: WebView, url: String) {
                super.onPageFinished(view, url)
                if (url != null && !url.startsWith("data:") && url != "about:blank") {
                    prefs.edit().putString(MainActivity.KEY_LAST_URL, url).apply()
                }
                injectAuthState(view, accessToken)
            }

            override fun onReceivedError(
                view: WebView, request: WebResourceRequest, error: WebResourceError
            ) {
                if (request.isForMainFrame) {
                    view.loadData(
                        """<!DOCTYPE html><html lang="en"><head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width,initial-scale=1">
                        <style>
                          body{font-family:Inter,sans-serif;display:flex;flex-direction:column;align-items:center;
                               justify-content:center;min-height:80vh;gap:1rem;text-align:center;
                               background:#090d16;color:#e4e4e7;margin:0;padding:2rem;box-sizing:border-box}
                          .icon{font-size:3rem;opacity:.4}
                          h2{margin:0;font-size:1.2rem;color:#c5a880}
                          p{margin:0;font-size:.9rem;color:#a1a1aa;max-width:280px}
                          button{margin-top:.5rem;padding:.6rem 1.4rem;background:#c5a880;color:#090d16;
                                 border:none;border-radius:8px;font-size:.9rem;cursor:pointer;font-weight:600}
                        </style></head><body>
                        <div class="icon">⚡</div>
                        <h2>Connection Lost</h2>
                        <p>Unable to reach the community platform. Please check your connection and try again.</p>
                        <button onclick="location.reload()">Retry</button>
                        </body></html>""",
                        "text/html", "utf-8"
                    )
                }
            }
        }

        val baseUrl = prefs.getString(MainActivity.KEY_URL, null)
        if (baseUrl.isNullOrEmpty()) {
            webView.loadData(getString(R.string.webview_no_url), "text/plain", "utf-8")
        } else {
            val deepLink = intent.getStringExtra(EXTRA_DEEP_LINK)
            val lastUrl = prefs.getString(MainActivity.KEY_LAST_URL, null)
            val targetUrl = deepLink ?: (if (!lastUrl.isNullOrEmpty()) lastUrl else baseUrl)
            webView.loadUrl(targetUrl)
        }
    }

    private fun injectAuthState(view: WebView, accessToken: String) {
        val prefs = getSharedPreferences(MainActivity.PREFS, MODE_PRIVATE)
        val refreshToken = prefs.getString(MainActivity.KEY_REFRESH_TOKEN, "") ?: ""
        val userJson = prefs.getString(MainActivity.KEY_USER_JSON, "") ?: ""
        val userRole = prefs.getString(MainActivity.KEY_USER_ROLE, "MEMBER") ?: "MEMBER"
        val cookieMaxAge = 7 * 24 * 60 * 60
        val js = """
            (function() {
                try {
                    var existing = localStorage.getItem('community-auth');
                    if (!existing || existing.indexOf('accessToken') === -1) {
                        var user = null;
                        try { user = JSON.parse('$userJson'); } catch(e) {}
                        var state = {
                            state: {
                                user: user,
                                accessToken: '$accessToken',
                                refreshToken: '$refreshToken',
                                isAuthenticated: true
                            },
                            version: 0
                        };
                        localStorage.setItem('community-auth', JSON.stringify(state));
                    }
                    document.cookie = 'auth-session=$accessToken; path=/; SameSite=Lax; max-age=$cookieMaxAge';
                    document.cookie = 'user-role=$userRole; path=/; SameSite=Lax; max-age=$cookieMaxAge';
                    if (typeof CommunityApp !== 'undefined') {
                        window.__COMMUNITY_NATIVE = true;
                    }
                } catch(e) {}
            })();
        """.trimIndent()
        view.evaluateJavascript(js, null)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) webView.goBack()
        else super.onBackPressed()
    }
}
