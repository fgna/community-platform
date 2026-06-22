package com.community.app

import android.content.Context
import androidx.work.Worker
import androidx.work.WorkerParameters
import androidx.work.workDataOf
import org.json.JSONArray
import org.json.JSONObject

class NotificationWorker(ctx: Context, params: WorkerParameters) : Worker(ctx, params) {

    companion object {
        const val KEY_RESULT = "result"
    }

    override fun doWork(): Result {
        val prefs = applicationContext.getSharedPreferences(MainActivity.PREFS, Context.MODE_PRIVATE)
        val serverUrl = prefs.getString(MainActivity.KEY_URL, "").orEmpty().trimEnd('/')
        var accessToken = prefs.getString(MainActivity.KEY_ACCESS_TOKEN, "").orEmpty()
        val refreshToken = prefs.getString(MainActivity.KEY_REFRESH_TOKEN, "").orEmpty()

        if (serverUrl.isEmpty() || accessToken.isEmpty()) {
            return Result.failure(workDataOf(KEY_RESULT to "Not configured"))
        }

        try {
            val json = try {
                AuthClient.get("$serverUrl/api/notifications", accessToken)
            } catch (_: Exception) {
                val tokens = AuthClient.refresh(serverUrl, refreshToken)
                prefs.edit()
                    .putString(MainActivity.KEY_ACCESS_TOKEN, tokens.accessToken)
                    .putString(MainActivity.KEY_REFRESH_TOKEN, tokens.refreshToken)
                    .apply()
                accessToken = tokens.accessToken
                AuthClient.get("$serverUrl/api/notifications", accessToken)
            }

            val response = JSONObject(json)
            val arr = response.getJSONArray("data")
            val shownKey = "shown_notifications"
            val shownRaw = prefs.getString(shownKey, "{}") ?: "{}"
            val shown = JSONObject(shownRaw)
            val nowMs = System.currentTimeMillis()
            val ttlMs = 24 * 3600 * 1000L

            shown.keys().asSequence().toList().forEach { k ->
                if (nowMs - shown.getLong(k) > ttlMs) shown.remove(k)
            }

            var fired = 0
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                val id = obj.getString("id")
                val isRead = obj.optBoolean("read", false)
                if (isRead || shown.has(id)) continue

                val type = obj.optString("type", "")
                val actorName = obj.optJSONObject("actor")?.optString("name") ?: "Someone"
                val entityType = obj.optString("entityType", "")
                val entityId = obj.optString("entityId").takeIf { it.isNotEmpty() && it != "null" }

                val title = when (type) {
                    "COMMENT" -> "$actorName commented"
                    "REACTION" -> "$actorName reacted to your post"
                    "MENTION" -> "$actorName mentioned you"
                    "EVENT_REMINDER" -> "Event reminder"
                    else -> "Community update"
                }
                val body = when (type) {
                    "EVENT_REMINDER" -> "You have an upcoming event"
                    else -> "Tap to view in the community"
                }
                val deepLink = when {
                    entityType == "post" && entityId != null -> "$serverUrl/feed/$entityId"
                    entityType == "event" && entityId != null -> "$serverUrl/events"
                    else -> null
                }

                NotificationHelper.fire(applicationContext, id, title, body, deepLink)
                shown.put(id, nowMs)
                fired++
            }

            prefs.edit().putString(shownKey, shown.toString()).apply()
            return Result.success(workDataOf(KEY_RESULT to "$fired notification(s)"))
        } catch (e: Exception) {
            return Result.failure(workDataOf(KEY_RESULT to "Error: ${e.message}"))
        }
    }
}
