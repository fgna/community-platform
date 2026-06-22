import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private client: S3Client | null = null;
  private bucket: string;
  private publicUrl: string;
  private useLocal: boolean;
  private localDir: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const region = process.env.S3_REGION || 'us-east-1';
    this.bucket = process.env.S3_BUCKET || 'uploads';
    this.publicUrl = process.env.S3_PUBLIC_URL || '';
    this.localDir = path.join(process.cwd(), 'uploads');

    if (endpoint && process.env.S3_ACCESS_KEY && process.env.S3_SECRET_KEY) {
      this.useLocal = false;
      this.client = new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY!,
          secretAccessKey: process.env.S3_SECRET_KEY!,
        },
        forcePathStyle: true,
      });
      this.logger.log(`S3 configured: ${endpoint}/${this.bucket}`);
    } else {
      this.useLocal = true;
      if (!fs.existsSync(this.localDir)) {
        fs.mkdirSync(this.localDir, { recursive: true });
      }
      this.logger.log('S3 not configured, using local disk storage');
    }
  }

  async upload(key: string, body: Buffer, contentType: string): Promise<string> {
    if (this.useLocal) {
      const filePath = path.join(this.localDir, key);
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, body);
      return `/uploads/${key}`;
    }

    await this.client!.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    return this.getPublicUrl(key);
  }

  async delete(key: string): Promise<void> {
    if (this.useLocal) {
      const filePath = path.join(this.localDir, key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return;
    }

    await this.client!.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  getPublicUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    const endpoint = process.env.S3_ENDPOINT || '';
    return `${endpoint}/${this.bucket}/${key}`;
  }
}
