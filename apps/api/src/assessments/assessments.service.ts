import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';

const GROWTH_DIMENSIONS = ['G', 'R', 'O', 'W', 'T', 'H'] as const;

const QUESTIONS = [
  // G - Growth mindset
  { id: 'G1', dimension: 'G', text: 'I actively seek out new learning opportunities.' },
  { id: 'G2', dimension: 'G', text: 'I embrace challenges as chances to grow.' },
  { id: 'G3', dimension: 'G', text: 'I am open to feedback, even when it is critical.' },
  { id: 'G4', dimension: 'G', text: 'I regularly reflect on my development progress.' },
  { id: 'G5', dimension: 'G', text: 'I believe my abilities can be developed through effort.' },
  // R - Rhythms & habits
  { id: 'R1', dimension: 'R', text: 'I have consistent daily routines that support my goals.' },
  { id: 'R2', dimension: 'R', text: 'I prioritize my most important tasks each day.' },
  { id: 'R3', dimension: 'R', text: 'I maintain a regular schedule for learning and development.' },
  { id: 'R4', dimension: 'R', text: 'I review and adjust my habits periodically.' },
  { id: 'R5', dimension: 'R', text: 'I protect time for deep, focused work.' },
  // O - Ownership
  { id: 'O1', dimension: 'O', text: 'I take full responsibility for my results.' },
  { id: 'O2', dimension: 'O', text: 'I proactively identify and solve problems.' },
  { id: 'O3', dimension: 'O', text: 'I follow through on my commitments.' },
  { id: 'O4', dimension: 'O', text: 'I hold myself accountable without external pressure.' },
  { id: 'O5', dimension: 'O', text: 'I take initiative rather than waiting to be told what to do.' },
  // W - Willpower & resilience
  { id: 'W1', dimension: 'W', text: 'I persist through setbacks without losing motivation.' },
  { id: 'W2', dimension: 'W', text: 'I manage stress effectively in challenging situations.' },
  { id: 'W3', dimension: 'W', text: 'I can delay gratification for long-term goals.' },
  { id: 'W4', dimension: 'W', text: 'I recover quickly from failures or disappointments.' },
  { id: 'W5', dimension: 'W', text: 'I maintain focus even when tasks are difficult or boring.' },
  // T - Teamwork
  { id: 'T1', dimension: 'T', text: 'I communicate clearly and listen actively.' },
  { id: 'T2', dimension: 'T', text: 'I build trust with colleagues through consistent actions.' },
  { id: 'T3', dimension: 'T', text: 'I contribute to a positive team culture.' },
  { id: 'T4', dimension: 'T', text: 'I resolve conflicts constructively.' },
  { id: 'T5', dimension: 'T', text: 'I support others\' growth and celebrate their successes.' },
  // H - Holistic balance
  { id: 'H1', dimension: 'H', text: 'I maintain a healthy work-life balance.' },
  { id: 'H2', dimension: 'H', text: 'I take care of my physical health regularly.' },
  { id: 'H3', dimension: 'H', text: 'I nurture meaningful personal relationships.' },
  { id: 'H4', dimension: 'H', text: 'I make time for activities that recharge me.' },
  { id: 'H5', dimension: 'H', text: 'I feel aligned between my work and personal values.' },
];

const DIMENSION_LABELS: Record<string, string> = {
  G: 'Growth Mindset',
  R: 'Rhythms & Habits',
  O: 'Ownership',
  W: 'Willpower & Resilience',
  T: 'Teamwork',
  H: 'Holistic Balance',
};

@Injectable()
export class AssessmentsService {
  constructor(private prisma: PrismaService) {}

  getQuestions() {
    return {
      dimensions: GROWTH_DIMENSIONS.map((d) => ({
        key: d,
        label: DIMENSION_LABELS[d],
        questions: QUESTIONS.filter((q) => q.dimension === d),
      })),
      totalQuestions: QUESTIONS.length,
    };
  }

  async submit(userId: string, dto: SubmitAssessmentDto) {
    // SEC-043/044: Validate that submitted questionIds exactly match the expected set
    const validQuestionIds = new Set(QUESTIONS.map((q) => q.id));
    const submittedIds = new Set(dto.answers.map((a) => a.questionId));

    // Check for invalid questionIds
    for (const id of submittedIds) {
      if (!validQuestionIds.has(id)) {
        throw new BadRequestException(`Invalid questionId: ${id}`);
      }
    }

    // Check that all expected questions are answered (exact 1:1 match)
    if (submittedIds.size !== validQuestionIds.size) {
      throw new BadRequestException(
        `Expected exactly ${validQuestionIds.size} unique question answers, got ${submittedIds.size}.`,
      );
    }

    // Check for duplicate questionIds
    if (dto.answers.length !== submittedIds.size) {
      throw new BadRequestException('Duplicate questionIds are not allowed.');
    }

    const scores: Record<string, number> = {};

    for (const dim of GROWTH_DIMENSIONS) {
      const dimAnswers = dto.answers.filter((a) => a.questionId.startsWith(dim));
      const avg = dimAnswers.reduce((sum, a) => sum + a.score, 0) / (dimAnswers.length || 1);
      scores[dim] = Math.round(avg * 100) / 100;
    }

    const overallScore =
      Math.round(
        (Object.values(scores).reduce((sum, s) => sum + s, 0) / GROWTH_DIMENSIONS.length) * 100,
      ) / 100;

    const assessment = await this.prisma.assessment.create({
      data: {
        userId,
        scores,
        overallScore,
      },
    });

    return {
      ...assessment,
      dimensionLabels: DIMENSION_LABELS,
    };
  }

  async findAll(userId: string, page = 1, limit = 10) {
    limit = Math.max(1, Math.min(limit, 50));
    page = Math.max(1, page);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.assessment.findMany({
        where: { userId },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.assessment.count({ where: { userId } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findLatest(userId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    });

    if (!assessment) return null;

    return {
      ...assessment,
      dimensionLabels: DIMENSION_LABELS,
    };
  }
}
