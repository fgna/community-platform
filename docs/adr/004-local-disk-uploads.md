# ADR 004 — Local Disk for File Uploads (with S3 Service Stub)

**Status**: Accepted (local disk default; S3 migration path available)

## Context

The platform allows users to upload avatar images. File storage needs to be simple for self-hosted deployments while leaving a path to cloud object storage for larger installations.

## Decision

Default to local disk storage using `multer` with `diskStorage`. Uploaded files are written to `apps/api/uploads/avatars/` which is bind-mounted to `DATA_DIR/uploads` on the host via Docker Compose. The `DATA_DIR` directory survives container restarts and `docker compose down`.

An `S3Service` stub (`apps/api/src/uploads/s3.service.ts`) is present for future S3-compatible storage. The uploads module checks for `S3_BUCKET` / `S3_ENDPOINT` environment variables and routes to the appropriate implementation.

## Consequences

**Benefits:**
- Zero configuration for self-hosted deployments — no S3 account needed
- Files persist across container rebuilds via `DATA_DIR` bind mount
- S3 migration path available without changing the public API

**Trade-offs:**
- Local disk does not scale horizontally — multiple API instances sharing a filesystem require NFS or a shared volume
- No CDN caching for file serving
- Operator must back up `DATA_DIR/uploads` along with the database

## Alternatives Considered

- **S3 by default**: simpler horizontal scaling, but requires credentials and bucket setup; makes self-hosted setup more complex for the typical operator
- **Base64 in database**: terrible performance for large files; discarded immediately
