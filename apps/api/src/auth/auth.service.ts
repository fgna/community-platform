import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { InvitesService } from '../invites/invites.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private invitesService: InvitesService,
  ) {}

  async register(dto: RegisterDto) {
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
      throw new ConflictException('Email already registered');
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

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

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

  async refresh(userId: string, email: string, role: string, oldRefreshToken: string) {
    const deleted = await this.prisma.refreshToken.deleteMany({
      where: { token: oldRefreshToken },
    });

    // If the token was already consumed by a concurrent request, reject to prevent ghost sessions.
    if (deleted.count === 0) {
      throw new UnauthorizedException('Refresh token already used or revoked');
    }

    return this.generateTokens(userId, email, role);
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
    return { message: 'Logged out successfully' };
  }

  async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      secret: process.env.JWT_SECRET,
    });

    // jti (JWT ID) makes every refresh token unique even when signed within
    // the same second for the same user, preventing DB unique-constraint
    // collisions and enabling per-token revocation.
    const refreshToken = this.jwtService.sign(
      { ...payload, jti: uuidv4() },
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
