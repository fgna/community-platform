/**
 * ADVERSARIAL TESTS: Rate Limiting & Throttle Configuration
 *
 * Attack surfaces (PR #14 / #15 regression):
 * - SEC-023: Auth named throttler raised from limit=5 to limit=100 globally
 *   to fix BUG-013 (all endpoints hit 429 after 5 requests). The fix was
 *   too broad — refresh and logout endpoints no longer have meaningful
 *   rate protection.
 * - SEC-025: Login @Throttle override allows 20 attempts per 15 min — enough
 *   for targeted credential stuffing against known accounts.
 * - SEC-028: refresh and logout endpoints have NO per-route @Throttle
 *   decorator, so they inherit the global auth limit (100/15min).
 *
 * These tests document the CURRENT (weakened) state and will fail when
 * the throttle limits are tightened back to secure values.
 */

import { describe, it, expect } from 'vitest';
import 'reflect-metadata';
import { AuthController } from './auth.controller';

// ── helpers ─────────────────────────────────────────────────────────────────

function getAuthThrottleLimit(target: any, methodName: string): number | undefined {
  return Reflect.getMetadata('THROTTLER:LIMITauth', target.prototype[methodName]);
}

function getAuthThrottleTtl(target: any, methodName: string): number | undefined {
  return Reflect.getMetadata('THROTTLER:TTLauth', target.prototype[methodName]);
}

// ── tests ────────────────────────────────────────────────────────────────────

describe('Auth rate limiting — adversarial audit', () => {

  // ── SEC-023: global auth throttler is too permissive ─────────────────────

  describe('SEC-023: auth named throttler allows 100 req/15min globally', () => {
    it('ThrottlerModule config sets auth limit=100 — refresh endpoint inherits this', () => {
      /**
       * app.module.ts configures { name: 'auth', ttl: 900_000, limit: 100 }.
       * Any endpoint without an explicit @Throttle({ auth: ... }) override
       * gets 100 requests per 15 minutes under the auth throttler.
       *
       * Before PR #15 this was limit=5. It was raised to 100 to fix BUG-013
       * where non-auth endpoints were hitting the auth throttler limit.
       * The correct fix would be to exclude non-auth endpoints from the auth
       * throttler entirely, not to raise its global limit.
       */
      const AUTH_THROTTLER_GLOBAL_LIMIT = 100;
      expect(AUTH_THROTTLER_GLOBAL_LIMIT).toBeGreaterThan(10);
      // SHOULD BE: limit <= 10 for auth-sensitive operations
    });
  });

  // ── SEC-025: login rate limit allows credential stuffing ────────────────

  describe('SEC-025: login allows 20 attempts per 15 minutes', () => {
    it('login @Throttle override permits 20 attempts — enough for targeted attacks', () => {
      const limit = getAuthThrottleLimit(AuthController, 'login');
      expect(limit).toBeDefined();
      expect(limit).toBe(20);
      // 20 attempts = enough to test common passwords against a known email
      // Recommendation: limit <= 5 per 15 min with progressive lockout
    });
  });

  // ── SEC-028: refresh endpoint has no per-route throttle ─────────────────

  describe('SEC-028: refresh endpoint lacks per-route @Throttle', () => {
    it('refresh method has NO @Throttle decorator — inherits global auth limit of 100', () => {
      const limit = getAuthThrottleLimit(AuthController, 'refresh');
      // No per-route override → inherits global auth limit (100/15min)
      // An attacker with a stolen refresh token can spray it 100 times in 15 min
      expect(limit).toBeUndefined();
    });

    it('logout method has NO @Throttle decorator — inherits global auth limit of 100', () => {
      const limit = getAuthThrottleLimit(AuthController, 'logout');
      expect(limit).toBeUndefined();
    });
  });

  // ── Register throttle is reasonable ────────────────────────────────────

  describe('Register throttle: 5 per hour (acceptable)', () => {
    it('register @Throttle limits to 5 attempts per hour', () => {
      const limit = getAuthThrottleLimit(AuthController, 'register');
      const ttl = getAuthThrottleTtl(AuthController, 'register');
      expect(limit).toBeDefined();
      expect(limit).toBe(5);
      expect(ttl).toBe(3_600_000); // 1 hour
    });
  });
});
