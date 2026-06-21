import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertJournalDto {
  @ApiProperty({ example: 'Today I reflected on my leadership journey...' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'grateful' })
  @IsString()
  @IsOptional()
  mood?: string;
}
