import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20, userId?: string) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where: { isPublished: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { modules: true, progress: true } },
          progress: userId ? { where: { userId } } : false,
        },
      }),
      this.prisma.course.count({ where: { isPublished: true } }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId?: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
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

  async updateProgress(courseId: string, userId: string, percentage: number) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    return this.prisma.progress.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {
        percentage,
        completedAt: percentage >= 100 ? new Date() : null,
      },
      create: {
        userId,
        courseId,
        percentage,
        completedAt: percentage >= 100 ? new Date() : null,
      },
    });
  }

  async getLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }
}
