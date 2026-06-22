import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';

@Injectable()
export class EventProposalsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, userId?: string) {
    limit = Math.max(1, Math.min(limit, 50));
    page = Math.max(1, page);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.eventProposal.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          createdBy: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { votes: true } },
          votes: userId ? { where: { userId }, take: 1 } : false,
        },
      }),
      this.prisma.eventProposal.count(),
    ]);

    const enriched = data.map((p) => {
      const allVotes = (p as any).votes || [];
      return {
        ...p,
        hasVoted: allVotes.length > 0,
        myDateVotes: allVotes[0]?.dateVotes || [],
        votes: undefined,
      };
    });

    return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, userId?: string) {
    const proposal = await this.prisma.eventProposal.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
        votes: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
    });

    if (!proposal) throw new NotFoundException('Proposal not found');

    const dateVoteCounts: Record<string, number> = {};
    const proposedDates = (proposal.proposedDates as string[]) || [];
    proposedDates.forEach((d) => { dateVoteCounts[d] = 0; });

    proposal.votes.forEach((v) => {
      const dv = (v.dateVotes as string[]) || [];
      dv.forEach((d) => {
        if (dateVoteCounts[d] !== undefined) dateVoteCounts[d]++;
      });
    });

    const myVote = userId ? proposal.votes.find((v) => v.userId === userId) : null;

    return {
      ...proposal,
      voteCount: proposal.votes.length,
      dateVoteCounts,
      hasVoted: !!myVote,
      myDateVotes: myVote ? (myVote.dateVotes as string[]) : [],
    };
  }

  async create(userId: string, dto: CreateProposalDto) {
    return this.prisma.eventProposal.create({
      data: {
        title: dto.title,
        description: dto.description,
        proposedDates: dto.proposedDates,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
  }

  async vote(proposalId: string, userId: string, dateVotes: string[] = []) {
    const proposal = await this.prisma.eventProposal.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.status === 'CLOSED') throw new BadRequestException('Proposal is closed');

    return this.prisma.proposalVote.upsert({
      where: {
        proposalId_userId: { proposalId, userId },
      },
      create: {
        proposalId,
        userId,
        dateVotes,
      },
      update: {
        dateVotes,
      },
    });
  }

  async removeVote(proposalId: string, userId: string) {
    try {
      await this.prisma.proposalVote.delete({
        where: {
          proposalId_userId: { proposalId, userId },
        },
      });
    } catch {
      throw new NotFoundException('Vote not found');
    }
    return { message: 'Vote removed' };
  }

  async close(id: string) {
    const proposal = await this.prisma.eventProposal.findUnique({ where: { id } });
    if (!proposal) throw new NotFoundException('Proposal not found');

    return this.prisma.eventProposal.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
  }

  async delete(id: string) {
    const proposal = await this.prisma.eventProposal.findUnique({ where: { id } });
    if (!proposal) throw new NotFoundException('Proposal not found');

    await this.prisma.eventProposal.delete({ where: { id } });
    return { message: 'Proposal deleted' };
  }
}
