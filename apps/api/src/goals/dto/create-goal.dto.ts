import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoalStatus } from '@prisma/client';

export class CreateGoalDto {
  @ApiProperty({ example: 'Complete the leadership course' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Finish all modules by end of Q3' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '2026-09-30T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  targetDate?: string;

  @ApiPropertyOptional({ example: 25 })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  progress?: number;

  @ApiPropertyOptional({ enum: GoalStatus, example: 'ACTIVE' })
  @IsEnum(GoalStatus)
  @IsOptional()
  status?: GoalStatus;
}
