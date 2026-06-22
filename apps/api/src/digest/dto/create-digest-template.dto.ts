import { IsString, IsOptional, IsBoolean, IsArray, MinLength, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDigestTemplateDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  subject: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  headerHtml?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  footerHtml?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  sections?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accentColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
