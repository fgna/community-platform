import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from './s3.service';
import { randomUUID } from 'crypto';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

@Injectable()
export class UploadsService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
  ) {}

  async uploadImage(userId: string, file: Express.Multer.File) {
    if (!IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid image type. Allowed: jpeg, png, gif, webp');
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException('Image too large. Maximum 5MB');
    }
    return this.processUpload(userId, file);
  }

  async uploadFile(userId: string, file: Express.Multer.File) {
    if (!FILE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Allowed: pdf, doc, docx, xls, xlsx');
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File too large. Maximum 20MB');
    }
    return this.processUpload(userId, file);
  }

  private async processUpload(userId: string, file: Express.Multer.File) {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `uploads/${userId}/${randomUUID()}-${sanitized}`;
    const url = await this.s3.upload(key, file.buffer, file.mimetype);

    const upload = await this.prisma.upload.create({
      data: {
        userId,
        key,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url,
      },
    });

    return { url: upload.url, key: upload.key, id: upload.id };
  }

  async deleteUpload(key: string, userId: string, userRole: string) {
    const upload = await this.prisma.upload.findUnique({ where: { key } });
    if (!upload) throw new NotFoundException('Upload not found');
    if (upload.userId !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to delete this upload');
    }

    await this.s3.delete(key);
    await this.prisma.upload.delete({ where: { key } });
    return { message: 'Upload deleted' };
  }
}
