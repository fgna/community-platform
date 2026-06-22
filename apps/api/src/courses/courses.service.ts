import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, userId?: string, userRole?: string) {
    limit = Math.max(1, Math.min(limit, 100));
    page = Math.max(1, page);
    const skip = (page - 1) * limit;
    const where = userRole === 'ADMIN' ? {} : { isPublished: true };
    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { modules: true, progress: true } },
          progress: userId ? { where: { userId } } : false,
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId?: string, userRole?: string) {
    const where: any = { id };
    if (userRole !== 'ADMIN') where.isPublished = true;

    const course = await this.prisma.course.findUnique({
      where,
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } },
          },
        },
        progress: userId ? { where: { userId } } : false,
        _count: { select: { progress: true } },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async create(dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: dto,
      include: {
        modules: { include: { lessons: true } },
        _count: { select: { modules: true } },
      },
    });
  }

  async update(id: string, dto: Partial<CreateCourseDto>) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');

    return this.prisma.course.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    await this.prisma.course.delete({ where: { id } });
    return { message: 'Course deleted' };
  }

  async getProgress(courseId: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: { include: { lessons: { select: { id: true } } } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');

    const progress = await this.prisma.progress.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    const completedLessons: string[] = (progress?.completedLessons as string[]) ?? [];
    return {
      percentage: progress?.percentage ?? 0,
      completedLessons,
      completedAt: progress?.completedAt ?? null,
    };
  }

  async updateProgress(courseId: string, userId: string, percentage: number) {
    if (percentage < 0 || percentage > 100) {
      throw new BadRequestException('Percentage must be between 0 and 100');
    }
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');
    return this.prisma.progress.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: { percentage, completedAt: percentage >= 100 ? new Date() : null },
      create: { userId, courseId, percentage, completedAt: percentage >= 100 ? new Date() : null },
    });
  }

  async completeLesson(courseId: string, userId: string, lessonId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: { include: { lessons: { select: { id: true } } } },
      },
    });
    if (!course) throw new NotFoundException('Course not found');

    const totalLessons = course.modules.flatMap((m) => m.lessons).length;
    if (totalLessons === 0) throw new BadRequestException('Course has no lessons');

    const existing = await this.prisma.progress.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    const completedLessons: string[] = (existing?.completedLessons as string[]) ?? [];
    if (!completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId);
    }

    const percentage = Math.round((completedLessons.length / totalLessons) * 100);

    return this.prisma.progress.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {
        completedLessons,
        percentage,
        completedAt: percentage >= 100 ? new Date() : null,
      },
      create: {
        userId,
        courseId,
        completedLessons,
        percentage,
        completedAt: percentage >= 100 ? new Date() : null,
      },
    });
  }

  async getLesson(lessonId: string, userRole?: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    if (!lesson.module.course.isPublished && userRole !== 'ADMIN') {
      throw new NotFoundException('Lesson not found');
    }
    return lesson;
  }

  async getNote(userId: string, lessonId: string) {
    return this.prisma.courseNote.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });
  }

  async upsertNote(userId: string, lessonId: string, content: string) {
    return this.prisma.courseNote.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      update: { content },
      create: { userId, lessonId, content },
    });
  }
}
