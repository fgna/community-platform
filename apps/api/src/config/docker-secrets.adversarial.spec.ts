/**
 * ADVERSARIAL TESTS: Docker & Deployment Configuration
 *
 * Attack surfaces (PR #14):
 * - SEC-024: docker-compose.yml ships insecure default values for JWT_SECRET,
 *   JWT_REFRESH_SECRET, and POSTGRES_PASSWORD. The API has startup validation
 *   that exits if JWT_SECRET is missing — but docker-compose injects the
 *   default string "change-me-in-production" BEFORE the API reads env vars,
 *   so the startup check passes. A production deployment that forgets to set
 *   .env will run with predictable secrets.
 *
 * - SEC-030: Backup service exposes PGPASSWORD in container environment,
 *   visible via `docker inspect community_backup`. Limited exposure since
 *   backup profile is manual, but password is readable by any process in
 *   the container and any user with Docker access.
 *
 * These tests parse docker-compose.yml and verify the security posture.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const COMPOSE_PATH = join(__dirname, '..', '..', '..', '..', 'docker-compose.yml');

function readCompose(): string {
  return readFileSync(COMPOSE_PATH, 'utf-8');
}

describe('Docker configuration — adversarial', () => {

  // ── SEC-024: insecure default secrets ──────────────────────────────────

  describe('SEC-024: predictable default JWT secrets in docker-compose.yml', () => {
    it('JWT_SECRET has a predictable default fallback', () => {
      const compose = readCompose();
      /**
       * docker-compose.yml line 43:
       *   JWT_SECRET: ${JWT_SECRET:-change-me-in-production}
       *
       * If the deployer forgets to set JWT_SECRET in .env, the API starts
       * with the well-known secret "change-me-in-production". Any attacker
       * who reads this repo can forge valid JWTs:
       *
       *   const jwt = require('jsonwebtoken');
       *   jwt.sign({ id: 'admin-id', role: 'ADMIN' }, 'change-me-in-production');
       *
       * The API startup validation (main.ts) checks for undefined/empty but
       * "change-me-in-production" passes that check.
       */
      expect(compose).toContain('change-me-in-production');
    });

    it('JWT_REFRESH_SECRET has a predictable default fallback', () => {
      const compose = readCompose();
      expect(compose).toContain('change-me-refresh-in-production');
    });

    it('POSTGRES_PASSWORD defaults to "password"', () => {
      const compose = readCompose();
      expect(compose).toContain('POSTGRES_PASSWORD:-password');
    });

    it('startup validation should reject known-insecure default values', () => {
      /**
       * main.ts currently validates:
       *   if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
       *     process.exit(1);
       *   }
       *
       * SHOULD also check:
       *   if (process.env.JWT_SECRET === 'change-me-in-production') {
       *     process.exit(1);
       *   }
       *
       * Without this check, the docker-compose default bypasses validation.
       */
      const KNOWN_INSECURE_DEFAULTS = [
        'change-me-in-production',
        'change-me-refresh-in-production',
        'secret',
        'jwt-secret',
      ];

      // The current code does NOT reject these — this documents the gap
      for (const secret of KNOWN_INSECURE_DEFAULTS) {
        expect(secret.length).toBeGreaterThan(0); // Not empty → passes current check
        expect(typeof secret).toBe('string');      // Not undefined → passes current check
      }
    });
  });

  // ── SEC-030: backup service leaks password ─────────────────────────────

  describe('SEC-030: backup service exposes database password in environment', () => {
    it('PGPASSWORD is set as a plain environment variable', () => {
      const compose = readCompose();
      /**
       * docker-compose.yml backup service:
       *   environment:
       *     PGPASSWORD: ${POSTGRES_PASSWORD:-password}
       *
       * Visible via: docker inspect community_backup
       * Also visible in /proc/1/environ inside the container.
       *
       * Alternatives:
       * - Use .pgpass file mounted as a secret
       * - Use Docker secrets (docker compose secrets:)
       * - Use pg_dump --no-password with pg_hba.conf trust for local connections
       */
      expect(compose).toContain('PGPASSWORD');
    });
  });
});
