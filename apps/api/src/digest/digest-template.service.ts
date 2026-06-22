import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDigestTemplateDto } from './dto/create-digest-template.dto';
import { UpdateDigestTemplateDto } from './dto/update-digest-template.dto';

@Injectable()
export class DigestTemplateService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDigestTemplateDto) {
    return this.prisma.digestTemplate.create({
      data: {
        name: dto.name,
        subject: dto.subject,
        headerHtml: dto.headerHtml ?? '',
        footerHtml: dto.footerHtml ?? '',
        sections: dto.sections ?? [],
        accentColor: dto.accentColor ?? '#c5a880',
        logoUrl: dto.logoUrl,
        isActive: dto.isActive ?? false,
      },
    });
  }

  async findAll() {
    return this.prisma.digestTemplate.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.digestTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Digest template not found');
    return template;
  }

  async update(id: string, dto: UpdateDigestTemplateDto) {
    await this.findOne(id);
    return this.prisma.digestTemplate.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.findOne(id);
    await this.prisma.digestTemplate.delete({ where: { id } });
    return { message: 'Digest template deleted' };
  }

  async setActive(id: string) {
    await this.findOne(id);
    await this.prisma.$transaction([
      this.prisma.digestTemplate.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      }),
      this.prisma.digestTemplate.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);
    return this.prisma.digestTemplate.findUnique({ where: { id } });
  }

  async renderPreview(id: string): Promise<string> {
    const template = await this.findOne(id);
    const sections = (template.sections as string[]) || [];
    const accentColor = template.accentColor || '#c5a880';

    const sectionHtmlParts = sections.map((section) => {
      switch (section) {
        case 'new_posts':
          return this.renderSectionBlock('New Posts', '3 new discussions this week', accentColor);
        case 'upcoming_events':
          return this.renderSectionBlock('Upcoming Events', '2 events scheduled', accentColor);
        case 'new_courses':
          return this.renderSectionBlock('New Courses', '1 new course available', accentColor);
        case 'community_stats':
          return this.renderSectionBlock('Community Stats', '42 active members, 15 new posts', accentColor);
        default:
          return this.renderSectionBlock(section, 'Custom section content', accentColor);
      }
    });

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin: 0; padding: 0; background: #090d16; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #090d16; padding: 24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
        <!-- Header -->
        <tr><td style="padding: 24px 32px; background: rgba(17,24,39,0.9); border-radius: 12px 12px 0 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
          ${template.logoUrl ? `<img src="${this.escapeHtml(template.logoUrl)}" alt="Logo" style="max-height: 40px; margin-bottom: 12px;" />` : ''}
          ${template.headerHtml || `<div style="font-size: 20px; font-weight: 600; color: ${accentColor};">Community Digest</div>`}
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding: 24px 32px; background: rgba(17,24,39,0.7);">
          <div style="font-size: 16px; color: #f3f4f6;">Hi Member,</div>
          <div style="font-size: 14px; color: #9ca3af; margin-top: 8px;">Here's your digest preview:</div>
        </td></tr>

        <!-- Sections -->
        ${sectionHtmlParts.join('\n')}

        <!-- CTA -->
        <tr><td style="padding: 24px 32px; background: rgba(17,24,39,0.7);">
          <a href="#" style="display: inline-block; padding: 12px 24px; background: ${accentColor}; color: #090d16; font-weight: 600; font-size: 14px; border-radius: 8px; text-decoration: none;">Open Dashboard</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding: 16px 32px; background: rgba(17,24,39,0.7); border-radius: 0 0 12px 12px;">
          ${template.footerHtml || `<div style="font-size: 12px; color: #6b7280; text-align: center;">You're receiving this digest based on your preferences.</div>`}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  private renderSectionBlock(title: string, content: string, accentColor: string): string {
    return `
        <tr><td style="padding: 0 32px 16px; background: rgba(17,24,39,0.7);">
          <div style="padding: 16px; background: rgba(255,255,255,0.03); border-radius: 8px; border-left: 3px solid ${accentColor};">
            <div style="font-size: 14px; font-weight: 600; color: #f3f4f6; margin-bottom: 8px;">${this.escapeHtml(title)}</div>
            <div style="font-size: 13px; color: #9ca3af;">${this.escapeHtml(content)}</div>
          </div>
        </td></tr>`;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
