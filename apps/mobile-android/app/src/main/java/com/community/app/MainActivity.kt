package com.community.app

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.work.*
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.concurrent.TimeUnit

class MainActivity : AppCompatActivity() {

    companion object {
        const val PREFS = "community_prefs"
        const val KEY_URL = "server_url"
        const val KEY_ACCESS_TOKEN = "access_token"
        const val KEY_REFRESH_TOKEN = "refresh_token"
        const val KEY_LAST_URL = "last_url"
        const val KEY_USER_JSON = "user_json"
        const val KEY_USER_ROLE = "user_role"
        const val KEY_LAST_SYNC = "last_sync"
        const val KEY_LAST_RESULT = "last_result"
        private const val PERM_REQUEST = 100
        private val TS_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")
    }

    private lateinit var etUrl: EditText
    private lateinit var etEmail: EditText
    private lateinit var etPass: EditText
    private lateinit var tvStatus: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        etUrl = findViewById(R.id.etUrl)
        etEmail = findViewById(R.id.etEmail)
        etPass = findViewById(R.id.etPass)
        tvStatus = findViewById(R.id.tvStatus)

        val prefs = getSharedPreferences(PREFS, MODE_PRIVATE)
        etUrl.setText(prefs.getString(KEY_URL, ""))
        etEmail.setText("")

        val lastSync = prefs.getString(KEY_LAST_SYNC, null)
        val lastResult = prefs.getString(KEY_LAST_RESULT, null)
        tvStatus.text = when {
            lastSync != null -> "Last sync: $lastSync\n$lastResult"
            prefs.getString(KEY_ACCESS_TOKEN, null) != null -> "Logged in"
            else -> "Not connected"
        }

        findViewById<Button>(R.id.btnLogin).setOnClickListener { login() }
        findViewById<Button>(R.id.btnOpenApp).setOnClickListener {
            startActivity(Intent(this, WebViewActivity::class.java))
        }

        NotificationHelper.createChannel(this)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val perm = Manifest.permission.POST_NOTIFICATIONS
            if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, arrayOf(perm), PERM_REQUEST)
            }
        }

        val token = prefs.getString(KEY_ACCESS_TOKEN, null)
        val url = prefs.getString(KEY_URL, null)
        if (!token.isNullOrEmpty() && !url.isNullOrEmpty()) {
            startActivity(Intent(this, WebViewActivity::class.java))
        }
    }

    private fun login() {
        var url = etUrl.text.toString().trim().trimEnd('/')
        val email = etEmail.text.toString().trim()
        val pass = etPass.text.toString()

        if (url.isNotEmpty() && !url.startsWith("http://") && !url.startsWith("https://")) {
            val isLocal = url.startsWith("192.168.") || url.startsWith("10.") || url.startsWith("172.")
                    || url.startsWith("localhost") || url.startsWith("127.")
            url = if (isLocal) "http://$url" else "https://$url"
        }
        // Fix saved https:// URLs for local/private networks
        if (url.startsWith("https://")) {
            val host = url.removePrefix("https://").split("/")[0].split(":")[0]
            val isLocal = host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172.")
                    || host == "localhost" || host.startsWith("127.")
            if (isLocal) url = url.replaceFirst("https://", "http://")
        }

        if (url.isEmpty() || email.isEmpty() || pass.isEmpty()) {
            tvStatus.text = getString(R.string.error_fields_required)
            return
        }

        tvStatus.text = getString(R.string.logging_in)

        Thread {
            try {
                val result = AuthClient.login(url, email, pass)
                getSharedPreferences(PREFS, MODE_PRIVATE).edit()
                    .putString(KEY_URL, url)
                    .putString(KEY_ACCESS_TOKEN, result.tokens.accessToken)
                    .putString(KEY_REFRESH_TOKEN, result.tokens.refreshToken)
                    .putString(KEY_USER_JSON, result.userJson)
                    .putString(KEY_USER_ROLE, result.userRole)
                    .apply()

                scheduleNotificationPolling()

                runOnUiThread {
                    tvStatus.text = getString(R.string.login_success)
                    startActivity(Intent(this, WebViewActivity::class.java))
                }
            } catch (e: Exception) {
                runOnUiThread {
                    tvStatus.text = "Login failed: ${e.message}"
                }
            }
        }.start()
    }

    private fun scheduleNotificationPolling() {
        val req = PeriodicWorkRequestBuilder<NotificationWorker>(15, TimeUnit.MINUTES)
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            )
            .build()
        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
            "community_notifications",
            ExistingPeriodicWorkPolicy.UPDATE,
            req
        )
    }
}
