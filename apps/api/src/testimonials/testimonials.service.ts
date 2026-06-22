import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';

@Injectable()
export class TestimonialsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page = 1, limit = 20) {
    limit = Math.max(1, Math.min(limit, 100));
    page = Math.max(1, page);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.testimonial.findMany({
        where: { isApproved: true },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
        include: {
          author: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      }),
      this.prisma.testimonial.count({ where: { isApproved: true } }),
    ]);

    return { data, total, page, limit };
  }

  async create(userId: string, dto: CreateTestimonialDto) {
    return this.prisma.testimonial.create({
      data: {
        authorId: userId,
        content: dto.content,
        role: dto.role,
      },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  async approve(id: string) {
    const testimonial = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!testimonial) {
      throw new NotFoundException('Testimonial not found');
    }

    return this.prisma.testimonial.update({
      where: { id },
      data: { isApproved: true },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  async toggleFeatured(id: string) {
    const testimonial = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!testimonial) {
      throw new NotFoundException('Testimonial not found');
    }

    return this.prisma.testimonial.update({
      where: { id },
      data: { isFeatured: !testimonial.isFeatured },
      include: {
        author: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  async delete(id: string) {
    const testimonial = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!testimonial) {
      throw new NotFoundException('Testimonial not found');
    }

    await this.prisma.testimonial.delete({ where: { id } });
    return { message: 'Testimonial deleted' };
  }
}
