package com.community.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationManagerCompat

class NotificationActionReceiver : BroadcastReceiver() {

    companion object {
        const val EXTRA_NOTIF_ID = "notif_id"
        const val EXTRA_NOTIFICATION_KEY = "notification_key"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val notifId = intent.getIntExtra(EXTRA_NOTIF_ID, 0)
        NotificationManagerCompat.from(context).cancel(notifId)
    }
}
