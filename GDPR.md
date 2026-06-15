# GDPR Compliance

This document describes the GDPR compliance features built into the Community Platform.

## Legal Basis for Processing

| Data | Legal Basis | Purpose |
|------|-------------|---------|
| Email, name, password hash | Contract (Art. 6.1.b) | Account creation and authentication |
| Posts, comments, reactions | Contract (Art. 6.1.b) | Core community functionality |
| Course progress | Contract (Art. 6.1.b) | Learning hub functionality |
| Event RSVPs | Contract (Art. 6.1.b) | Event management |
| Analytics cookies | Consent (Art. 6.1.a) | Platform improvement |
| Marketing cookies | Consent (Art. 6.1.a) | Personalized recommendations |
| Audit logs | Legitimate interest (Art. 6.1.f) | Security and abuse prevention |

## Data Subject Rights

### Right of Access (Art. 15)
Users can view their data at any time through the platform. For a complete machine-readable export, use the data export feature.

### Right to Data Portability (Art. 20)
**Endpoint:** `GET /api/gdpr/export`

Returns a complete JSON export of all user data:
- Profile information
- All posts and comments
- Reactions
- Course progress
- Event RSVPs
- Cookie consent records

**UI:** Settings → Privacy & GDPR → "Export my data"

### Right to Erasure (Art. 17)
**Endpoint:** `DELETE /api/gdpr/account`

Account deletion anonymizes personal data rather than hard-deleting records:
- Email replaced with `deleted-{userId}@deleted.invalid`
- Name replaced with "Deleted User"
- Bio and avatar URL set to null
- All refresh tokens invalidated
- `isActive` set to false

Posts, comments, and reactions are retained but de-anonymized to preserve community content integrity.

**UI:** Settings → Privacy & GDPR → "Delete account"

### Right to Rectification (Art. 16)
Users can update their profile information at any time via:
- **UI:** Profile page → edit name, bio, avatar
- **API:** `PATCH /api/users/me`

### Right to Object / Restrict Processing
Users can update cookie consent preferences at any time:
- **UI:** Settings → Privacy & GDPR toggles
- **API:** `POST /api/gdpr/consent`

## Cookie Consent

### Implementation
- Cookie banner appears on first visit (1 second delay)
- Consent stored in localStorage and in the `CookieConsent` database table
- Authenticated users' consent linked to their account
- Anonymous users' consent linked by session ID

### Cookie Categories

**Essential (always on)**
- Authentication session (for logged-in functionality)
- Cookie consent record itself

**Analytics (opt-in)**
- Platform usage statistics
- Feature engagement metrics

**Marketing (opt-in)**
- Personalized content recommendations
- Email preference optimization

### Consent Storage
```sql
model CookieConsent {
  id        String   @id @default(cuid())
  userId    String?  -- linked if authenticated
  sessionId String?  -- linked if anonymous
  analytics Boolean  @default(false)
  marketing Boolean  @default(false)
  createdAt DateTime @default(now())
}
```

Each consent update creates a new record, providing an audit trail.

## Data Retention

| Data Type | Retention |
|-----------|-----------|
| Active user data | Until account deletion |
| Deleted user data (anonymized) | Retained for referential integrity |
| Refresh tokens | 7 days (auto-expire) |
| Cookie consent records | 3 years (legal requirement) |
| Audit logs | 1 year |

## Privacy by Design

1. **Data minimization**: Only collect what's needed for functionality
2. **Purpose limitation**: Data used only for stated purposes
3. **Storage limitation**: Refresh tokens auto-expire; consent records timestamped
4. **Integrity & confidentiality**: Passwords hashed with Argon2id; HTTPS enforced in production
5. **Accountability**: Audit logs track admin actions; consent changes recorded

## Data Processing Agreements

If deploying this platform with third-party services (analytics providers, email services, CDNs), ensure Data Processing Agreements (DPAs) are in place with each processor as required by Art. 28 GDPR.

## Breach Notification

In case of a data breach:
1. Assess severity and scope within 24 hours
2. Notify supervisory authority within 72 hours if risk to individuals (Art. 33)
3. Notify affected individuals without undue delay if high risk (Art. 34)
4. Document the breach and response actions

## Data Protection Officer

If your organization processes data at large scale, appoint a DPO as required by Art. 37. Contact: dpo@yourdomain.com
