import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a leadership development coach for a professional community platform. Your name is "Coach".

Your role:
- Help members develop leadership skills across the GROWTH framework: Growth mindset, Rhythms & habits, Ownership, Willpower & resilience, Teamwork, and Holistic balance
- Provide practical, actionable advice
- Be encouraging but honest
- Reference relevant courses or events from the platform when helpful
- Keep responses concise and focused (2-3 paragraphs max)
- Never make up information about the platform's content — only reference what's provided in context

When platform context is provided, use it to give personalized recommendations. If the user asks about something outside your scope, politely redirect to leadership development topics.`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

@Injectable()
export class AiCoachService {
  private client: Anthropic | null = null;
  private readonly logger = new Logger(AiCoachService.name);

  constructor(private prisma: PrismaService) {
    if (process.env.ANTHROPIC_API_KEY) {
      this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
  }

  async chat(userId: string, message: string, history: ChatMessage[]) {
    if (!this.client) {
      throw new BadRequestException('AI Coach is not configured');
    }

    if (message.length > 2000) {
      throw new BadRequestException('Message too long (max 2000 characters)');
    }

    const context = await this.buildContext(userId);

    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-10).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ];

    const response = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: `${SYSTEM_PROMPT}\n\n${context}`,
      messages,
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    return { message: text };
  }

  isConfigured(): boolean {
    return !!this.client;
  }

  private async buildContext(userId: string): Promise<string> {
    const parts: string[] = [];

    const assessment = await this.prisma.assessment.findFirst({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    });

    if (assessment) {
      const scores = assessment.scores as Record<string, number>;
      const labels: Record<string, string> = {
        G: 'Growth Mindset', R: 'Rhythms & Habits', O: 'Ownership',
        W: 'Willpower & Resilience', T: 'Teamwork', H: 'Holistic Balance',
      };
      const scoreLines = Object.entries(scores)
        .map(([k, v]) => `${labels[k] || k}: ${v.toFixed(1)}/5`)
        .join(', ');
      parts.push(`User's latest GROWTH assessment (${new Date(assessment.completedAt).toLocaleDateString()}): ${scoreLines}. Overall: ${assessment.overallScore.toFixed(1)}/5`);
    }

    const courses = await this.prisma.course.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, description: true },
      take: 10,
    });
    if (courses.length > 0) {
      parts.push('Available courses: ' + courses.map((c) => `"${c.title}" — ${c.description.slice(0, 80)}`).join('; '));
    }

    const events = await this.prisma.event.findMany({
      where: { startsAt: { gte: new Date() } },
      select: { title: true, startsAt: true },
      orderBy: { startsAt: 'asc' },
      take: 5,
    });
    if (events.length > 0) {
      parts.push('Upcoming events: ' + events.map((e) => `"${e.title}" on ${new Date(e.startsAt).toLocaleDateString()}`).join('; '));
    }

    const goals = await this.prisma.goal.findMany({
      where: { userId },
      select: { title: true, status: true },
      take: 5,
    });
    if (goals.length > 0) {
      parts.push('User\'s goals: ' + goals.map((g) => `"${g.title}" (${g.status})`).join(', '));
    }

    if (parts.length === 0) return 'No additional platform context available for this user.';
    return 'Platform context:\n' + parts.join('\n');
  }
}
