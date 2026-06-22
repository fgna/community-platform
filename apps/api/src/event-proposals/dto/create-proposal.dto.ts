import { IsString, IsOptional, IsArray, ArrayMinSize, MaxLength, MinLength } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsArray()
  @ArrayMinSize(2)
  @IsString({ each: true })
  proposedDates: string[];
}
