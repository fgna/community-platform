import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FREE_TIER_LIMITS, PREMIUM_TIER_LIMITS } from '../common/guards/premium-features';

@Injectable()
export class TierService {
  constructor(private prisma: PrismaService) {}

  async getTierInfo(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, membershipTier: true, role: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const isPremium = user.membershipTier === 'PREMIUM' || user.role === 'ADMIN';
    const limits = isPremium ? PREMIUM_TIER_LIMITS : FREE_TIER_LIMITS;

    return {
      tier: user.membershipTier,
      isPremium,
      limits,
    };
  }

  async upgradeTier(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { membershipTier: 'PREMIUM' as any },
      select: { id: true, membershipTier: true },
    });
  }

  async downgradeTier(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { membershipTier: 'FREE' as any },
      select: { id: true, membershipTier: true },
    });
  }

  async setTier(userId: string, tier: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { membershipTier: tier as any },
      select: { id: true, membershipTier: true },
    });
  }
}
