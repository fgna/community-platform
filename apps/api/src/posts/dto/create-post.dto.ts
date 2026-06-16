import { IsString, MinLength, MaxLength, IsOptional, IsArray, ArrayMinSize, ArrayMaxSize, IsDateString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePollDto {
  @ApiProperty({ example: 'Which frontend framework do you prefer?' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  question: string;

  @ApiProperty({ example: ['React', 'Vue', 'Svelte'] })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(200, { each: true })
  options: string[];

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

export class CreatePostDto {
  @ApiProperty({ example: 'Hello, community!' })
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePollDto)
  poll?: CreatePollDto;
}
