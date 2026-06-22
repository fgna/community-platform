import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertJournalDto } from './dto/upsert-journal.dto';

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, month?: string) {
    const where: any = { userId };

    if (month) {
      // month is in YYYY-MM format
      const [year, mon] = month.split('-').map(Number);
      const startDate = new Date(Date.UTC(year, mon - 1, 1));
      const endDate = new Date(Date.UTC(year, mon, 1));
      where.date = {
        gte: startDate,
        lt: endDate,
      };
    }

    return this.prisma.journalEntry.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async findOne(userId: string, date: string) {
    const parsedDate = new Date(date + 'T00:00:00.000Z');
    const entry = await this.prisma.journalEntry.findUnique({
      where: {
        userId_date: { userId, date: parsedDate },
      },
    });

    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }

    return entry;
  }

  async upsert(userId: string, date: string, dto: UpsertJournalDto) {
    const parsedDate = new Date(date + 'T00:00:00.000Z');

    return this.prisma.journalEntry.upsert({
      where: {
        userId_date: { userId, date: parsedDate },
      },
      create: {
        userId,
        date: parsedDate,
        content: dto.content,
        mood: dto.mood,
      },
      update: {
        content: dto.content,
        mood: dto.mood,
      },
    });
  }

  async delete(userId: string, date: string) {
    const parsedDate = new Date(date + 'T00:00:00.000Z');

    const entry = await this.prisma.journalEntry.findUnique({
      where: {
        userId_date: { userId, date: parsedDate },
      },
    });

    if (!entry) {
      throw new NotFoundException('Journal entry not found');
    }

    await this.prisma.journalEntry.delete({
      where: { id: entry.id },
    });

    return { message: 'Journal entry deleted' };
  }

  async getStats(userId: string) {
    const entries = await this.prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      select: { date: true },
    });

    const totalEntries = entries.length;

    // Calculate last 30 days count
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    const last30DaysCount = entries.filter(
      (e) => e.date >= thirtyDaysAgo,
    ).length;

    // Build a set of date strings for streak calculation
    const dateSet = new Set(
      entries.map((e) => {
        const d = new Date(e.date);
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      }),
    );

    // Calculate current streak (consecutive days ending today or yesterday)
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(today);
    // Start from today; if no entry today, check if yesterday has one
    const todayStr = `${checkDate.getUTCFullYear()}-${String(checkDate.getUTCMonth() + 1).padStart(2, '0')}-${String(checkDate.getUTCDate()).padStart(2, '0')}`;
    if (!dateSet.has(todayStr)) {
      // Allow streak to start from yesterday
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = `${checkDate.getUTCFullYear()}-${String(checkDate.getUTCMonth() + 1).padStart(2, '0')}-${String(checkDate.getUTCDate()).padStart(2, '0')}`;
      if (dateSet.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    if (entries.length > 0) {
      const sortedDates = Array.from(dateSet).sort();
      let streak = 1;

      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1] + 'T00:00:00.000Z');
        const currDate = new Date(sortedDates[i] + 'T00:00:00.000Z');
        const diffDays =
          (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          streak++;
        } else {
          longestStreak = Math.max(longestStreak, streak);
          streak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, streak);
    }

    // Build entries by date map for heatmap (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    ninetyDaysAgo.setHours(0, 0, 0, 0);

    const entriesByDate: Record<string, boolean> = {};
    entries.forEach((e) => {
      if (e.date >= ninetyDaysAgo) {
        const d = new Date(e.date);
        const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        entriesByDate[dateStr] = true;
      }
    });

    return {
      currentStreak,
      longestStreak,
      totalEntries,
      last30DaysCount,
      entriesByDate,
    };
  }
}
