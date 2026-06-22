import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertJournalDto } from './dto/upsert-journal.dto';

export interface JournalPrompt {
  id: number;
  category: string;
  text: string;
}

const CURATED_PROMPTS: JournalPrompt[] = [
  // Reflection
  { id: 0, category: 'Reflection', text: 'What was the most meaningful conversation you had this week?' },
  { id: 1, category: 'Reflection', text: 'What assumption did you challenge today?' },
  { id: 2, category: 'Reflection', text: 'What moment today made you pause and think?' },
  { id: 3, category: 'Reflection', text: 'How has your perspective changed on something recently?' },
  { id: 4, category: 'Reflection', text: 'What did you learn about yourself this week?' },
  { id: 5, category: 'Reflection', text: 'What would you do differently if you could redo today?' },
  // Gratitude
  { id: 6, category: 'Gratitude', text: 'Name three things you are grateful for today.' },
  { id: 7, category: 'Gratitude', text: 'Who made a positive impact on you recently?' },
  { id: 8, category: 'Gratitude', text: 'What small moment brought you joy today?' },
  { id: 9, category: 'Gratitude', text: 'What resource or tool are you thankful to have access to?' },
  { id: 10, category: 'Gratitude', text: 'What is something about your work environment you appreciate?' },
  { id: 11, category: 'Gratitude', text: 'Who is someone you have not thanked yet but should?' },
  // Leadership
  { id: 12, category: 'Leadership', text: 'How did you empower someone on your team today?' },
  { id: 13, category: 'Leadership', text: 'What leadership quality do you most want to develop?' },
  { id: 14, category: 'Leadership', text: 'Describe a decision you made today and how you arrived at it.' },
  { id: 15, category: 'Leadership', text: 'How did you handle a disagreement or conflict recently?' },
  { id: 16, category: 'Leadership', text: 'What is one thing you could delegate to help your team grow?' },
  { id: 17, category: 'Leadership', text: 'How do you ensure every team member feels heard?' },
  // Growth
  { id: 18, category: 'Growth', text: 'What skill are you currently working to improve?' },
  { id: 19, category: 'Growth', text: 'What feedback have you received that changed your perspective?' },
  { id: 20, category: 'Growth', text: 'What book, article, or talk inspired you recently?' },
  { id: 21, category: 'Growth', text: 'What is one habit you want to build this month?' },
  { id: 22, category: 'Growth', text: 'Where are you today compared to where you were a year ago?' },
  { id: 23, category: 'Growth', text: 'What is the next milestone you are working toward?' },
  // Challenge
  { id: 24, category: 'Challenge', text: 'What is the biggest obstacle you are facing right now?' },
  { id: 25, category: 'Challenge', text: 'Describe a recent failure and what you learned from it.' },
  { id: 26, category: 'Challenge', text: 'What situation is currently outside your comfort zone?' },
  { id: 27, category: 'Challenge', text: 'What problem have you been avoiding, and why?' },
  { id: 28, category: 'Challenge', text: 'How do you stay motivated when progress feels slow?' },
  { id: 29, category: 'Challenge', text: 'What is a risk you are considering taking, and what holds you back?' },
];

@Injectable()
export class JournalService {
  constructor(private prisma: PrismaService) {}

  getDailyPrompts(): JournalPrompt[] {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    const totalPrompts = CURATED_PROMPTS.length;
    const prompts: JournalPrompt[] = [];

    for (let i = 0; i < 3; i++) {
      const index = (dayOfYear * 3 + i) % totalPrompts;
      prompts.push(CURATED_PROMPTS[index]);
    }

    return prompts;
  }

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
