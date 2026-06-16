import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Uses authenticated userId as the throttle key so rate limits apply
 * per user rather than per IP (important behind reverse proxies).
 * Falls back to IP for unauthenticated requests (login, register).
 */
@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.id ?? req.ip ?? 'unknown';
  }
}
