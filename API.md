# API Reference

Base URL: `http://localhost:3001/api`

Interactive docs (dev only): `http://localhost:3001/api/docs`

## Authentication

All endpoints except those marked **Public** require a Bearer token:
```
Authorization: Bearer <accessToken>
```

---

## Auth Endpoints

### POST /auth/register — Public
Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "name": "Jane Doe",
  "password": "minimum8chars"
}
```

**Response 201:**
```json
{
  "user": { "id": "...", "email": "...", "name": "...", "role": "MEMBER" },
  "accessToken": "eyJ...",
  "refreshToken": "uuid-v4"
}
```

---

### POST /auth/login — Public
Authenticate with email and password.

**Request:**
```json
{ "email": "user@example.com", "password": "password" }
```

**Response 200:** Same shape as register.

---

### POST /auth/refresh — Public
Exchange a refresh token for a new access token.

**Request:**
```json
{ "refreshToken": "uuid-v4" }
```

**Response 200:**
```json
{ "accessToken": "eyJ...", "refreshToken": "new-uuid-v4" }
```

---

### POST /auth/logout — Public
Invalidate a refresh token.

**Request:**
```json
{ "refreshToken": "uuid-v4" }
```

---

## Users

### GET /users
Member directory. Returns paginated list of active users.

**Query:** `?page=1&limit=20`

**Response:**
```json
{
  "data": [{ "id": "...", "name": "...", "bio": "...", "role": "MEMBER", "_count": { "posts": 5 } }],
  "total": 42, "page": 1, "limit": 20, "totalPages": 3
}
```

### GET /users/me
Current authenticated user's full profile.

### PATCH /users/me
Update profile fields.
```json
{ "name": "New Name", "bio": "My bio", "avatarUrl": "https://..." }
```

### GET /users/:id
Get any user's public profile (includes follow status for current user).

### POST /users/me/avatar
Upload an avatar image. Accepts `multipart/form-data` with a `file` field.
- Allowed types: JPEG, PNG, GIF, WebP
- Max size: 5 MB
- Magic-byte validation ensures file content matches declared MIME type

**Response 200:**
```json
{ "avatarUrl": "https://..." }
```

### POST /users/:id/follow
Follow a user.

### DELETE /users/:id/follow
Unfollow a user.

---

## Posts

### GET /posts
Feed of all non-hidden posts. Sorted: pinned first, then newest.

**Query:** `?page=1&limit=20`

### GET /posts/:id
Single post with comments and reactions.

### POST /posts
Create a post.
```json
{ "content": "Hello community!" }
```

### PUT /posts/:id
Update post content. Author or Admin only.

### DELETE /posts/:id
Delete a post. Author or Admin only.

### POST /posts/:id/comments
Add a comment.
```json
{ "content": "Great post!" }
```

### POST /posts/:id/reactions/:type
Toggle a reaction. `type` must be one of: `LIKE`, `HEART`, `CELEBRATE`, `INSIGHTFUL`

---

## Courses

### GET /courses
All published courses with user progress if authenticated.

### GET /courses/:id
Course detail with modules, lessons, and user progress.

### PUT /courses/:id/progress
Update learning progress.
```json
{ "percentage": 75 }
```

### GET /courses/lessons/:lessonId
Get a specific lesson.

### POST /courses — Admin only
Create a new course.

### PUT /courses/:id — Admin only
Update a course.

### DELETE /courses/:id — Admin only
Delete a course.

---

## Events

### GET /events
All events ordered by start date. Includes user's RSVP status.

### GET /events/:id
Event detail with RSVP list.

### POST /events/:id/rsvp
RSVP to an event.
```json
{ "status": "GOING" }
```
Status values: `GOING`, `MAYBE`, `NOT_GOING`

### DELETE /events/:id/rsvp
Cancel RSVP.

### POST /events — Admin only
Create an event.

### PUT /events/:id — Admin only
Update an event.

### DELETE /events/:id — Admin only
Delete an event.

---

## Admin Endpoints — Admin role required

### GET /admin/stats
Platform statistics: user count, post count, course count, event count.

### GET /admin/users
All users (including inactive). `?page=1&limit=20`

### PATCH /admin/users/:id/role
```json
{ "role": "ADMIN" }
```

### PATCH /admin/users/:id/toggle-active
Toggle user active/inactive status.

### PATCH /admin/posts/:id/hide
Toggle post hidden status.

### PATCH /admin/posts/:id/pin
Toggle post pinned status.

### GET /admin/moderation
Hidden posts queue for moderation.

### GET /admin/audit-log
System audit log.

---

## Messages

### GET /messages/conversations
List all conversations for the current user.

### POST /messages/conversations/:userId
Get or create a direct conversation with another user.

### GET /messages/conversations/:id/messages
Get messages in a conversation (paginated).

**Query:** `?page=1&limit=50`

### POST /messages/conversations/:id/messages
Send a message in a conversation.
```json
{ "content": "Hello!" }
```

---

## Notifications

### GET /notifications
Get notifications for the current user (paginated).

**Query:** `?page=1&limit=20`

### GET /notifications/unread-count
Get the count of unread notifications.

### PATCH /notifications/read-all
Mark all notifications as read.

### PATCH /notifications/:id/read
Mark a single notification as read.

---

## Search

### GET /search
Search across posts, users, courses, and events.

**Query:** `?q=keyword&limit=10`

**Response 200:**
```json
{
  "posts": [...],
  "users": [...],
  "courses": [...],
  "events": [...]
}
```

---

## GDPR Endpoints

### GET /gdpr/consent
Current user's cookie consent record.

### POST /gdpr/consent
Update consent preferences.
```json
{ "analytics": true, "marketing": false }
```

### POST /gdpr/consent/anonymous — Public
Save consent for unauthenticated users.
```json
{ "sessionId": "...", "analytics": true, "marketing": false }
```

### GET /gdpr/export
Export all user data as JSON (GDPR Article 20).

### DELETE /gdpr/account
Anonymize and deactivate account (GDPR Article 17).

---

## Health

### GET /health — Public
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "services": { "database": "ok", "api": "ok" },
  "version": "1.0.0"
}
```

---

## Error Responses

| Status | Meaning |
|--------|---------|
| 400 | Bad Request — validation failed |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — insufficient permissions |
| 404 | Not Found |
| 409 | Conflict — e.g., email already registered |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Internal Server Error |

All errors follow:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

## Rate Limiting

| Scope | Limit | Window |
|-------|-------|--------|
| Default (all endpoints) | 100 requests | 60 seconds |
| Auth endpoints (named throttler) | 60 requests | 15 minutes |
| Login | 10 requests | 15 minutes |
| Register | 5 requests | 1 hour |
| Refresh | 30 requests | 15 minutes |
| Logout | 10 requests | 15 minutes |

Default limits are configurable via `THROTTLE_TTL` / `THROTTLE_LIMIT` env vars. For authenticated users, the throttle key is the user ID (not just IP), implemented via a custom `UserThrottlerGuard`.
