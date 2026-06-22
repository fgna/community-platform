package com.community.app

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

data class AuthTokens(val accessToken: String, val refreshToken: String)
data class LoginResult(val tokens: AuthTokens, val userJson: String, val userRole: String)

object AuthClient {

    fun login(serverUrl: String, email: String, password: String): LoginResult {
        val body = JSONObject().apply {
            put("email", email)
            put("password", password)
        }.toString()

        val resp = post("$serverUrl/api/auth/login", body, null)
        val json = JSONObject(resp)
        val tokens = AuthTokens(
            accessToken = json.getString("accessToken"),
            refreshToken = json.getString("refreshToken")
        )

        val userResp = get("$serverUrl/api/users/me", tokens.accessToken)
        val user = JSONObject(userResp)
        val role = user.optString("role", "MEMBER")

        return LoginResult(tokens = tokens, userJson = user.toString(), userRole = role)
    }

    fun refresh(serverUrl: String, refreshToken: String): AuthTokens {
        val body = JSONObject().apply {
            put("refreshToken", refreshToken)
        }.toString()

        val resp = post("$serverUrl/api/auth/refresh", body, null)
        val json = JSONObject(resp)
        return AuthTokens(
            accessToken = json.getString("accessToken"),
            refreshToken = json.getString("refreshToken")
        )
    }

    fun get(url: String, accessToken: String): String {
        val conn = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = "GET"
            setRequestProperty("Authorization", "Bearer $accessToken")
            setRequestProperty("Accept", "application/json")
            connectTimeout = 10_000
            readTimeout = 15_000
        }
        if (conn.responseCode !in 200..299) error("HTTP ${conn.responseCode}")
        return conn.inputStream.bufferedReader().readText()
    }

    private fun post(url: String, body: String, accessToken: String?): String {
        val conn = (URL(url).openConnection() as HttpURLConnection).apply {
            requestMethod = "POST"
            setRequestProperty("Content-Type", "application/json")
            setRequestProperty("Accept", "application/json")
            if (accessToken != null) {
                setRequestProperty("Authorization", "Bearer $accessToken")
            }
            doOutput = true
            connectTimeout = 10_000
            readTimeout = 15_000
        }
        conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
        if (conn.responseCode !in 200..299) {
            val errorBody = try { conn.errorStream?.bufferedReader()?.readText() } catch (_: Exception) { null }
            val msg = if (errorBody != null) {
                try { JSONObject(errorBody).optString("message", "HTTP ${conn.responseCode}") }
                catch (_: Exception) { "HTTP ${conn.responseCode}" }
            } else "HTTP ${conn.responseCode}"
            error(msg)
        }
        return conn.inputStream.bufferedReader().readText()
    }
}
