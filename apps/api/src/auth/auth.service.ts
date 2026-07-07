import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { InvitesService } from '../invites/invites.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SetupAdminDto } from './dto/setup-admin.dto';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private invitesService: InvitesService,
  ) {}

  static computeFingerprint(userAgent: string, ip: string): string {
    return createHash('sha256').update(`${userAgent}|${ip}`).digest('hex');
  }

  // In-memory store for per-account brute-force protection.
  // Maps email → { count, resetAt }. Reset on successful login or after TTL.
  private readonly loginAttempts = new Map<string, { count: number; resetAt: number }>();
  private readonly MAX_LOGIN_ATTEMPTS = 10;
  private readonly LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  async register(dto: RegisterDto, fingerprint?: string) {
    const email = dto.email.toLowerCase().trim();

    if (dto.inviteToken) {
      const invite = await this.invitesService.validateInvite(dto.inviteToken);
      if (invite.email.toLowerCase().trim() !== email) {
        throw new BadRequestException('Invite was issued for a different email address');
      }
    }

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      // Return generic message to prevent email enumeration
      throw new ConflictException('Registration failed — please check your details or try again later');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        membershipTier: true,
        createdAt: true,
      },
    });

    if (dto.inviteToken) {
      await this.invitesService.consumeInvite(dto.inviteToken);
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role, fingerprint);

    return {
      user,
      ...tokens,
    };
  }

  async login(dto: LoginDto, fingerprint?: string) {
    const email = dto.email.toLowerCase().trim();

    // Per-account brute-force protection
    const attempt = this.loginAttempts.get(email);
    if (attempt && attempt.count >= this.MAX_LOGIN_ATTEMPTS && Date.now() < attempt.resetAt) {
      throw new UnauthorizedException('Too many login attempts. Please try again later.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      this.recordFailedAttempt(email);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      this.recordFailedAttempt(email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      this.recordFailedAttempt(email);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset on successful login
    this.loginAttempts.delete(email);

    const tokens = await this.generateTokens(user.id, user.email, user.role, fingerprint);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        membershipTier: user.membershipTier,
      },
      ...tokens,
    };
  }

  private recordFailedAttempt(email: string) {
    const now = Date.now();
    const existing = this.loginAttempts.get(email);
    if (!existing || now >= existing.resetAt) {
      this.loginAttempts.set(email, { count: 1, resetAt: now + this.LOGIN_ATTEMPT_WINDOW_MS });
    } else {
      existing.count++;
    }
  }

  async refresh(userId: string, email: string, role: string, oldRefreshToken: string, fingerprint?: string) {
    const deleted = await this.prisma.refreshToken.deleteMany({
      where: { token: oldRefreshToken },
    });

    // If the token was already consumed by a concurrent request, reject to prevent ghost sessions.
    if (deleted.count === 0) {
      throw new UnauthorizedException('Refresh token already used or revoked');
    }

    return this.generateTokens(userId, email, role, fingerprint);
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
    return { message: 'Logged out successfully' };
  }

  async getSetupStatus(): Promise<{ needsSetup: boolean }> {
    const count = await this.prisma.user.count({ where: { role: 'ADMIN' } });
    return { needsSetup: count === 0 };
  }

  async createFirstAdmin(dto: SetupAdminDto) {
    const count = await this.prisma.user.count({ where: { role: 'ADMIN' } });
    if (count > 0) {
      throw new BadRequestException('Setup already complete — an admin account already exists');
    }
    const email = dto.email.toLowerCase().trim();
    const passwordHash = await argon2.hash(dto.password);
    try {
      const user = await this.prisma.user.create({
        data: { email, name: dto.name, passwordHash, role: 'ADMIN' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatarUrl: true,
          membershipTier: true,
          createdAt: true,
        },
      });
      const tokens = await this.generateTokens(user.id, user.email, user.role);
      return { user, ...tokens };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('An account with this email already exists');
      }
      throw err;
    }
  }

  async generateTokens(userId: string, email: string, role: string, fingerprint?: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      secret: process.env.JWT_SECRET,
    });

    // jti (JWT ID) makes every refresh token unique even when signed within
    // the same second for the same user, preventing DB unique-constraint
    // collisions and enabling per-token revocation.
    // fhp (fingerprint hash) binds the token to a specific client, preventing
    // token replay from different browsers or IPs.
    const refreshPayload: Record<string, any> = { ...payload, jti: uuidv4() };
    if (fingerprint) {
      refreshPayload.fhp = fingerprint;
    }
    const refreshToken = this.jwtService.sign(
      refreshPayload,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        secret: process.env.JWT_REFRESH_SECRET,
      },
    );

    // Purge expired tokens for this user to prevent unbounded table growth.
    await this.prisma.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
