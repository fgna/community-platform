import { IsString, IsNotEmpty, IsOptional, MaxLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const VALID_MOODS = [
  'grateful',
  'happy',
  'calm',
  'motivated',
  'reflective',
  'anxious',
  'frustrated',
  'sad',
  'tired',
  'neutral',
] as const;

export class UpsertJournalDto {
  @ApiProperty({ example: 'Today I reflected on my leadership journey...' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  content: string;

  @ApiPropertyOptional({ example: 'grateful', enum: VALID_MOODS })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @IsIn(VALID_MOODS)
  mood?: string;
}
