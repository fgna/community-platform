# Community Platform — Android App

A native Android wrapper for the self-hosted Community Platform web app, built on the [my-taskOS android-webview-template](https://github.com/fgna/my-taskOS).

## Features

- **JWT Authentication** — Login screen authenticates via the platform's `/api/auth/login` endpoint; tokens are stored securely and injected into the WebView's localStorage
- **Token Refresh** — Automatic token refresh when the access token expires
- **Push Notifications** — Background polling (every 15 min) for platform notifications with deep-link support
- **Offline Error Page** — Branded error page matching the Executive Glass theme when the server is unreachable
- **Session Persistence** — Remembers the last visited page and resumes there on relaunch
- **Native↔JS Bridge** — `CommunityApp` bridge allows the web app to read/update tokens and trigger native logout

## Setup

### 1. Generate a release keystore

```bash
keytool -genkeypair \
  -keystore app/release.keystore \
  -alias community \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass changeme -keypass changeme \
  -dname "CN=Community Platform, O=MyOrg, C=DE"
```

Update `app/build.gradle.kts` → `signingConfigs.release` with your passwords.

### 2. Build

```bash
./gradlew clean assembleRelease
```

Output: `app/build/outputs/apk/release/app-release.apk`

### 3. Build with Docker (no local SDK needed)

```bash
docker build -t community-android-builder -f Dockerfile .
docker run --rm -v $(pwd):/app community-android-builder ./gradlew clean assembleRelease
```

### 4. Install

```bash
adb install -r app/build/outputs/apk/release/app-release.apk
```

Or transfer the APK and install manually (enable "Install from unknown sources").

## JS Bridge API

The web app can interact with the native app via `window.CommunityApp`:

```javascript
// Check if running inside the native app
if (typeof CommunityApp !== 'undefined') {
    // Get stored tokens
    const token = CommunityApp.getAccessToken();
    const refresh = CommunityApp.getRefreshToken();

    // Update tokens after a refresh
    CommunityApp.updateTokens(newAccessToken, newRefreshToken);

    // Trigger native logout (clears tokens, returns to login screen)
    CommunityApp.logout();
}

// The native app sets this flag after page load
if (window.__COMMUNITY_NATIVE) {
    // Running in native wrapper
}
```

## Customization

| What | Where |
|------|-------|
| App name & subtitle | `app/src/main/res/values/strings.xml` |
| Icon colors (dark bg + gold accent) | `app/src/main/res/values/colors.xml` |
| Icon shape | `app/src/main/res/drawable/ic_launcher_foreground.xml` |
| Package name | `app/build.gradle.kts` → `namespace` + `applicationId` |
| Notification polling interval | `MainActivity.kt` → `PeriodicWorkRequestBuilder` |
