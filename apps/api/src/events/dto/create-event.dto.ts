import { IsString, IsOptional, IsBoolean, IsDateString, IsInt, IsUrl, MinLength, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description: string;

  @ApiProperty()
  @IsDateString()
  startsAt: string;

  @ApiProperty()
  @IsDateString()
  endsAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isVirtual?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  meetingUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxRsvps?: number;
}
