import { IsArray, ValidateNested, IsString, IsInt, Min, Max, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerDto {
  @IsString()
  questionId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  score: number;
}

export class SubmitAssessmentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  @ArrayMinSize(30)
  @ArrayMaxSize(30)
  answers: AnswerDto[];
}
