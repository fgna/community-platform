package com.community.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

object NotificationHelper {

    const val CHANNEL_ID = "community_updates"
    const val CHANNEL_NAME = "Community Updates"

    fun createChannel(context: Context) {
        val mgr = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (mgr.getNotificationChannel(CHANNEL_ID) != null) return
        val ch = NotificationChannel(CHANNEL_ID, CHANNEL_NAME, NotificationManager.IMPORTANCE_DEFAULT).apply {
            description = "Posts, events, and activity notifications"
        }
        mgr.createNotificationChannel(ch)
    }

    fun fire(context: Context, id: String, title: String, body: String, deepLink: String?) {
        val notifId = id.hashCode()

        val tapIntent = Intent(context, WebViewActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            if (deepLink != null) {
                val prefs = context.getSharedPreferences(MainActivity.PREFS, Context.MODE_PRIVATE)
                prefs.edit().putString(MainActivity.KEY_LAST_URL, deepLink).apply()
            }
        }
        val tapPi = PendingIntent.getActivity(
            context, notifId, tapIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(tapPi)

        if (deepLink != null) {
            val markReadIntent = Intent(context, NotificationActionReceiver::class.java).apply {
                putExtra(NotificationActionReceiver.EXTRA_NOTIF_ID, notifId)
                putExtra(NotificationActionReceiver.EXTRA_NOTIFICATION_KEY, id)
            }
            val markReadPi = PendingIntent.getBroadcast(
                context, notifId + 1000, markReadIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            builder.addAction(android.R.drawable.checkbox_on_background, "Mark Read", markReadPi)
        }

        NotificationManagerCompat.from(context).notify(notifId, builder.build())
    }
}
